const fs = require('fs');
const { PDFDocument, degrees, rgb } = require('pdf-lib');

async function run() {
  const filePath = '/Users/user/Documents/Framework/react/signease/agents/signed_FINAL_WIN-MAC-LOG-06-002 Monitoring Fuel Ratio Light Vehicle (LV)_Rev0.0 (3) (5).pdf';
  const bytes = fs.readFileSync(filePath);
  const pdfDoc = await PDFDocument.load(bytes);
  const page = pdfDoc.getPages()[0];
  const { width: pW, height: pH } = page.getSize();
  const rotation = page.getRotation().angle;

  console.log(`Page size: w=${pW}, h=${pH}, rotation=${rotation}`);



  // Let's test the coordinates with rotation = 90
  // Screen ratios:
  // xRatio = 0.5 (center), yRatio = 0.5 (center)
  // widthRatio = 0.3, heightRatio = 0.1
  const ann = {
    xRatio: 0.5,
    yRatio: 0.5,
    widthRatio: 0.3,
    heightRatio: 0.1,
  };

  let x, y, w, h;
  let rotateAngle = -90;

  w = ann.widthRatio * pH;
  h = ann.heightRatio * pW;
  x = ann.yRatio * pW;
  y = pH - ann.xRatio * pH;

  page.drawRectangle({
    x,
    y,
    width: w,
    height: h,
    rotate: degrees(rotateAngle),
    color: rgb(1, 0, 0),
  });

  const outBytes = await pdfDoc.save();
  fs.writeFileSync('scratch/rotation_image_test.pdf', outBytes);
  console.log("Wrote scratch/rotation_image_test.pdf");
}

run();
