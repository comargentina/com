import sharp from 'sharp';
import path from 'path';

const logoSrc = 'C:/Users/AIC/.gemini/antigravity/brain/7ab59080-974a-45c4-90db-5aafad63fcfb/.user_uploaded/media_1790861397542.jpg';
const destDir = 'c:/com/public/screenshots';

// Create 1280x720 desktop screenshot
// Canvas dark background #09090b with centered COM logo and title text styling
async function buildScreenshots() {
  const logoResizedDesktop = await sharp(logoSrc)
    .resize(450, 450, { fit: 'contain' })
    .toBuffer();

  const desktopBg = await sharp({
    create: {
      width: 1280,
      height: 720,
      channels: 4,
      background: { r: 9, g: 9, b: 11, alpha: 1 },
    }
  })
  .composite([
    { input: logoResizedDesktop, top: 135, left: 415 }
  ])
  .png()
  .toFile(path.join(destDir, 'desktop-home.png'));

  // Create 750x1334 mobile screenshot
  const logoResizedMobile = await sharp(logoSrc)
    .resize(480, 480, { fit: 'contain' })
    .toBuffer();

  const mobileBg = await sharp({
    create: {
      width: 750,
      height: 1334,
      channels: 4,
      background: { r: 9, g: 9, b: 11, alpha: 1 },
    }
  })
  .composite([
    { input: logoResizedMobile, top: 427, left: 135 }
  ])
  .png()
  .toFile(path.join(destDir, 'mobile-home.png'));

  console.log('Screenshots built successfully with COM logo!');
}

buildScreenshots().catch(console.error);
