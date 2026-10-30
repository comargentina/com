import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';

async function generate() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1000, height: 1500 },
    deviceScaleFactor: 2, // 2x high resolution (2000px wide)
  });

  const filePath = 'file:///' + path.resolve('public/flyer/index.html').replace(/\\/g, '/');
  await page.goto(filePath, { waitUntil: 'networkidle' });

  // Hide the top control bar
  await page.evaluate(() => {
    const bar = document.querySelector('.controls-bar');
    if (bar) bar.style.display = 'none';
    document.body.style.padding = '0';
    document.body.style.background = '#020b08';
    document.body.style.display = 'block';
  });

  const element = await page.locator('#flyer-card');
  const outPath = path.resolve('public/flyer/flyer-com-argentina.png');
  await element.screenshot({ path: outPath });

  console.log('Successfully generated flyer image at:', outPath);
  await browser.close();
}

generate().catch(err => {
  console.error('Failed to generate flyer image:', err);
  process.exit(1);
});
