import puppeteer from 'puppeteer-core';
import path from 'node:path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const screenshotDir = 'C:\\Users\\navee\\.gemini\\antigravity\\brain\\b314feb6-90fa-43b6-b33a-cda4650fc7b3';

console.log('=== SIGNATURE PAD & LOCK VERIFICATION TEST ===');

const browser = await puppeteer.launch({
  executablePath: chromePath,
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=412,915'],
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 412, height: 915, isMobile: true, hasTouch: true });

  await page.goto('http://localhost:8081', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));

  // Click New Estimate
  await page.evaluate(() => {
    const divs = Array.from(document.querySelectorAll('div, button'));
    const btn = divs.find(d => d.innerText && d.innerText.trim() === 'New Estimate');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  // Type client name
  await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input'));
    if (inputs[0]) {
      inputs[0].value = 'Sarah Jenkins';
      inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
    }
  });

  // Tap preset
  await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('div, span'));
    const p = all.find(el => el.innerText && el.innerText.includes('Diagnostic & Service Call'));
    if (p) p.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Click "Hand phone to client — Get Signature"
  console.log('Clicking "Hand phone to client — Get Signature"...');
  await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('div, button'));
    const sigBtn = all.find(el => el.innerText && el.innerText.includes('Hand phone to client'));
    if (sigBtn) sigBtn.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  // Capture Signature Pad modal/screen
  const sigScreenPath = path.join(screenshotDir, 'step5_signature_pad.png');
  await page.screenshot({ path: sigScreenPath });
  console.log(`✓ Signature screen saved: ${sigScreenPath}`);

  // Inspect visible text on signature screen
  const sigText = await page.evaluate(() => document.body.innerText);
  console.log('--- Signature Screen Text ---');
  console.log(sigText.substring(0, 300));
  console.log('-----------------------------');

} catch (e) {
  console.error('Error during signature test:', e);
} finally {
  await browser.close();
}
