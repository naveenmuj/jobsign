import puppeteer from 'puppeteer-core';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactsDir = 'C:\\Users\\navee\\.gemini\\antigravity\\brain\\b314feb6-90fa-43b6-b33a-cda4650fc7b3';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--window-size=420,950', '--no-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 412, height: 915, isMobile: true, hasTouch: true });

  await page.goto('http://localhost:8081', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));

  // Click settings gear icon at top-right
  const clicked = await page.evaluate(() => {
    // Look for all svg elements; the gear icon has polygon/path or last icon in header
    const svgs = Array.from(document.querySelectorAll('svg'));
    if (svgs.length > 0) {
      const gear = svgs[svgs.length - 1];
      gear.parentElement.click();
      return true;
    }
    return false;
  });
  console.log('Clicked settings:', clicked);
  await new Promise(r => setTimeout(r, 1500));

  // Scroll to Tax & Localization Preferences
  await page.evaluate(() => {
    const scrollContainers = Array.from(document.querySelectorAll('div')).filter(d => {
      const style = window.getComputedStyle(d);
      return (style.overflowY === 'auto' || style.overflowY === 'scroll') && d.scrollHeight > 1000;
    });
    if (scrollContainers.length > 0) {
      scrollContainers[0].scrollTop = 700;
    }
  });
  await new Promise(r => setTimeout(r, 800));

  await page.screenshot({ path: path.join(artifactsDir, 'step9_settings_tax_preferences.png') });
  console.log('Saved step9_settings_tax_preferences.png');

  await browser.close();
})();
