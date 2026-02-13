require('dotenv').config();
const mongoose = require('mongoose');

async function dropIndex() {
  if (!process.env.MONGODB_URI) {
    console.error('Error: MONGODB_URI is not defined in .env file.');
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB.');

    const collection = mongoose.connection.collection('miscellaneous');
    
    console.log('Checking for "code_1" index...');
    const indexes = await collection.indexes();
    const indexExists = indexes.some(index => index.name === 'code_1');

    if (indexExists) {
      console.log('Found "code_1" index. Dropping it...');
      await collection.dropIndex('code_1');
      console.log('✅ Successfully dropped "code_1" index.');
    } else {
      console.log('"code_1" index not found. No action needed.');
    }

  } catch (error) {
    console.error('❌ Error dropping index:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

dropIndex();
