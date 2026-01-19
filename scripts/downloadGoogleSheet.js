/* eslint-disable no-console */
const https = require("https");
const fs = require("fs");
const path = require("path");

// Google Sheets export URL
const spreadsheetId = "1pVrYLKIctgLWj0veKmzm-4rTrmw9fRVYEFUDcgMADsg";
const sheetId = "0";
const exportUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=xlsx&gid=${sheetId}`;

const outputPath = path.resolve(__dirname, "..", "daycare data.xlsx");

console.log("📥 Downloading Google Sheet...");
console.log(`   URL: ${exportUrl}`);
console.log(`   Output: ${outputPath}\n`);

function downloadFile(url, outputPath, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    if (maxRedirects === 0) {
      reject(new Error("Too many redirects"));
      return;
    }

    const file = fs.createWriteStream(outputPath);
    
    https.get(url, { followRedirect: false }, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        // Handle redirect
        file.close();
        if (fs.existsSync(outputPath)) {
          fs.unlinkSync(outputPath);
        }
        console.log(`   Following redirect (${response.statusCode}) to: ${response.headers.location}`);
        downloadFile(response.headers.location, outputPath, maxRedirects - 1)
          .then(resolve)
          .catch(reject);
      } else if (response.statusCode === 200) {
        const totalBytes = parseInt(response.headers['content-length'] || '0', 10);
        let downloadedBytes = 0;
        
        response.on('data', (chunk) => {
          downloadedBytes += chunk.length;
          if (totalBytes > 0) {
            const percent = ((downloadedBytes / totalBytes) * 100).toFixed(1);
            process.stdout.write(`\r   Downloading: ${percent}% (${(downloadedBytes / 1024 / 1024).toFixed(2)} MB)`);
          }
        });
        
        response.pipe(file);
        file.on("finish", () => {
          file.close();
          console.log("\n✅ Download completed successfully!");
          console.log(`   File saved to: ${outputPath}`);
          resolve();
        });
      } else {
        file.close();
        if (fs.existsSync(outputPath)) {
          fs.unlinkSync(outputPath);
        }
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
      }
    }).on("error", (err) => {
      file.close();
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
      }
      reject(err);
    });
  });
}

downloadFile(exportUrl, outputPath)
  .then(() => {
    console.log("\n✅ Ready to seed database with coordinates!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("\n❌ Download failed:", err.message);
    console.error("\n⚠️  Alternative: Please download manually:");
    console.error("   1. Open the Google Sheet in your browser");
    console.error("   2. File → Download → Microsoft Excel (.xlsx)");
    console.error(`   3. Save as 'daycare data.xlsx' in: ${path.dirname(outputPath)}`);
    process.exit(1);
  });
