import puppeteer from 'puppeteer-core';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const browser = await puppeteer.launch({
  executablePath: chromePath,
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=412,915'],
});

const page = await browser.newPage();
await page.setViewport({ width: 412, height: 915, isMobile: true, hasTouch: true });
await page.goto('http://localhost:8081', { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 2000));

// Click New Estimate
await page.evaluate(() => {
  const b = Array.from(document.querySelectorAll('*')).find(el => el.children.length === 0 && el.innerText === 'New Estimate');
  if (b) b.parentElement.click();
});
await new Promise(r => setTimeout(r, 1000));

// Type client name
const inputs = await page.$$('input');
await inputs[0].click();
await page.keyboard.type('Sarah Jenkins');

// Click preset
await page.evaluate(() => {
  const p = Array.from(document.querySelectorAll('*')).find(el => el.children.length === 0 && el.innerText && el.innerText.includes('Diagnostic & Service Call'));
  if (p) p.parentElement.click();
});
await new Promise(r => setTimeout(r, 1000));

// Click "Hand phone to client — Get Signature" button
const clicked = await page.evaluate(() => {
  const textEl = Array.from(document.querySelectorAll('*')).find(e => e.children.length === 0 && e.innerText && e.innerText.includes('Hand phone to client'));
  if (textEl && textEl.parentElement) {
    textEl.parentElement.click();
    return true;
  }
  return false;
});
console.log('Button clicked:', clicked);
await new Promise(r => setTimeout(r, 2000));

const screenText = await page.evaluate(() => document.body.innerText);
console.log('--- Screen text after clicking sign ---');
console.log(screenText.substring(0, 400).replace(/\n+/g, ' '));

await page.screenshot({ path: 'C:\\Users\\navee\\.gemini\\antigravity\\brain\\b314feb6-90fa-43b6-b33a-cda4650fc7b3\\step6_signature_pad_live.png' });
console.log('Screenshot saved: step6_signature_pad_live.png');
await browser.close();
