/* eslint-disable no-console */
const path = require("path");
const xlsx = require("xlsx");
const dotenv = require("dotenv");
const Daycare = require("../src/schemas/DaycareSchema");
const { connectToMongoDB } = require("../src/config/database");

// Load backend env
dotenv.config({ path: path.resolve(__dirname, "..", "config.env") });

function toStringSafe(v) {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function toStringOrNo(v) {
  const s = toStringSafe(v);
  if (!s) return "NO";
  const lower = s.toLowerCase();
  if (["n/a", "na", "none", "-", "--"].includes(lower)) return "NO";
  return s;
}

function toNumberSafe(v) {
  if (v === null || v === undefined || v === "") return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const s = String(v);
  
  // If it's a range like "475-500" or "475$ - 500$", extract the first number
  if (s.includes("-")) {
    const parts = s.split("-");
    if (parts.length >= 2) {
      const firstPart = parts[0].replace(/[^0-9.]/g, "");
      const n = parseFloat(firstPart);
      return Number.isFinite(n) ? n : 0;
    }
  }
  
  // Otherwise, extract all numbers (for single values)
  const cleaned = s.replace(/[^0-9.]/g, "");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Formats the Monthly Fee string from Excel into the desired format:
 * - Ranges: "475$ - 500$" or "1400$ - 1800$"
 * - Single values: "1500$"
 * - Invalid/empty: "NO"
 */
function formatPriceString(monthlyFee) {
  const s = toStringSafe(monthlyFee);
  if (!s) return "NO";
  
  const lower = s.toLowerCase();
  if (["n/a", "na", "none", "-", "--"].includes(lower)) return "NO";
  
  // Remove common suffixes like "/month"
  let cleaned = s.replace(/\/month/gi, "").trim();
  
  // Check if it's a range (contains dash)
  if (cleaned.includes("-")) {
    const parts = cleaned.split("-").map(p => p.trim());
    if (parts.length >= 2) {
      // Extract numbers from both parts
      const minStr = parts[0].replace(/[^0-9.]/g, "").trim();
      const maxStr = parts[1].replace(/[^0-9.]/g, "").trim();
      
      const min = parseFloat(minStr);
      const max = parseFloat(maxStr);
      
      if (!isNaN(min) && !isNaN(max) && min > 0 && max > 0) {
        // Format as "475$ - 500$"
        return `${min}$ - ${max}$`;
      }
    }
  }
  
  // Try to parse as single number
  const numStr = cleaned.replace(/[^0-9.]/g, "").trim();
  const num = parseFloat(numStr);
  if (!isNaN(num) && num > 0) {
    return `${num}$`;
  }
  
  // If we can't parse it, return the cleaned original (might already be formatted)
  return cleaned || "NO";
}

async function main() {
  const filePath =
    process.argv[2] || path.resolve(__dirname, "..", "daycare data.xlsx");

  console.log(`📄 Reading Excel: ${filePath}`);
  const workbook = xlsx.readFile(filePath, { cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const rows = xlsx.utils.sheet_to_json(sheet, {
    defval: "",
    raw: false,
  });

  console.log(`📄 Sheet: ${sheetName}`);
  console.log(`📦 Rows: ${rows.length}`);

  await connectToMongoDB();

  let updated = 0;
  let notFound = 0;
  let errors = 0;

  // Create a map of name+address to Monthly Fee from Excel
  const excelDataMap = new Map();
  for (const row of rows) {
    const name = toStringSafe(row["Daycare Name"]);
    const address = toStringSafe(row["Address"]);
    const monthlyFee = toStringSafe(row["Monthly Fee"]);
    
    if (name && address && monthlyFee) {
      // Try multiple key formats for better matching
      const key1 = `${name}|${address}`;
      const key2 = `${name.toLowerCase().trim()}|${address.toLowerCase().trim()}`;
      const key3 = name.toLowerCase().trim(); // Just name for fallback
      
      // Format priceString properly: "475$ - 500$" or "1400$ - 1800$"
      const formattedPriceString = formatPriceString(monthlyFee);
      
      const data = {
        price: toNumberSafe(monthlyFee),
        priceString: formattedPriceString,
        originalMonthlyFee: monthlyFee
      };
      
      excelDataMap.set(key1, data);
      excelDataMap.set(key2, data);
      excelDataMap.set(key3, data);
    }
  }

  console.log(`\n📊 Found ${excelDataMap.size} entries in Excel file\n`);

  // Get all daycares from database
  const allDaycares = await Daycare.find({}).lean();
  console.log(`🗄️  Found ${allDaycares.length} daycares in database\n`);

  for (let i = 0; i < allDaycares.length; i++) {
    const daycare = allDaycares[i];
    
    // Try multiple matching strategies - prioritize exact matches
    let excelData = excelDataMap.get(`${daycare.name}|${daycare.address}`);
    let matchType = "exact";
    
    if (!excelData) {
      excelData = excelDataMap.get(`${daycare.name?.toLowerCase()?.trim()}|${daycare.address?.toLowerCase()?.trim()}`);
      matchType = "lowercase";
    }
    
    // Only use name-only fallback if we really can't find a match
    // This prevents multiple daycares from matching to the same Excel entry
    if (!excelData) {
      // Try partial address matching
      const dbAddressLower = daycare.address?.toLowerCase()?.trim() || "";
      for (const [key, data] of excelDataMap.entries()) {
        if (key.includes("|")) {
          const [excelName, excelAddress] = key.split("|");
          if (excelName === daycare.name?.toLowerCase()?.trim() && 
              (excelAddress.includes(dbAddressLower) || dbAddressLower.includes(excelAddress))) {
            excelData = data;
            matchType = "partial-address";
            break;
          }
        }
      }
    }

    if (!excelData) {
      notFound++;
      if (notFound <= 5) {
        console.log(`⚠️  Not found in Excel: ${daycare.name} (${daycare.address})`);
      }
      continue;
    }

    try {
      const updateData = {
        price: excelData.price,
        priceString: excelData.priceString,
      };

      // Handle case where price is stored as string like "$1500/month"
      let currentPrice = daycare.price;
      if (typeof currentPrice === "string") {
        // Extract number from string
        currentPrice = toNumberSafe(currentPrice);
      }
      
      // Always update to ensure data matches Excel exactly
      // Compare formatted strings to avoid false positives
      const currentPriceString = daycare.priceString || "NO";
      const needsUpdate = 
        Math.abs(currentPrice - excelData.price) > 0.01 || // Use small epsilon for number comparison
        currentPriceString !== excelData.priceString;

      if (needsUpdate) {
        await Daycare.updateOne(
          { _id: daycare._id },
          { $set: updateData }
        );
        updated++;
        
        if (updated <= 20) {
          console.log(`✅ Updated [${matchType}]: ${daycare.name}`);
          console.log(`   Old: price=${daycare.price} (${typeof daycare.price}), priceString="${daycare.priceString}"`);
          console.log(`   New: price=${excelData.price} (number), priceString="${excelData.priceString}"`);
          console.log(`   Excel original: "${excelData.originalMonthlyFee}"`);
        }
      }
    } catch (error) {
      errors++;
      console.error(`❌ Error updating ${daycare.name}:`, error.message);
    }

    // Progress indicator
    if ((i + 1) % 100 === 0) {
      console.log(`   Processed ${i + 1}/${allDaycares.length}... (updated: ${updated}, notFound: ${notFound})`);
    }
  }

  console.log("\n✅ Update complete!");
  console.log({
    total: allDaycares.length,
    updated,
    notFound,
    errors,
  });

  // Show sample of updated data
  console.log("\n📋 Sample of updated data:");
  const samples = await Daycare.find({ priceString: { $ne: "NO", $exists: true } })
    .select("name price priceString")
    .limit(5)
    .lean();
  
  samples.forEach((d) => {
    console.log(`   ${d.name}: price=${d.price} (${typeof d.price}), priceString="${d.priceString}"`);
  });

  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Update failed:", err);
  process.exit(1);
});

