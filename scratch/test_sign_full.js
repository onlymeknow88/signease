const fs = require('fs');
const { PDFDocument, degrees } = require('pdf-lib');

async function run() {
  const filePath = '/Users/user/Documents/Framework/react/signease/agents/signed_FINAL_WIN-MAC-LOG-06-002 Monitoring Fuel Ratio Light Vehicle (LV)_Rev0.0 (3) (5).pdf';
  const bytes = fs.readFileSync(filePath);
  const pdfDoc = await PDFDocument.load(bytes);
  const page = pdfDoc.getPages()[0];
  const { width: pW, height: pH } = page.getSize();
  const rotation = page.getRotation().angle;

  console.log(`Page size: w=${pW}, h=${pH}, rotation=${rotation}`);

  // Create a simple base64 PNG text image or fetch one
  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAASwAAABkCAYAAAD5V25yAAAACXBIWXMAAAsTAAALEwEAmpwYAAAB8WlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAed3JpdGUgeG1wAAAAAAAAMjA2N2I5NmUtY2Q0My00ZTg5LWJhMmEtMGE2ODk5ZDE4NjU2N2FjdGl2ZURvY3VtZW50IDg4OTU5ODg5ODkAAAAAeNqM0k0KwkAMBeDdTpG5VptJnFkI4kK8gHdxJ4iC4lbcibeQW1lBvE636WcW/jB5SV7y8pLky0sN6M8d+F9d9C+5jA/7F+7l13M1/3jG+FkG+Kz3+X3+z8c7vG3q7q4G8L0M6K22+aO+q+Btc2cDfCsD5iM73bX4PjQ6QkODVqNDYwNao1djgzsaO9yJDsUOtzoUO9zpUOxgdLDqYHWw6mB0sOpgdbDqYHWw6mB0sOpgdbDqYHWw6mA0GDQYDBoMBg0GgwaDQaPBoNFg0GgwaDQaNBo0GjQanwY/AA==';
  // Wait, let's write a simple PNG generator to create a PNG file so we don't hit decoder issues.
  // Actually, we can just write a text annotation if we want, but since drawImage is what's failing:
  // Let's use a valid PNG. Where can we find a valid PNG in the workspace?
  // Let's check public/logo.png or public/favicon.ico!
  const logoBytes = fs.readFileSync('/Users/user/Documents/Framework/react/signease/public/logo.png');
  const img = await pdfDoc.embedPng(logoBytes);

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

  page.drawImage(img, {
    x,
    y,
    width: w,
    height: h,
    rotate: degrees(rotateAngle),
  });

  const outBytes = await pdfDoc.save();
  fs.writeFileSync('scratch/rotation_logo_test.pdf', outBytes);
  console.log("Wrote scratch/rotation_logo_test.pdf");
}

run();
