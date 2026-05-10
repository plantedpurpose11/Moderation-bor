
var {
    Manager, Node
  } = require("erela.js"),
  
    Spotify = require("erela.js-spotify"),
    Deezer = require("erela.js-deezer"),
    Facebook = require("erela.js-facebook"),
    config = require(`${process.cwd()}/botconfig/config.json`),
    clientID = process.env.clientID || config.spotify.clientID,
    clientSecret = process.env.clientSecret || config.spotify.clientSecret;

  // ── Lavalink v4 compatibility layer ──
  // v4 changes: WebSocket at /v4/websocket, REST prefix /v4/, player commands via REST not WS

  var _origMakeRequest = Node.prototype.makeRequest;
  var WebSocket = require("ws");
  var lavalinkSessions = new Map();

  // 1. Capture sessionId from "ready" op, pass everything else through
  var _origMessage = Node.prototype.message;
  Node.prototype.message = function(d) {
    if (Array.isArray(d)) d = Buffer.concat(d);
    else if (d instanceof ArrayBuffer) d = Buffer.from(d);
    var payload = JSON.parse(d.toString());
    if (payload.op === "ready") {
      lavalinkSessions.set(this.options.identifier, payload.sessionId);
      return;
    }
    return _origMessage.call(this, d);
  };

  // 2. Connect to /v4/websocket instead of /
  Node.prototype.connect = function() {
    if (this.connected) return;
    var headers = {
      Authorization: this.options.password,
      "Num-Shards": String(this.manager.options.shards),
      "User-Id": this.manager.options.clientId,
      "Client-Name": this.manager.options.clientName,
    };
    this.socket = new WebSocket(
      "ws" + (this.options.secure ? "s" : "") + "://" + this.address + "/v4/websocket",
      { headers: headers }
    );
    this.socket.on("open", this.open.bind(this));
    this.socket.on("close", this.close.bind(this));
    this.socket.on("message", this.message.bind(this));
    this.socket.on("error", this.error.bind(this));
  };

  // 3. REST helper for player commands
  Node.prototype.restCall = async function(path, method, body) {
    var options = {
      path: "/" + path.replace(/^\//, ""),
      method: method,
      headers: { Authorization: this.options.password },
      headersTimeout: this.options.requestTimeout,
    };
    if (body) {
      options.headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(body);
    }
    try {
      var req = await this.http.request(options);
      this.calls++;
      try { return await req.body.json(); } catch(e) { return true; }
    } catch (err) {
      console.log("[LAVALINK REST]", method, path, err.message);
      return true;
    }
  };

  // 4. Intercept Node.send — convert v3 WS ops to v4 REST calls
  Node.prototype.send = function(data) {
    return new Promise(async (resolve, reject) => {
      if (!data || !data.op) return resolve(false);
      var sid = lavalinkSessions.get(this.options.identifier);
      if (!sid) return resolve(false);
      var guildId = data.guildId;
      var base = "/v4/sessions/" + sid + "/players/" + guildId;
      try {
        switch (data.op) {
          case "voiceUpdate":
            await this.restCall(base, "PATCH", {
              voice: { token: data.event.token, endpoint: data.event.endpoint, sessionId: data.sessionId }
            });
            break;
          case "play":
            var playBody = { track: { encoded: data.track } };
            if (data.startTime) playBody.position = data.startTime;
            if (data.endTime) playBody.endTime = data.endTime;
            if (data.volume !== undefined) playBody.volume = data.volume;
            var playPath = data.noReplace ? base + "?noReplace=true" : base;
            await this.restCall(playPath, "PATCH", playBody);
            break;
          case "stop":
            await this.restCall(base, "PATCH", { track: { encoded: null } });
            break;
          case "pause":
            await this.restCall(base, "PATCH", { paused: data.pause });
            break;
          case "seek":
            await this.restCall(base, "PATCH", { position: data.position });
            break;
          case "volume":
            await this.restCall(base, "PATCH", { volume: data.volume });
            break;
          case "equalizer":
            await this.restCall(base, "PATCH", { filters: { equalizer: data.bands } });
            break;
          case "destroy":
            await this.restCall(base, "DELETE");
            break;
          default:
            return resolve(false);
        }
        resolve(true);
      } catch (err) {
        reject(err);
      }
    });
  };

  // 5. Prefix REST calls with /v4/ and transform loadtracks response
  Node.prototype.makeRequest = async function(endpoint, modify) {
    var v4Endpoint = "/v4/" + endpoint.replace(/^\//, "");
    var result = await _origMakeRequest.call(this, v4Endpoint, modify);
    if (endpoint.includes("loadtracks")) {
      result = transformLoadResponse(result);
    }
    return result;
  };

  function transformLoadResponse(v4) {
    if (!v4 || !v4.loadType) return v4;
    // Already v3 format (has tracks array)
    if (v4.tracks) return v4;
    var typeMap = { track: "TRACK_LOADED", playlist: "PLAYLIST_LOADED", search: "SEARCH_RESULT", empty: "NO_MATCHES", error: "LOAD_FAILED" };
    var v3 = { loadType: typeMap[v4.loadType] || v4.loadType, tracks: [], playlistInfo: { name: "", selectedTrack: -1 }, exception: null };
    if (v4.loadType === "track" && v4.data) {
      v3.tracks = [mapTrack(v4.data)];
    } else if (v4.loadType === "playlist" && v4.data) {
      v3.tracks = (v4.data.tracks || []).map(mapTrack);
      v3.playlistInfo = { name: v4.data.info ? v4.data.info.name : "", selectedTrack: v4.data.info ? v4.data.info.selectedTrack : -1 };
    } else if (v4.loadType === "search" && Array.isArray(v4.data)) {
      v3.tracks = v4.data.map(mapTrack);
    } else if (v4.loadType === "error" && v4.data) {
      v3.exception = v4.data;
    }
    return v3;
  }

  function mapTrack(t) {
    if (!t) return t;
    return { track: t.encoded || t.track, info: t.info || {} };
  }
  module.exports = (client) => {
      if (!clientID || !clientSecret || clientID.length < 5 || clientSecret.length < 5) {
        client.manager = new Manager({
          nodes: collect(config.clientsettings.nodes),
          plugins: [
            new Deezer(),
            new Facebook(),
          ],
          send(id, payload) {
            var guild = client.guilds.cache.get(id);
            if (guild) guild.shard.send(payload);
          },
        });
      } else {
        client.manager = new Manager({
          nodes: collect(config.clientsettings.nodes),
          plugins: [
            new Spotify({
              clientID, //get a clientid from there: https://developer.spotify.com/dashboard
              clientSecret
            }),
            new Deezer(),
            new Facebook(),
          ],
          send(id, payload) {
            var guild = client.guilds.cache.get(id);
            if (guild) guild.shard.send(payload);
          },
        });
      }
      //require the other events
      require("./node_events")(client)
      require("./client_events")(client)
      require("./events")(client)
      require("./musicsystem")(client)
      
  };
  /**
   * @INFO
   * Bot Coded by bestgamershk | https://github?.com/BestGamersHK/discord-js-lavalink-Music-Bot-erela-js
   * @INFO
   * Work for BestGamersHK | discord.gg/rone
   * @INFO
   * Please mention him, when using this Code!
   * @INFO
   */
  

  function collect(node) {
    return node.map(x => {
        
      if (!x.host) throw new RangeError('"host" must be provided');
      if (!x.password) throw new RangeError('"password" must be provided');
      if (typeof x.port !== 'number') throw new RangeError('"port" must be a number');
      if (x.retryAmount && typeof x.retryAmount !== 'number') throw new RangeError('Retry amount must be a number');
      if (x.retryDelay && typeof x.retryDelay !== 'number') throw new RangeError('Retry delay must be a number');
      if (x.secure && typeof x.secure !== 'boolean') throw new RangeError('Secure must be a boolean');

      return {
          host: x.host,
          password: x.password ? x.password : 'youshallnotpass',
          port: x.port && !isNaN(x.port) ? Number(x.port) : 2333,
          identifier: x.identifier || x.host,
          retryAmount: x.retryAmount ? Number(x.retryAmount) : 5,
          retryDelay: x.retryDelay ? Number(x.retryDelay) : 5000,
          secure: x.secure ? x.secure : false
      };
    });
}