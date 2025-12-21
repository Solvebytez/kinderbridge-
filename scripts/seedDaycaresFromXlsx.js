/* eslint-disable no-console */
const path = require("path");
const xlsx = require("xlsx");
const dotenv = require("dotenv");
const Daycare = require("../src/schemas/DaycareSchema");
const { connectToMongoDB } = require("../src/config/database");

// Load backend env (supports local seeding without exporting env vars manually)
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

function toIntSafe(v) {
  return Math.round(toNumberSafe(v));
}

function toBoolYesNo(v) {
  const s = toStringSafe(v).toLowerCase();
  if (!s) return false;
  return ["yes", "y", "true", "1"].includes(s);
}

function toEmailOrEmpty(v) {
  const s = toStringSafe(v);
  if (!s) return "";
  // Common placeholders in spreadsheets
  if (["n/a", "na", "none", "-", "--"].includes(s.toLowerCase())) return "";
  const ok = /^\S+@\S+\.\S+$/.test(s);
  return ok ? s : "";
}

function toAgeGroup(row, capacityKey, vacancyKey, ratingKey) {
  return {
    capacity: toIntSafe(row[capacityKey]),
    vacancy: toIntSafe(row[vacancyKey]),
    qualityRating: toNumberSafe(row[ratingKey]),
  };
}

function makeUpsertFilter(doc) {
  // Prefer stable keys. If you have a true unique ID column, we can switch to that.
  return {
    name: doc.name,
    address: doc.address,
  };
}

async function main() {
  const filePath =
    process.argv[2] || path.resolve(__dirname, "..", "daycare data.xlsx");
  const logEach = process.argv.includes("--log-each");
  const logEveryArg = process.argv.find((a) => a.startsWith("--log-every="));
  const logEvery = logEach
    ? 1
    : Math.max(
        0,
        parseInt(logEveryArg ? logEveryArg.split("=")[1] : "0", 10) || 0
      );

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

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const name = toStringSafe(row["Daycare Name"]);
    const address = toStringSafe(row["Address"]);
    const city = toStringSafe(row["City"]);

    if (!name || !address || !city) {
      skipped += 1;
      if (logEach || (logEvery > 0 && (i + 1) % logEvery === 0)) {
        console.log(
          `⏭️  ${i + 1}/${
            rows.length
          } skipped | updated=${updated} created=${created} skipped=${skipped} | missing name/address/city`
        );
      }
      continue;
    }

    const doc = {
      name,
      address,
      city,
      region: toStringOrNo(row["Region"]),
      ward: toStringOrNo(row["City/Ward"]) || toStringOrNo(row["Ward"]),
      cwelcc: toBoolYesNo(row["CWELCC"]),
      subsidyAvailable: toBoolYesNo(row["Subsidy Available?"]),
      price: toNumberSafe(row["Monthly Fee"]),
      priceString: formatPriceString(row["Monthly Fee"]),
      registrationFee: toNumberSafe(row["One time Registration Fee"]),
      daycareType: toStringOrNo(row["Daycare Type"]),
      hours: toStringOrNo(row["Hours of Operation"]),
      programAge: toStringOrNo(row["Program Age"]),
      ageRange: toStringOrNo(row["Program Age"]),
      rating: toNumberSafe(row["Google Reviews"]),
      reviewCount: toIntSafe(row["Number of Google Reviews"]),
      googleReviewSummary: toStringOrNo(row["Google Review Summary"]),
      website: toStringOrNo(row["Website"]),
      email: toEmailOrEmpty(row["Email"]),
      phone: toStringOrNo(row["Phone Number"]),
      registrationInfo: toStringOrNo(row["Registration Info"]),
      formsLink: toStringOrNo(row["Forms Link"]),
      contactUsPage: toStringOrNo(row["Contact Us Page"]),
      ageGroups: {
        infant: toAgeGroup(
          row,
          "Infant Capacity",
          "Infant Vacancy",
          "Infant Quality Rating"
        ),
        toddler: toAgeGroup(
          row,
          "Toddler Capacity",
          "Toddler Vacancy",
          "Toddler Quality Rating"
        ),
        preschool: toAgeGroup(
          row,
          "Preschool Capacity",
          "Preschool Vacancy",
          "Preschool Quality Rating"
        ),
        kindergarten: toAgeGroup(
          row,
          "Kindergarten Capacity",
          "Kindergarten Vacancy",
          "Kindergarten Quality Rating"
        ),
        schoolAge: toAgeGroup(
          row,
          "School Capacity",
          "School Age Vacancy",
          "School Age Quality Rating"
        ),
      },
    };

    const filter = makeUpsertFilter(doc);
    const existing = await Daycare.findOne(filter).select("_id").lean();

    if (existing) {
      await Daycare.updateOne({ _id: existing._id }, { $set: doc });
      updated += 1;
      if (logEach || (logEvery > 0 && (i + 1) % logEvery === 0)) {
        console.log(
          `🔄 ${i + 1}/${
            rows.length
          } updated | updated=${updated} created=${created} skipped=${skipped} | ${name}`
        );
      }
    } else {
      await Daycare.create(doc);
      created += 1;
      if (logEach || (logEvery > 0 && (i + 1) % logEvery === 0)) {
        console.log(
          `✅ ${i + 1}/${
            rows.length
          } created | updated=${updated} created=${created} skipped=${skipped} | ${name}`
        );
      }
    }
  }

  console.log("✅ Done");
  console.log({ created, updated, skipped });
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
