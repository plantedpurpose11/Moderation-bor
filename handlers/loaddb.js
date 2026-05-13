// Primary database loader - tries MongoDB first, falls back to Enmap
module.exports = async (client) => {
    const config = require("../botconfig/config.json");
    const mongoUri = config.mongo?.uri || process.env.MONGO_URI;
    
    if (mongoUri) {
        try {
            console.log(`${String("[x] :: ".magenta)}Attempting to use MongoDB...`.brightGreen));
            return require("./loaddb_mongo")(client);
        } catch (e) {
            console.log(`${String("[x] :: ".red)}MongoDB failed, falling back to Enmap...`.brightRed));
        }
    }
    
    console.log(`${String("[x] :: ".magenta)}Using Enmap (local storage)...`.brightGreen));
    return require("./loaddb_enmap")(client);
};