const mongoose = require("mongoose");
const config = require("../botconfig/config.json");

module.exports = {
    connect: async () => {
        const mongoUri = config.mongo?.uri || process.env.MONGO_URI;
        
        if (!mongoUri) {
            console.log(`${String("[x] :: ".red)}MongoDB URI not found! Please add "mongo.uri" to botconfig/config.json or set MONGO_URI environment variable`.brightRed);
            return false;
        }
        
        try {
            console.log(`${String("[x] :: ".magenta)}Connecting to MongoDB...`.brightGreen);
            
            await mongoose.connect(mongoUri, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            });
            
            console.log(`${String("[x] :: ".magenta)}Successfully connected to MongoDB!`.brightGreen);
            
            mongoose.connection.on("error", (err) => {
                console.log(`${String("[x] :: ".red)}MongoDB Error:`.brightRed, err);
            });
            
            mongoose.connection.on("disconnected", () => {
                console.log(`${String("[x] :: ".yellow)}MongoDB disconnected`.brightYellow);
            });
            
            return true;
        } catch (error) {
            console.log(`${String("[x] :: ".red)}Failed to connect to MongoDB:`.brightRed, error.message);
            return false;
        }
    },
    
    disconnect: async () => {
        try {
            await mongoose.disconnect();
            console.log(`${String("[x] :: ".magenta)}Disconnected from MongoDB`.brightGreen);
        } catch (error) {
            console.log(`${String("[x] :: ".red)}Error disconnecting from MongoDB:`.brightRed, error.message);
        }
    }
};