// Primary database loader - tries MongoDB first, falls back to Enmap
module.exports = async (client) => {
    // Check MONGO_URI env var first, then config (but skip placeholder)
    let mongoUri = process.env.MONGO_URI;
    const config = require("../botconfig/config.json");
    if (!mongoUri && config.mongo?.uri && !config.mongo.uri.includes("process.env")) {
        mongoUri = config.mongo.uri;
    }
    
    if (mongoUri && mongoUri.startsWith("mongodb")) {
        try {
            console.log(`${String("[x] :: ".magenta)}Attempting to use MongoDB...`.brightGreen);
            const mongoLoader = require("./loaddb_mongo");
            return await mongoLoader(client);
        } catch (e) {
            console.log(`${String("[x] :: ".red)}MongoDB failed (${e.message}), falling back to Enmap...`.brightRed);
        }
    }
    
    console.log(`${String("[x] :: ".magenta)}Using Enmap (local storage)...`.brightGreen);
    return require("./loaddb_enmap")(client);
};