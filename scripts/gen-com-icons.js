const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '../public/com-logo.jpg');
const destDir = path.join(__dirname, '../public');

const sizes = [120, 192, 240, 512];

async function generate() {
  for (const size of sizes) {
    // 76% scale gives a 12% margin on each side, guaranteeing full fit inside the 80% maskable safe zone circle
    const innerSize = Math.round(size * 0.76);
    const innerBuffer = await sharp(src)
      .resize(innerSize, innerSize, { fit: 'contain' })
      .toBuffer();

    const outPath = path.join(destDir, `com-logo-${size}.png`);
    const maskablePath = path.join(destDir, `com-logo-maskable-${size}.png`);
    const rastrumPath = path.join(destDir, `rastrum-logo-${size}.png`);

    // White background canvas with centered logo
    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    })
    .composite([{ input: innerBuffer, gravity: 'center' }])
    .png()
    .toFile(outPath);

    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    })
    .composite([{ input: innerBuffer, gravity: 'center' }])
    .png()
    .toFile(maskablePath);

    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    })
    .composite([{ input: innerBuffer, gravity: 'center' }])
    .png()
    .toFile(rastrumPath);

    console.log(`Generated size ${size}: ${outPath} & ${maskablePath}`);
  }

  // Apple touch icon (180x180 with 136x136 inner)
  const appleInner = await sharp(src).resize(136, 136, { fit: 'contain' }).toBuffer();
  await sharp({
    create: { width: 180, height: 180, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } }
  })
  .composite([{ input: appleInner, gravity: 'center' }])
  .png()
  .toFile(path.join(destDir, 'apple-touch-icon.png'));

  // Favicons
  const fav192Inner = await sharp(src).resize(146, 146, { fit: 'contain' }).toBuffer();
  await sharp({
    create: { width: 192, height: 192, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } }
  })
  .composite([{ input: fav192Inner, gravity: 'center' }])
  .png()
  .toFile(path.join(destDir, 'favicon-192.png'));

  const fav512Inner = await sharp(src).resize(388, 388, { fit: 'contain' }).toBuffer();
  await sharp({
    create: { width: 512, height: 512, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } }
  })
  .composite([{ input: fav512Inner, gravity: 'center' }])
  .png()
  .toFile(path.join(destDir, 'favicon-512.png'));

  await sharp(src)
    .resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toFile(path.join(destDir, 'favicon.png'));

  console.log('All icons generated successfully with safe-zone margins!');
}

generate().catch(console.error);
