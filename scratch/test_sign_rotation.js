const fs = require('fs');
const { PDFDocument, rgb, degrees } = require('pdf-lib');

async function run() {
  const filePath = '/Users/user/Documents/Framework/react/signease/agents/signed_FINAL_WIN-MAC-LOG-06-002 Monitoring Fuel Ratio Light Vehicle (LV)_Rev0.0 (3) (5).pdf';
  const bytes = fs.readFileSync(filePath);
  const pdfDoc = await PDFDocument.load(bytes);
  const page = pdfDoc.getPages()[0];
  const { width: pW, height: pH } = page.getSize();
  const rotation = page.getRotation().angle;

  console.log(`Dimensions: w=${pW}, h=${pH}, rotation=${rotation}`);
  
  // Let's draw a few test rectangles with different rotations to see how they render.
  // We'll write to a test output file and see.
  // 1. Red rectangle at x=100, y=100, w=200, h=50, no rotation
  page.drawRectangle({
    x: 100,
    y: 100,
    width: 200,
    height: 50,
    color: rgb(1, 0, 0),
  });

  // 2. Green rectangle at x=100, y=300, w=200, h=50, rotate = 90
  page.drawRectangle({
    x: 100,
    y: 300,
    width: 200,
    height: 50,
    color: rgb(0, 1, 0),
    rotate: degrees(90),
  });

  // 3. Blue rectangle at x=100, y=500, w=200, h=50, rotate = -90
  page.drawRectangle({
    x: 100,
    y: 500,
    width: 200,
    height: 50,
    color: rgb(0, 0, 1),
    rotate: degrees(-90),
  });

  const outBytes = await pdfDoc.save();
  fs.writeFileSync('scratch/rotation_test_output.pdf', outBytes);
  console.log("Wrote scratch/rotation_test_output.pdf");
}

run();
