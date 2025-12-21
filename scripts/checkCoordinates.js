/* eslint-disable no-console */
const dotenv = require("dotenv");
const path = require("path");
const Daycare = require("../src/schemas/DaycareSchema");
const { connectToMongoDB } = require("../src/config/database");

// Load backend env
dotenv.config({ path: path.resolve(__dirname, "..", "config.env") });

async function checkCoordinates() {
  try {
    await connectToMongoDB();
    console.log("✅ Connected to MongoDB\n");

    // Get total count
    const totalCount = await Daycare.countDocuments();
    console.log(`📊 Total daycares: ${totalCount}\n`);

    // Check if coordinates field exists at all
    const withCoordinatesField = await Daycare.countDocuments({
      coordinates: { $exists: true },
    });

    // Check coordinates
    const withValidCoordinates = await Daycare.countDocuments({
      "coordinates.lat": { $ne: 0, $exists: true },
      "coordinates.lng": { $ne: 0, $exists: true },
    });

    const withZeroCoordinates = await Daycare.countDocuments({
      $or: [
        { "coordinates.lat": 0 },
        { "coordinates.lng": 0 },
        { coordinates: { $exists: false } },
        { "coordinates.lat": { $exists: false } },
        { "coordinates.lng": { $exists: false } },
      ],
    });

    console.log("📍 Coordinate Status:");
    console.log(
      `   📦 Records with coordinates field: ${withCoordinatesField}`
    );
    console.log(
      `   ✅ With valid coordinates (lat/lng != 0): ${withValidCoordinates}`
    );
    console.log(
      `   ❌ With zero/missing coordinates: ${withZeroCoordinates}\n`
    );

    // Sample a few records with valid coordinates
    if (withValidCoordinates > 0) {
      console.log("📋 Sample records with valid coordinates:");
      const samples = await Daycare.find({
        "coordinates.lat": { $ne: 0 },
        "coordinates.lng": { $ne: 0 },
      })
        .select("name address city coordinates")
        .limit(5)
        .lean();

      samples.forEach((daycare) => {
        console.log(`   - ${daycare.name} (${daycare.city})`);
        console.log(
          `     Full coordinates object:`,
          JSON.stringify(daycare.coordinates)
        );
        console.log(
          `     lat: ${daycare.coordinates?.lat}, lng: ${daycare.coordinates?.lng}`
        );
      });
      console.log();
    }

    // Get a raw sample to see structure
    console.log("🔍 Raw sample record structure (first record):");
    const rawSample = await Daycare.findOne().lean();
    console.log("Has coordinates field:", rawSample.coordinates !== undefined);
    console.log("Coordinates value:", JSON.stringify(rawSample.coordinates));
    console.log("Coordinates type:", typeof rawSample.coordinates);
    if (rawSample.coordinates) {
      console.log("Coordinates.lat:", rawSample.coordinates.lat);
      console.log("Coordinates.lng:", rawSample.coordinates.lng);
    }
    console.log();

    // Check a record that has coordinates field
    console.log("🔍 Sample record WITH coordinates field:");
    const coordSample = await Daycare.findOne({
      coordinates: { $exists: true },
    }).lean();
    if (coordSample) {
      console.log("Name:", coordSample.name);
      console.log("Address:", coordSample.address);
      console.log("City:", coordSample.city);
      console.log("Coordinates:", JSON.stringify(coordSample.coordinates));
      console.log("Coordinates.lat:", coordSample.coordinates?.lat);
      console.log("Coordinates.lng:", coordSample.coordinates?.lng);
    } else {
      console.log("No records found with coordinates field");
    }
    console.log();

    // Sample a few records with zero coordinates
    if (withZeroCoordinates > 0) {
      console.log("📋 Sample records with zero/missing coordinates:");
      const samples = await Daycare.find({
        $or: [
          { "coordinates.lat": 0 },
          { "coordinates.lng": 0 },
          { "coordinates.lat": { $exists: false } },
          { "coordinates.lng": { $exists: false } },
        ],
      })
        .select("name address city coordinates")
        .limit(5)
        .lean();

      samples.forEach((daycare) => {
        console.log(
          `   - ${daycare.name} (${daycare.city}): lat=${
            daycare.coordinates?.lat || "missing"
          }, lng=${daycare.coordinates?.lng || "missing"}`
        );
      });
      console.log();
    }

    // Check if addresses are available for geocoding
    const withAddress = await Daycare.countDocuments({
      address: { $exists: true, $ne: "", $ne: "NO" },
    });

    console.log("🏠 Address Availability:");
    console.log(`   ✅ With valid address: ${withAddress}`);
    console.log(`   ❌ Without valid address: ${totalCount - withAddress}\n`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

checkCoordinates();
