require('dotenv').config({ path: require('path').join(__dirname, '../config.env') });
const { connectToMongoDB, disconnectFromMongoDB } = require('../src/config/database');
const Daycare = require('../src/schemas/DaycareSchema');

async function testRegionVsCity() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await connectToMongoDB();
    
    console.log('\n🔍 Testing Region vs City matching for Toronto...\n');
    
    // Test 1: Count by region = Toronto
    const regionToronto = await Daycare.countDocuments({
      region: { $regex: /^Toronto$/i },
    });
    console.log(`1️⃣  Count with region = "Toronto" (exact match): ${regionToronto}`);
    
    // Test 2: Count by region contains Toronto (regex, case insensitive)
    const regionContainsToronto = await Daycare.countDocuments({
      region: { $regex: /Toronto/i },
    });
    console.log(`2️⃣  Count with region contains "Toronto" (regex): ${regionContainsToronto}`);
    
    // Test 3: Count by city = Toronto
    const cityToronto = await Daycare.countDocuments({
      city: { $regex: /^Toronto$/i },
    });
    console.log(`3️⃣  Count with city = "Toronto" (exact match): ${cityToronto}`);
    
    // Test 4: Count by city contains Toronto
    const cityContainsToronto = await Daycare.countDocuments({
      city: { $regex: /Toronto/i },
    });
    console.log(`4️⃣  Count with city contains "Toronto" (regex): ${cityContainsToronto}`);
    
    // Test 5: Count where region OR city contains Toronto
    const regionOrCityToronto = await Daycare.countDocuments({
      $or: [
        { region: { $regex: /Toronto/i } },
        { city: { $regex: /Toronto/i } },
      ],
    });
    console.log(`5️⃣  Count with region OR city contains "Toronto": ${regionOrCityToronto}`);
    
    // Test 6: Count with region=Toronto + toddler capacity > 0
    const regionTorontoToddlerYes = await Daycare.countDocuments({
      region: { $regex: /Toronto/i },
      'ageGroups.toddler.capacity': { $gt: 0 },
    });
    console.log(`6️⃣  Count with region=Toronto + toddler capacity > 0: ${regionTorontoToddlerYes}`);
    
    // Test 7: Count with (region OR city) contains Toronto + toddler capacity > 0
    const regionOrCityTorontoToddlerYes = await Daycare.countDocuments({
      $or: [
        { region: { $regex: /Toronto/i } },
        { city: { $regex: /Toronto/i } },
      ],
      'ageGroups.toddler.capacity': { $gt: 0 },
    });
    console.log(`7️⃣  Count with (region OR city) Toronto + toddler capacity > 0: ${regionOrCityTorontoToddlerYes}`);
    
    // Test 8: Find records where city=Toronto but region != Toronto
    console.log('\n📊 Records where city contains "Toronto" but region does NOT:');
    const cityButNotRegion = await Daycare.find({
      city: { $regex: /Toronto/i },
      region: { $not: { $regex: /Toronto/i } },
    }).limit(10).lean();
    
    console.log(`   Found ${cityButNotRegion.length} sample records:`);
    cityButNotRegion.forEach((daycare, index) => {
      console.log(`   ${index + 1}. ${daycare.name}`);
      console.log(`      City: ${daycare.city}`);
      console.log(`      Region: ${daycare.region}`);
    });
    
    // Test 9: Count unique region values that contain "Toronto"
    console.log('\n📊 Unique region values containing "Toronto":');
    const uniqueRegions = await Daycare.aggregate([
      { $match: { region: { $regex: /Toronto/i } } },
      {
        $group: {
          _id: '$region',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);
    
    uniqueRegions.forEach((item) => {
      console.log(`   "${item._id}" : ${item.count}`);
    });
    
    // Test 10: Check if Excel might be using a different matching logic
    // Maybe Excel filters by city field instead of region?
    const cityTorontoToddlerYes = await Daycare.countDocuments({
      city: { $regex: /Toronto/i },
      'ageGroups.toddler.capacity': { $gt: 0 },
    });
    console.log(`\n8️⃣  Count with city=Toronto + toddler capacity > 0: ${cityTorontoToddlerYes}`);
    
    console.log('\n✅ Region vs City test completed!\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await disconnectFromMongoDB();
    process.exit(0);
  }
}

testRegionVsCity();

