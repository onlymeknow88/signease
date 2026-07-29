const fs = require('fs');

const filePath = '/Users/user/Documents/Framework/react/signease/agents/signed_kuitansi_signease_INV-1784986198786-6822.pdf';

if (!fs.existsSync(filePath)) {
  console.log("File not found at path:", filePath);
  process.exit(1);
}

const buffer = fs.readFileSync(filePath);
const text = buffer.toString('latin1');

console.log("File size bytes:", buffer.length);
console.log("Includes /ByteRange?", text.includes('/ByteRange'));
console.log("Includes /Contents?", text.includes('/Contents'));

const byteRangeMatch = text.match(/\/ByteRange\s*\[([^\]]+)\]/);
console.log("ByteRange match:", byteRangeMatch ? byteRangeMatch[0] : "NONE");

const contentsMatch = text.match(/\/Contents\s*<([0-9a-fA-F\s]+?)>/);
console.log("Contents hex match length:", contentsMatch ? contentsMatch[1].replace(/\s/g, '').length : "NONE");

// Check all occurrences of /Contents
const allContents = [...text.matchAll(/\/Contents/g)];
console.log("Total /Contents occurrences in file:", allContents.length);

for (let i = 0; i < allContents.length; i++) {
  const idx = allContents[i].index;
  console.log(`Occurrence ${i} at index ${idx}:`, text.substring(idx, idx + 100));
}
