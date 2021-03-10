const mongoClient = require('mongodb').MongoClient;

async function connect(mongoUrl, dbName) {
    let client = await mongoClient.connect(mongoUrl, {
        useUnifiedTopology: true
    });

    let db = client.db(dbName);
    console.log("Database connected")
    return db;
}

module.exports = {
    connect
}