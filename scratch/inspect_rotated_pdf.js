const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

async function run() {
  const filePath = '/Users/user/Documents/Framework/react/signease/agents/signed_FINAL_WIN-MAC-LOG-06-002 Monitoring Fuel Ratio Light Vehicle (LV)_Rev0.0 (3) (5).pdf';
  if (!fs.existsSync(filePath)) {
    console.log("File not found:", filePath);
    return;
  }
  const bytes = fs.readFileSync(filePath);
  const pdfDoc = await PDFDocument.load(bytes);
  const pages = pdfDoc.getPages();
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    console.log(`Page ${i + 1} size:`, page.getSize());
    console.log(`Page ${i + 1} rotation:`, page.getRotation());
  }
}

run();
