// Primary database loader - uses Enmap for now
// MongoDB support can be added when mongoose is properly installed
module.exports = async (client) => {
    console.log(`${String("[x] :: ".magenta)}Using Enmap (local storage)...`.brightGreen);
    return require("./loaddb_enmap")(client);
};