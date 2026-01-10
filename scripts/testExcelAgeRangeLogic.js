require('dotenv').config({ path: require('path').join(__dirname, '../config.env') });
const { connectToMongoDB, disconnectFromMongoDB } = require('../src/config/database');
const Daycare = require('../src/schemas/DaycareSchema');

async function testExcelAgeRangeLogic() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await connectToMongoDB();
    
    console.log('\n🔍 Testing what Excel might be filtering (ageRange field logic)...\n');
    
    const region = 'Toronto';
    
    // Excel likely filters by ageRange field values that include toddler ages
    // Toddlers are typically 18 months to 3 years (1.5 - 3 years)
    // So ageRange strings like "18m - 4 yrs", "Infant - 4 yrs", "18m - 12 yrs" would include toddlers
    
    // Test 1: Count by region only
    const regionOnly = await Daycare.countDocuments({
      region: { $regex: region, $options: 'i' },
    });
    console.log(`1️⃣  Total Toronto daycares: ${regionOnly}`);
    
    // Test 2: Count with capacity filter (what API does)
    const withCapacityFilter = await Daycare.countDocuments({
      region: { $regex: region, $options: 'i' },
      'ageGroups.toddler.capacity': { $gt: 0 },
    });
    console.log(`2️⃣  Toronto + toddler capacity > 0 (API filter): ${withCapacityFilter}`);
    
    // Test 3: Check what ageRange field values exist for Toronto
    console.log('\n📊 AgeRange field values in Toronto (first 30):');
    const ageRangeDist = await Daycare.aggregate([
      { $match: { region: { $regex: region, $options: 'i' } } },
      {
        $group: {
          _id: '$ageRange',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 30 },
    ]);
    
    ageRangeDist.forEach((item, idx) => {
      console.log(`   ${idx + 1}. "${item._id || 'NULL'}" : ${item.count}`);
    });
    
    // Test 4: Excel might be counting ageRange values that include "18m" (18 months = toddler age)
    const ageRangeWith18m = await Daycare.countDocuments({
      region: { $regex: region, $options: 'i' },
      ageRange: { $regex: /18m/i },
    });
    console.log(`\n3️⃣  Toronto + ageRange contains "18m": ${ageRangeWith18m}`);
    
    // Test 5: Excel might count ageRange that starts before 3 years (includes toddlers)
    // Patterns like: "Infant - X", "18m - X", "30m - X" where X >= 3
    const ageRangeIncludesToddler = await Daycare.countDocuments({
      region: { $regex: region, $options: 'i' },
      $or: [
        { ageRange: { $regex: /18m/i } },
        { ageRange: { $regex: /30m/i } },
        { ageRange: { $regex: /Infant.*[4-9]|Infant.*1[0-2]/i } }, // Infant - 4yrs, 5yrs, etc
        { ageRange: { $regex: /^.*[4-9]\s*yrs/i } }, // ends with 4-9 yrs or 10-12 yrs
        { ageRange: { $regex: /Infant.*12/i } },
      ],
    });
    console.log(`4️⃣  Toronto + ageRange includes toddler age ranges: ${ageRangeIncludesToddler}`);
    
    // Test 6: Check if Excel is using a simpler logic - just checking if ageRange field exists and is not "NO"
    const ageRangeNotEmpty = await Daycare.countDocuments({
      region: { $regex: region, $options: 'i' },
      ageRange: { $ne: 'NO', $exists: true },
    });
    console.log(`5️⃣  Toronto + ageRange field exists and not "NO": ${ageRangeNotEmpty}`);
    
    // Test 7: Check what Excel's 1,317 might be - let's see if it's region + any ageRange that overlaps with toddler ages
    // Common patterns that include toddlers: "18m-", "Infant-4", "Infant-5", "Infant-6", "Infant-12", "30m-"
    const excelLikeFilter = {
      region: { $regex: region, $options: 'i' },
      $or: [
        { ageRange: { $regex: /18m/i } },
        { ageRange: { $regex: /30m/i } },
        { ageRange: { $regex: /Infant.*[4-9]\s*yrs/i } },
        { ageRange: { $regex: /Infant.*1[0-2]\s*yrs/i } },
        { ageRange: { $regex: /1m.*[4-9]/i } },
        { ageRange: { $regex: /1m.*1[0-2]/i } },
      ],
    };
    
    const excelLikeCount = await Daycare.countDocuments(excelLikeFilter);
    console.log(`6️⃣  Toronto + ageRange field includes toddler ages (Excel-like): ${excelLikeCount}`);
    
    // Test 8: Check if Excel is just filtering by region + has any ageGroups.toddler field (regardless of capacity)
    const hasToddlerField = await Daycare.countDocuments({
      region: { $regex: region, $options: 'i' },
      'ageGroups.toddler': { $exists: true },
    });
    console.log(`7️⃣  Toronto + has ageGroups.toddler field (any capacity): ${hasToddlerField}`);
    
    // Test 9: Let's check what combination gives us close to 1,317
    // Maybe Excel is: region=Toronto AND (ageRange includes toddler OR capacity > 0)
    const combinedFilter = {
      region: { $regex: region, $options: 'i' },
      $or: [
        { 'ageGroups.toddler.capacity': { $gt: 0 } },
        { ageRange: { $regex: /18m|30m|Infant.*[4-9]|Infant.*1[0-2]/i } },
      ],
    };
    const combinedCount = await Daycare.countDocuments(combinedFilter);
    console.log(`8️⃣  Toronto + (toddler capacity > 0 OR ageRange includes toddler ages): ${combinedCount}`);
    
    console.log('\n✅ Excel ageRange logic test completed!\n');
    console.log('📊 Summary:');
    console.log(`   - API result (capacity > 0): ${withCapacityFilter}`);
    console.log(`   - Excel shows: 1,317`);
    console.log(`   - Difference: ${1317 - withCapacityFilter} extra results in Excel`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await disconnectFromMongoDB();
    process.exit(0);
  }
}

testExcelAgeRangeLogic();

