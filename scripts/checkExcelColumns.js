/* eslint-disable no-console */
const path = require("path");
const xlsx = require("xlsx");

const filePath = path.resolve(__dirname, "..", "daycare data.xlsx");

console.log(`📄 Reading Excel: ${filePath}`);
const workbook = xlsx.readFile(filePath, { cellDates: true });
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

const rows = xlsx.utils.sheet_to_json(sheet, {
  defval: "",
  raw: false,
  header: 1, // Get as array of arrays
});

console.log(`📄 Sheet: ${sheetName}`);
console.log(`📦 Total rows: ${rows.length}\n`);

// Get headers from first row
const headers = rows[0] || [];

console.log("📋 All Column Headers:");
headers.forEach((header, index) => {
  if (header) {
    console.log(`   Column ${index}: "${header}"`);
  }
});

// Check specifically for latitude/longitude
const latIndex = headers.findIndex(h => h && h.toString().toLowerCase().includes("lat"));
const lngIndex = headers.findIndex(h => h && h.toString().toLowerCase().includes("long"));

console.log("\n📍 Coordinate Column Check:");
console.log(`   Latitude column: ${latIndex >= 0 ? `Found at index ${latIndex} - "${headers[latIndex]}"` : "NOT FOUND"}`);
console.log(`   Longitude column: ${lngIndex >= 0 ? `Found at index ${lngIndex} - "${headers[lngIndex]}"` : "NOT FOUND"}`);

// Check sample data if columns exist
if (latIndex >= 0 && lngIndex >= 0 && rows.length > 1) {
  console.log("\n📊 Sample Coordinate Data (first 5 rows):");
  for (let i = 1; i <= Math.min(5, rows.length - 1); i++) {
    const row = rows[i];
    const lat = row[latIndex];
    const lng = row[lngIndex];
    console.log(`   Row ${i + 1}: lat=${lat}, lng=${lng}`);
  }
}

