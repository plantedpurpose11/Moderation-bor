
var {
    Manager, Node
  } = require("erela.js"),
  
    Spotify = require("erela.js-spotify"),
    Deezer = require("erela.js-deezer"),
    Facebook = require("erela.js-facebook"),
    config = require(`${process.cwd()}/botconfig/config.json`),
    clientID = process.env.clientID || config.spotify.clientID,
    clientSecret = process.env.clientSecret || config.spotify.clientSecret;

  // Patch Node to handle the "ready" op sent by Lavalink v4
  var _origMessage = Node.prototype.message;
  Node.prototype.message = function(d) {
    if (Array.isArray(d)) d = Buffer.concat(d);
    else if (d instanceof ArrayBuffer) d = Buffer.from(d);
    var payload = JSON.parse(d.toString());
    if (payload.op === "ready") return;
    return _origMessage.call(this, d);
  };

  // Patch Node.connect for Lavalink v4 WebSocket endpoint (/v4/websocket)
  var _origConnect = Node.prototype.connect;
  var WebSocket = require("ws");
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

  // Patch Node.makeRequest for Lavalink v4 REST API compatibility
  // v4 uses /v4/ prefix and different response format
  var _origMakeRequest = Node.prototype.makeRequest;
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