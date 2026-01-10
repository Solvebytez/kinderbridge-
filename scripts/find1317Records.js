require('dotenv').config({ path: require('path').join(__dirname, '../config.env') });
const { connectToMongoDB, disconnectFromMongoDB } = require('../src/config/database');
const Daycare = require('../src/schemas/DaycareSchema');

async function find1317Records() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await connectToMongoDB();
    
    console.log('\n🔍 Trying to find what Excel\'s 1,317 results might be...\n');
    
    // Test various combinations to get close to 1,317
    console.log('📊 Testing different filter combinations:\n');
    
    // Test 1: Region contains Toronto (broader)
    const test1 = await Daycare.countDocuments({
      region: { $regex: /Toronto/i },
    });
    console.log(`1️⃣  region contains "Toronto": ${test1}`);
    
    // Test 2: City contains Toronto
    const test2 = await Daycare.countDocuments({
      city: { $regex: /Toronto/i },
      'ageGroups.toddler.capacity': { $gt: 0 },
    });
    console.log(`2️⃣  city contains "Toronto" + toddler capacity > 0: ${test2}`);
    
    // Test 3: Region OR city contains Toronto + capacity > 0
    const test3 = await Daycare.countDocuments({
      $or: [
        { region: { $regex: /Toronto/i } },
        { city: { $regex: /Toronto/i } },
      ],
      'ageGroups.toddler.capacity': { $gt: 0 },
    });
    console.log(`3️⃣  (region OR city) contains "Toronto" + toddler capacity > 0: ${test3}`);
    
    // Test 4: Maybe Excel is NOT filtering by capacity at all - just region
    const test4 = await Daycare.countDocuments({
      region: { $regex: /Toronto/i },
    });
    console.log(`4️⃣  region contains "Toronto" (NO capacity filter): ${test4}`);
    
    // Test 5: Check all unique regions to see if any might be counted as "Toronto"
    console.log('\n📊 All unique regions in database:');
    const allRegions = await Daycare.aggregate([
      {
        $group: {
          _id: '$region',
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    
    allRegions.forEach((item) => {
      if (item._id && item._id.toLowerCase().includes('toronto')) {
        console.log(`   "${item._id}" : ${item.count}`);
      }
    });
    
    // Test 6: Maybe Excel counts records where ANY region field contains Toronto (case variations)
    const test6 = await Daycare.countDocuments({
      $or: [
        { region: /Toronto/i },
        { region: /toronto/i },
        { city: /Toronto/i },
      ],
      'ageGroups.toddler.capacity': { $gt: 0 },
    });
    console.log(`\n5️⃣  (region/city) contains "Toronto" (case variations) + capacity > 0: ${test6}`);
    
    // Test 7: Check if Excel might be counting ALL records with toddler capacity > 0 (ignoring region)
    const test7 = await Daycare.countDocuments({
      'ageGroups.toddler.capacity': { $gt: 0 },
    });
    console.log(`6️⃣  ALL records with toddler capacity > 0 (NO region filter): ${test7}`);
    
    // Test 8: Maybe Excel uses a different region value - check what region values exist
    console.log('\n📊 Checking for region values that might be considered "Toronto":');
    const torontoRelatedRegions = await Daycare.aggregate([
      {
        $match: {
          $or: [
            { region: { $regex: /Toronto/i } },
            { city: { $regex: /Toronto/i } },
          ],
        },
      },
      {
        $group: {
          _id: {
            region: '$region',
            city: '$city',
          },
          count: { $sum: 1 },
          hasToddlerCapacity: {
            $sum: {
              $cond: [{ $gt: ['$ageGroups.toddler.capacity', 0] }, 1, 0],
            },
          },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]);
    
    console.log('   Top region/city combinations with "Toronto":');
    torontoRelatedRegions.slice(0, 10).forEach((item, idx) => {
      console.log(`   ${idx + 1}. Region: "${item._id.region}", City: "${item._id.city}"`);
      console.log(`      Total: ${item.count}, With toddler capacity > 0: ${item.hasToddlerCapacity}`);
    });
    
    // Test 9: Maybe the Google Sheet has more records - check total count
    const totalInDB = await Daycare.countDocuments({});
    console.log(`\n7️⃣  Total records in database: ${totalInDB}`);
    
    // Test 10: Check if maybe Excel is using a simpler filter - just checking if toddler exists
    const test10 = await Daycare.countDocuments({
      region: { $regex: /Toronto/i },
      'ageGroups.toddler': { $exists: true },
    });
    console.log(`8️⃣  region=Toronto + toddler ageGroup exists (any capacity): ${test10}`);
    
    console.log('\n💡 Key Insight:');
    console.log(`   Excel shows: 1,317`);
    console.log(`   Total Toronto: ${test1}`);
    console.log(`   Toronto + toddler capacity > 0: 878`);
    console.log(`   Difference: ${1317 - 878} = 439 extra records in Excel`);
    console.log(`   This suggests Excel might NOT be filtering by capacity, or using different criteria.`);
    
    console.log('\n✅ Analysis completed!\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await disconnectFromMongoDB();
    process.exit(0);
  }
}

find1317Records();

