import puppeteer from 'puppeteer-core';
import path from 'node:path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const screenshotDir = 'C:\\Users\\navee\\.gemini\\antigravity\\brain\\b314feb6-90fa-43b6-b33a-cda4650fc7b3';

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

  // Focus first input and type using real keystrokes
  const inputs = await page.$$('input');
  if (inputs.length > 0) {
    await inputs[0].click();
    await page.keyboard.type('Sarah Jenkins', { delay: 50 });
    console.log('✓ Typed client name using real keystrokes');
  }

  // Click preset item
  await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('div, span'));
    const preset = all.find(el => el.innerText && el.innerText.includes('Diagnostic & Service Call'));
    if (preset) preset.click();
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

  // Take screenshot of Signature Pad
  const sigScreenPath = path.join(screenshotDir, 'step5_signature_pad.png');
  await page.screenshot({ path: sigScreenPath });
  console.log(`✓ Signature screen saved: ${sigScreenPath}`);

  const pageText = await page.evaluate(() => document.body.innerText);
  console.log('--- Page text after clicking sign ---');
  console.log(pageText.substring(0, 400));

} catch (e) {
  console.error(e);
} finally {
  await browser.close();
}
