const mongoose = require("mongoose");
const Enmap = require("enmap");
const config = require("../botconfig/config.json");

// MongoDB Collection Schemas
const schemas = {
    notes: new mongoose.Schema({ _id: String, data: mongoose.Schema.Types.Mixed }, { _id: false }),
    economy: new mongoose.Schema({ _id: String, data: mongoose.Schema.Types.Mixed }, { _id: false }),
    InviteData: new mongoose.Schema({ _id: String, data: mongoose.Schema.Types.Mixed }, { _id: false }),
    youtube_log: new mongoose.Schema({ _id: String, data: mongoose.Schema.Types.Mixed }, { _id: false }),
    premium: new mongoose.Schema({ _id: String, data: mongoose.Schema.Types.Mixed }, { _id: false }),
    mutes: new mongoose.Schema({ _id: String, data: mongoose.Schema.Types.Mixed }, { _id: false }),
    snipes: new mongoose.Schema({ _id: String, data: mongoose.Schema.Types.Mixed }, { _id: false }),
    stats: new mongoose.Schema({ _id: String, data: mongoose.Schema.Types.Mixed }, { _id: false }),
    afkDB: new mongoose.Schema({ _id: String, data: mongoose.Schema.Types.Mixed }, { _id: false }),
    musicsettings: new mongoose.Schema({ _id: String, data: mongoose.Schema.Types.Mixed }, { _id: false }),
    settings: new mongoose.Schema({ _id: String, data: mongoose.Schema.Types.Mixed }, { _id: false }),
    jointocreatemap: new mongoose.Schema({ _id: String, data: mongoose.Schema.Types.Mixed }, { _id: false }),
    joinvc: new mongoose.Schema({ _id: String, data: mongoose.Schema.Types.Mixed }, { _id: false }),
    setups: new mongoose.Schema({ _id: String, data: mongoose.Schema.Types.Mixed }, { _id: false }),
    queuesaves: new mongoose.Schema({ _id: String, data: mongoose.Schema.Types.Mixed }, { _id: false }),
    actions: new mongoose.Schema({ _id: String, data: mongoose.Schema.Types.Mixed }, { _id: false }),
    userProfiles: new mongoose.Schema({ _id: String, data: mongoose.Schema.Types.Mixed }, { _id: false }),
    jtcsettings: new mongoose.Schema({ _id: String, data: mongoose.Schema.Types.Mixed }, { _id: false }),
    roster: new mongoose.Schema({ _id: String, data: mongoose.Schema.Types.Mixed }, { _id: false }),
    autosupport: new mongoose.Schema({ _id: String, data: mongoose.Schema.Types.Mixed }, { _id: false }),
    menuapply: new mongoose.Schema({ _id: String, data: mongoose.Schema.Types.Mixed }, { _id: false }),
    apply: new mongoose.Schema({ _id: String, data: mongoose.Schema.Types.Mixed }, { _id: false }),
    points: new mongoose.Schema({ _id: String, data: mongoose.Schema.Types.Mixed }, { _id: false }),
    voicepoints: new mongoose.Schema({ _id: String, data: mongoose.Schema.Types.Mixed }, { _id: false }),
    reactionrole: new mongoose.Schema({ _id: String, data: mongoose.Schema.Types.Mixed }, { _id: false }),
    social_log: new mongoose.Schema({ _id: String, data: mongoose.Schema.Types.Mixed }, { _id: false }),
    blacklist: new mongoose.Schema({ _id: String, data: mongoose.Schema.Types.Mixed }, { _id: false }),
    customcommands: new mongoose.Schema({ _id: String, data: mongoose.Schema.Types.Mixed }, { _id: false }),
    keyword: new mongoose.Schema({ _id: String, data: mongoose.Schema.Types.Mixed }, { _id: false }),
};

// MongoDB-based Enmap-like class
class MongoEnmap extends Enmap {
    constructor(name, options = {}) {
        super(options);
        this.name = name;
        this.model = mongoose.models[name] || mongoose.model(name, schemas[name] || new mongoose.Schema({ _id: String, data: mongoose.Schema.Types.Mixed }, { _id: false }));
    }

    async init() {
        try {
            const docs = await this.model.find();
            for (const doc of docs) {
                this.set(doc._id, doc.data);
            }
            console.log(`${String("[x] :: ".magenta)}Loaded ${this.name} with ${this.size} entries`.brightGreen);
        } catch (e) {
            console.log(`${String("[x] :: ".red)}Error loading ${this.name}:`.brightRed, e.message);
        }
    }

    async save(key, value) {
        if (value === undefined) {
            this.delete(key);
            await this.model.deleteOne({ _id: key });
        } else {
            this.set(key, value);
            await this.model.findOneAndUpdate(
                { _id: key },
                { _id: key, data: value },
                { upsert: true, new: true }
            );
        }
    }

    async delete(key) {
        super.delete(key);
        await this.model.deleteOne({ _id: key });
    }

    async clear() {
        super.clear();
        await this.model.deleteMany({});
    }
    
    async fetch(key) {
        return this.get(key);
    }
    
    ensure(key, defaults) {
        if (!this.has(key)) {
            this.set(key, defaults);
            this.save(key, defaults);
        }
        return this.get(key);
    }
}

module.exports = async (client) => {
    let dateNow = Date.now();
    console.log(`${String("[x] :: ".magenta)}Now loading the MongoDB Database...`.brightGreen);
    
    const mongoUri = config.mongo?.uri || process.env.MONGO_URI;
    
    if (!mongoUri) {
        console.log(`${String("[x] :: ".red)}MongoDB URI not found! Falling back to Enmap...`.brightRed);
        return require("./loaddb_enmap")(client);
    }
    
    try {
        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log(`${String("[x] :: ".magenta)}Connected to MongoDB!`.brightGreen);
        
        // Load all collections
        const dbNames = Object.keys(schemas);
        for (const name of dbNames) {
            if (!mongoose.models[name]) {
                mongoose.model(name, schemas[name]}
            }
            client[name] = new MongoEnmap(name);
            await client[name].init();
        }
        
        console.log(`[x] :: `.magenta + `LOADED THE DATABASES after: `.brightGreen + `${Date.now() - dateNow}ms`.green);
        
    } catch (error) {
        console.log(`${String("[x] :: ".red)}MongoDB Error: ${error.message}. Falling back to Enmap...`.brightRed);
        return require("./loaddb_enmap")(client);
    }
};