const mongoose = require('mongoose');

// Test connection strings with provided credentials
const testMongoUri1 = 'mongodb+srv://abhishek:OIyJreToUTxlsXY2@ashitconsulting.it8rdg.mongodb.net';
const testMongoUri2 = 'mongodb+srv://abhishek:OIyJreToUTxlsXY2@ashitconsulting.it8rdg.mongodb.net/daycare_concierge';

async function testConnection() {
  console.log('🔍 Testing MongoDB connection with provided credentials...');
  console.log('📋 Credentials:');
  console.log('   Username: abhishek');
  console.log('   Password: OIyJreToUTxlsXY2');
  console.log('   Database: daycare_concierge');
  console.log('   Cluster: ashitconsulting.it8rdg.mongodb.net\n');
  
  try {
    // Test 1: Connect with database name in URI
    console.log('📌 Test 1: Connecting with database name in URI...');
    console.log(`📡 URI: ${testMongoUri2.replace(/:[^:@]+@/, ':****@')}`);
    
    await mongoose.connect(testMongoUri2, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
      socketTimeoutMS: 15000,
    });
    
    console.log('✅ Connection successful!');
    console.log(`🗄️  Connected to: ${mongoose.connection.host}`);
    console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
    
    // List collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📁 Collections in database:');
    if (collections.length === 0) {
      console.log('   (No collections found - database is empty)');
    } else {
      collections.forEach(col => {
        console.log(`   - ${col.name}`);
      });
    }
    
    // Test 2: Connect using dbName option
    await mongoose.disconnect();
    console.log('\n📌 Test 2: Connecting using dbName option...');
    console.log(`📡 URI: ${testMongoUri1.replace(/:[^:@]+@/, ':****@')}`);
    
    await mongoose.connect(testMongoUri1, {
      dbName: 'daycare_concierge',
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
      socketTimeoutMS: 15000,
    });
    
    console.log('✅ Connection with dbName option successful!');
    console.log(`🗄️  Database: ${mongoose.connection.db.databaseName}`);
    
    // List databases (to see all available)
    const adminDb = mongoose.connection.db.admin();
    const databases = await adminDb.listDatabases();
    console.log('\n📚 All available databases:');
    databases.databases.forEach(db => {
      console.log(`   - ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
    });
    
    await mongoose.disconnect();
    console.log('\n✅ All tests passed! Connection is working correctly.');
    console.log('✅ You can now update config.env with these credentials.');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Connection failed!');
    console.error('Error details:');
    console.error(`   Type: ${error.name}`);
    console.error(`   Message: ${error.message}`);
    
    if (error.message.includes('Authentication failed')) {
      console.error('\n💡 Authentication Issue:');
      console.error('   - Check if username "abhishek" is correct');
      console.error('   - Check if password is correct');
      console.error('   - Verify user has proper permissions in MongoDB Atlas');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      console.error('\n💡 Network Issue:');
      console.error('   - Check internet connection');
      console.error('   - Verify MongoDB Atlas cluster is running');
    } else if (error.message.includes('IP')) {
      console.error('\n💡 IP Whitelist Issue:');
      console.error('   - Add your IP address to MongoDB Atlas Network Access');
      console.error('   - Or allow access from anywhere (0.0.0.0/0) for testing');
    }
    
    process.exit(1);
  }
}

// Run the test
testConnection();

