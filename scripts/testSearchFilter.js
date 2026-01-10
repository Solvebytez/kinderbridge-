require('dotenv').config({ path: require('path').join(__dirname, '../config.env') });
const { connectToMongoDB, disconnectFromMongoDB } = require('../src/config/database');
const Daycare = require('../src/schemas/DaycareSchema');

async function testSearchFilter() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await connectToMongoDB();
    
    console.log('\n🔍 Testing Search Filter: region=Toronto&ageRange=Toddlers&availability=yes\n');
    
    // Parameters from URL
    const region = 'Toronto';
    const ageRange = 'Toddlers';
    const availability = 'yes';
    
    // Build the same filter as the API
    let filter = {};
    
    // Region filter (same as API)
    if (region) {
      filter.region = { $regex: region, $options: 'i' };
    }
    
    // Age range filter (same as API)
    const normalize = (s) => String(s || '').trim().toLowerCase();
    const ageKeyMap = {
      infants: 'infant',
      infant: 'infant',
      toddlers: 'toddler',
      toddler: 'toddler',
      preschool: 'preschool',
      kindergarten: 'kindergarten',
      'school age': 'schoolAge',
      schoolage: 'schoolAge',
    };
    
    let ageRangeArray = [];
    if (ageRange) {
      if (Array.isArray(ageRange)) {
        ageRangeArray = ageRange;
      } else if (typeof ageRange === 'string') {
        const parsed = ageRange.split(',').map((a) => a.trim());
        if (parsed.length > 0) {
          ageRangeArray = parsed;
        }
      }
    }
    
    if (ageRangeArray.length > 0) {
      const groupKeys = ageRangeArray
        .map((a) => ageKeyMap[normalize(a)])
        .filter(Boolean);
      
      if (groupKeys.length > 0) {
        filter.$and = filter.$and || [];
        
        const normalizeAvailability = String(availability || '').trim().toLowerCase();
        
        if (normalizeAvailability === 'no') {
          filter.$and.push({
            $or: groupKeys.flatMap((k) => [
              { [`ageGroups.${k}.capacity`]: { $eq: 0 } },
              { [`ageGroups.${k}.capacity`]: { $exists: false } },
              { [`ageGroups.${k}`]: { $exists: false } },
            ]),
          });
        } else {
          filter.$and.push({
            $or: groupKeys.map((k) => ({
              [`ageGroups.${k}.capacity`]: { $gt: 0 },
            })),
          });
        }
      }
    }
    
    console.log('📋 Filter being applied:');
    console.log(JSON.stringify(filter, null, 2));
    console.log('\n');
    
    // Test 1: Count with only region filter
    const regionOnlyFilter = { region: { $regex: region, $options: 'i' } };
    const regionOnlyCount = await Daycare.countDocuments(regionOnlyFilter);
    console.log(`1️⃣  Count with ONLY region="${region}" filter: ${regionOnlyCount}`);
    
    // Test 2: Count with region + ageRange (no availability)
    const regionAndAgeFilter = {
      region: { $regex: region, $options: 'i' },
      $and: [
        {
          $or: [
            { 'ageGroups.toddler.capacity': { $gt: 0 } },
          ],
        },
      ],
    };
    const regionAndAgeCount = await Daycare.countDocuments(regionAndAgeFilter);
    console.log(`2️⃣  Count with region + ageRange (capacity > 0): ${regionAndAgeCount}`);
    
    // Test 3: Count with full filter (region + ageRange + availability)
    const fullFilterCount = await Daycare.countDocuments(filter);
    console.log(`3️⃣  Count with FULL filter (region + ageRange + availability=yes): ${fullFilterCount}`);
    
    // Test 4: Check sample records that match
    console.log('\n📊 Sample records that match the filter:');
    const sampleDaycares = await Daycare.find(filter).limit(5).lean();
    sampleDaycares.forEach((daycare, index) => {
      console.log(`\n   ${index + 1}. ${daycare.name}`);
      console.log(`      Region: ${daycare.region}`);
      console.log(`      Toddler capacity: ${daycare.ageGroups?.toddler?.capacity ?? 'N/A'}`);
      console.log(`      AgeGroups structure:`, JSON.stringify(daycare.ageGroups?.toddler || {}, null, 8));
    });
    
    // Test 5: Check records that match region but NOT the ageRange filter
    console.log('\n🔍 Checking records in Toronto that DON\'T match ageRange filter:');
    const regionMatchButNotAgeRange = {
      region: { $regex: region, $options: 'i' },
      $nor: [
        {
          $or: [
            { 'ageGroups.toddler.capacity': { $gt: 0 } },
          ],
        },
      ],
    };
    const notMatchingCount = await Daycare.countDocuments(regionMatchButNotAgeRange);
    console.log(`   Count: ${notMatchingCount}`);
    
    // Test 6: Check records with missing or zero capacity
    const missingOrZeroCapacity = {
      region: { $regex: region, $options: 'i' },
      $or: [
        { 'ageGroups.toddler.capacity': { $exists: false } },
        { 'ageGroups.toddler.capacity': 0 },
        { 'ageGroups.toddler.capacity': null },
        { 'ageGroups.toddler': { $exists: false } },
      ],
    };
    const missingOrZeroCount = await Daycare.countDocuments(missingOrZeroCapacity);
    console.log(`   Records with missing/zero/null toddler capacity: ${missingOrZeroCount}`);
    
    // Test 7: Check records with toddler capacity > 0 but not matching for some reason
    console.log('\n🔍 Breakdown by capacity values:');
    const capacityBreakdown = await Daycare.aggregate([
      { $match: { region: { $regex: region, $options: 'i' } } },
      {
        $group: {
          _id: {
            capacity: { $ifNull: ['$ageGroups.toddler.capacity', 'missing'] },
            hasField: { $cond: [{ $ifNull: ['$ageGroups.toddler', false] }, 'exists', 'missing'] },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.capacity': 1 } },
    ]);
    
    capacityBreakdown.forEach((item) => {
      console.log(`   Capacity: ${item._id.capacity}, Field exists: ${item._id.hasField}, Count: ${item.count}`);
    });
    
    // Test 8: Check if there are records with capacity as string
    console.log('\n🔍 Checking for data type issues (string vs number):');
    const stringCapacitySample = await Daycare.findOne({
      region: { $regex: region, $options: 'i' },
      'ageGroups.toddler.capacity': { $type: 'string' },
    }).lean();
    
    if (stringCapacitySample) {
      console.log('   ⚠️  Found record with STRING capacity:');
      console.log(`   Name: ${stringCapacitySample.name}`);
      console.log(`   Capacity type: ${typeof stringCapacitySample.ageGroups?.toddler?.capacity}`);
      console.log(`   Capacity value: ${JSON.stringify(stringCapacitySample.ageGroups?.toddler?.capacity)}`);
    } else {
      console.log('   ✅ No records with string capacity found');
    }
    
    console.log('\n✅ Filter test completed!\n');
    console.log(`📊 Summary:`);
    console.log(`   - Region only: ${regionOnlyCount}`);
    console.log(`   - Region + AgeRange: ${regionAndAgeCount}`);
    console.log(`   - Full filter: ${fullFilterCount}`);
    console.log(`   - Difference: ${regionOnlyCount - fullFilterCount} records excluded by ageRange filter`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await disconnectFromMongoDB();
    process.exit(0);
  }
}

testSearchFilter();

