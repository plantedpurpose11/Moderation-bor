// Primary database loader - tries MongoDB first, falls back to Enmap
module.exports = async (client) => {
    const config = require("../botconfig/config.json");
    const mongoUri = config.mongo?.uri || process.env.MONGO_URI;
    
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