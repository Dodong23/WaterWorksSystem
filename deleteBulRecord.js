require("dotenv").config();
const { MongoClient } = require("mongodb");

async function deleteRecords() {
  const uri = process.env.MONGODB_URI;

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB Atlas");

    const database = client.db("ngo-records");
    const collection = database.collection("clients");

    const result = await collection.deleteMany({ barangay: 18 });

    console.log(`🗑️ Deleted ${result.deletedCount} document(s)`);
  } catch (error) {
    console.error("❌ Error deleting records:", error);
  } finally {
    await client.close();
    console.log("Connection closed");
  }
}
deleteRecords();
