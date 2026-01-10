require('dotenv').config({ path: require('path').join(__dirname, '../config.env') });
const { connectToMongoDB, disconnectFromMongoDB } = require('../src/config/database');
const Daycare = require('../src/schemas/DaycareSchema');

async function testExcelFilter() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await connectToMongoDB();
    
    console.log('\n🔍 Testing what Excel might be filtering...\n');
    
    const region = 'Toronto';
    
    // Test 1: Count by region only
    const regionOnly = await Daycare.countDocuments({
      region: { $regex: region, $options: 'i' },
    });
    console.log(`1️⃣  Total Toronto daycares: ${regionOnly}`);
    
    // Test 2: Count by region + ageRange field (string field, not ageGroups)
    // Excel might be filtering by the ageRange string field
    const ageRangeFieldMatch = await Daycare.countDocuments({
      region: { $regex: region, $options: 'i' },
      ageRange: { $regex: /toddler/i },
    });
    console.log(`2️⃣  Toronto + ageRange field contains "toddler": ${ageRangeFieldMatch}`);
    
    // Test 3: Check what values are in the ageRange field
    console.log('\n📊 Checking ageRange field values in Toronto daycares:');
    const ageRangeValues = await Daycare.aggregate([
      { $match: { region: { $regex: region, $options: 'i' } } },
      {
        $group: {
          _id: '$ageRange',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]);
    
    ageRangeValues.forEach((item) => {
      console.log(`   "${item._id || 'NULL'}" : ${item.count}`);
    });
    
    // Test 4: Count if Excel is NOT filtering by capacity at all
    // Just region + checking if toddler ageGroup exists (regardless of capacity)
    const hasToddlerAgeGroup = await Daycare.countDocuments({
      region: { $regex: region, $options: 'i' },
      'ageGroups.toddler': { $exists: true },
    });
    console.log(`\n3️⃣  Toronto + has ageGroups.toddler field (any capacity): ${hasToddlerAgeGroup}`);
    
    // Test 5: Count if Excel checks for capacity >= 1 or capacity exists
    const capacityExistsOrGreater = await Daycare.countDocuments({
      region: { $regex: region, $options: 'i' },
      $or: [
        { 'ageGroups.toddler.capacity': { $gte: 1 } },
        { 'ageGroups.toddler.capacity': { $exists: true, $ne: null } },
      ],
    });
    console.log(`4️⃣  Toronto + toddler capacity >= 1 or exists: ${capacityExistsOrGreater}`);
    
    // Test 6: Sample records to see what Excel might be counting
    console.log('\n📋 Sample records with different capacity values:');
    
    // Sample with capacity = 0
    const zeroCapacity = await Daycare.findOne({
      region: { $regex: region, $options: 'i' },
      'ageGroups.toddler.capacity': 0,
    }).lean();
    if (zeroCapacity) {
      console.log(`\n   Sample with capacity=0:`);
      console.log(`   Name: ${zeroCapacity.name}`);
      console.log(`   Region: ${zeroCapacity.region}`);
      console.log(`   ageRange field: ${zeroCapacity.ageRange}`);
      console.log(`   ageGroups.toddler:`, JSON.stringify(zeroCapacity.ageGroups?.toddler || {}, null, 6));
    }
    
    // Test 7: Check if there are records where ageRange field has "Toddlers" but capacity is 0
    const ageRangeToddlerButZeroCapacity = await Daycare.countDocuments({
      region: { $regex: region, $options: 'i' },
      ageRange: { $regex: /toddler/i },
      'ageGroups.toddler.capacity': 0,
    });
    console.log(`\n5️⃣  Toronto + ageRange contains "toddler" + capacity = 0: ${ageRangeToddlerButZeroCapacity}`);
    
    // Test 8: Check if Excel counts records where ageRange field contains "Toddlers" regardless of capacity
    const ageRangeContainsToddler = await Daycare.countDocuments({
      region: { $regex: region, $options: 'i' },
      $or: [
        { ageRange: { $regex: /toddler/i } },
        { 'ageRange': { $regex: /Toddlers/i } },
      ],
    });
    console.log(`6️⃣  Toronto + ageRange field contains "Toddler" or "Toddlers": ${ageRangeContainsToddler}`);
    
    console.log('\n✅ Excel filter test completed!\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await disconnectFromMongoDB();
    process.exit(0);
  }
}

testExcelFilter();

