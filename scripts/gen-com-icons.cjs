const sharp = require('sharp');
const path = require('path');

const src = 'C:/Users/AIC/.gemini/antigravity/brain/7ab59080-974a-45c4-90db-5aafad63fcfb/.user_uploaded/media_1790861397542.jpg';
const destDir = 'c:/com/public';

const sizes = [120, 192, 240, 512];

async function generate() {
  for (const size of sizes) {
    const comPath = path.join(destDir, `com-logo-${size}.png`);
    const rastrumPath = path.join(destDir, `rastrum-logo-${size}.png`);
    await sharp(src)
      .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toFile(comPath);
    await sharp(src)
      .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toFile(rastrumPath);
    console.log(`Generated ${size}px icons`);
  }

  await sharp(src)
    .resize(180, 180, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toFile(path.join(destDir, 'apple-touch-icon.png'));

  await sharp(src)
    .resize(192, 192, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toFile(path.join(destDir, 'favicon-192.png'));

  await sharp(src)
    .resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toFile(path.join(destDir, 'favicon-512.png'));

  await sharp(src)
    .resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toFile(path.join(destDir, 'favicon.png'));

  console.log('All icons generated successfully!');
}

generate().catch(console.error);
