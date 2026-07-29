const fs = require('fs');
const { PDFDocument, degrees } = require('pdf-lib');

async function run() {
  const filePath = '/Users/user/Documents/Framework/react/signease/agents/signed_FINAL_WIN-MAC-LOG-06-002 Monitoring Fuel Ratio Light Vehicle (LV)_Rev0.0 (3) (5).pdf';
  if (!fs.existsSync(filePath)) {
    console.log("File not found:", filePath);
    return;
  }
  const bytes = fs.readFileSync(filePath);
  const pdfDoc = await PDFDocument.load(bytes);
  const page = pdfDoc.getPages()[0];
  const { width: pW, height: pH } = page.getSize();
  const rotation = page.getRotation().angle;

  console.log(`Page dimensions: w=${pW}, h=${pH}, rotation=${rotation}`);
}

run();
