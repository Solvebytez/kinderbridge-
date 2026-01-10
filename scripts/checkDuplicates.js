require('dotenv').config({ path: require('path').join(__dirname, '../config.env') });
const { connectToMongoDB, disconnectFromMongoDB } = require('../src/config/database');
const Daycare = require('../src/schemas/DaycareSchema');

async function checkDuplicates() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await connectToMongoDB();
    
    console.log('\n🔍 Checking for duplicate records...\n');
    
    // Test the specific filter
    const region = 'Toronto';
    const filter = {
      region: { $regex: region, $options: 'i' },
      $and: [
        {
          $or: [
            { 'ageGroups.toddler.capacity': { $gt: 0 } },
          ],
        },
      ],
    };
    
    console.log('📋 Filter being tested:');
    console.log(JSON.stringify(filter, null, 2));
    console.log('\n');
    
    // Check 1: Total count
    const totalCount = await Daycare.countDocuments({});
    console.log(`1️⃣  Total daycares in database: ${totalCount}`);
    
    // Check 2: Count with filter
    const filteredCount = await Daycare.countDocuments(filter);
    console.log(`2️⃣  Count with filter (region=Toronto + toddler capacity > 0): ${filteredCount}`);
    
    // Check 3: Check for duplicates by name
    console.log('\n🔍 Checking for duplicate names...');
    const duplicateNames = await Daycare.aggregate([
      {
        $group: {
          _id: '$name',
          count: { $sum: 1 },
          ids: { $push: '$_id' },
        },
      },
      { $match: { count: { $gt: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]);
    
    if (duplicateNames.length > 0) {
      console.log(`   ⚠️  Found ${duplicateNames.length} duplicate names:`);
      duplicateNames.forEach((dup, index) => {
        console.log(`   ${index + 1}. "${dup._id}" - appears ${dup.count} times`);
        console.log(`      IDs: ${dup.ids.slice(0, 3).join(', ')}${dup.ids.length > 3 ? '...' : ''}`);
      });
    } else {
      console.log('   ✅ No duplicate names found');
    }
    
    // Check 4: Check for duplicates by name + address
    console.log('\n🔍 Checking for duplicate name + address combinations...');
    const duplicateNameAddress = await Daycare.aggregate([
      {
        $group: {
          _id: {
            name: '$name',
            address: '$address',
          },
          count: { $sum: 1 },
          ids: { $push: '$_id' },
        },
      },
      { $match: { count: { $gt: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]);
    
    if (duplicateNameAddress.length > 0) {
      console.log(`   ⚠️  Found ${duplicateNameAddress.length} duplicate name+address:`);
      duplicateNameAddress.forEach((dup, index) => {
        console.log(`   ${index + 1}. "${dup._id.name}" at "${dup._id.address}" - appears ${dup.count} times`);
      });
    } else {
      console.log('   ✅ No duplicate name+address found');
    }
    
    // Check 5: Count duplicates in the filtered results
    console.log('\n🔍 Checking for duplicates in filtered results (Toronto + toddler capacity > 0)...');
    const filteredDaycares = await Daycare.find(filter).lean();
    console.log(`   Total records returned: ${filteredDaycares.length}`);
    
    const nameMap = new Map();
    filteredDaycares.forEach((daycare) => {
      const key = daycare.name;
      if (!nameMap.has(key)) {
        nameMap.set(key, []);
      }
      nameMap.get(key).push({
        id: daycare._id,
        name: daycare.name,
        address: daycare.address,
        region: daycare.region,
        city: daycare.city,
      });
    });
    
    const duplicatesInFilter = Array.from(nameMap.entries()).filter(([name, records]) => records.length > 1);
    
    if (duplicatesInFilter.length > 0) {
      console.log(`   ⚠️  Found ${duplicatesInFilter.length} duplicate names in filtered results:`);
      duplicatesInFilter.slice(0, 10).forEach(([name, records], index) => {
        console.log(`   ${index + 1}. "${name}" - appears ${records.length} times:`);
        records.forEach((record, idx) => {
          console.log(`      ${idx + 1}. ID: ${record.id}, Address: ${record.address}, Region: ${record.region}, City: ${record.city}`);
        });
      });
    } else {
      console.log('   ✅ No duplicate names in filtered results');
    }
    
    // Check 6: Check if some records match the filter multiple times due to data structure
    console.log('\n🔍 Checking data structure issues...');
    
    // Check if any record has multiple ageGroups.toddler entries (shouldn't happen but let's check)
    const sampleWithToddler = await Daycare.findOne({
      'ageGroups.toddler.capacity': { $gt: 0 },
    }).lean();
    
    if (sampleWithToddler) {
      console.log('   Sample record structure:');
      console.log(`   Name: ${sampleWithToddler.name}`);
      console.log(`   ageGroups.toddler:`, JSON.stringify(sampleWithToddler.ageGroups?.toddler || {}, null, 6));
      console.log(`   ageGroups keys:`, Object.keys(sampleWithToddler.ageGroups || {}));
    }
    
    // Check 7: Verify the count matches the actual documents returned
    const actualDocuments = await Daycare.find(filter).countDocuments();
    console.log(`\n3️⃣  Actual documents found (using find().countDocuments()): ${actualDocuments}`);
    console.log(`4️⃣  Difference: ${filteredCount - actualDocuments}`);
    
    console.log('\n✅ Duplicate check completed!\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await disconnectFromMongoDB();
    process.exit(0);
  }
}

checkDuplicates();

