import puppeteer from 'puppeteer-core';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const browser = await puppeteer.launch({
  executablePath: chromePath,
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=412,915'],
});

const context = browser.defaultBrowserContext();
await context.overridePermissions('http://localhost:8081', ['geolocation']);

const page = await browser.newPage();
await page.setViewport({ width: 412, height: 915, isMobile: true, hasTouch: true });
await page.setGeolocation({ latitude: 30.2672, longitude: -97.7431 });

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

// Click Hand phone to client
await page.evaluate(() => {
  const textEl = Array.from(document.querySelectorAll('*')).find(e => e.children.length === 0 && e.innerText && e.innerText.includes('Hand phone to client'));
  if (textEl && textEl.parentElement) textEl.parentElement.click();
});
await new Promise(r => setTimeout(r, 1500));

// Draw signature on canvas
console.log('Simulating finger signature on glass canvas...');
await page.mouse.move(200, 350);
await page.mouse.down();
await page.mouse.move(250, 400, { steps: 5 });
await page.mouse.move(300, 360, { steps: 5 });
await page.mouse.move(220, 450, { steps: 5 });
await page.mouse.up();
await new Promise(r => setTimeout(r, 500));

// Click Confirm Agreement
console.log('Clicking Confirm Agreement...');
await page.evaluate(() => {
  const all = Array.from(document.querySelectorAll('*'));
  const btn = all.find(e => e.children.length === 0 && e.innerText && e.innerText.includes('Confirm Agreement'));
  if (btn) (btn.closest('div[tabindex="0"]') || btn.parentElement).click();
});

console.log('Waiting for SHA-256 seal and save to complete...');
await new Promise(r => setTimeout(r, 4000));

// Screenshot 7: HomeScreen updated with live quote!
await page.screenshot({ path: 'C:\\Users\\navee\\.gemini\\antigravity\\brain\\b314feb6-90fa-43b6-b33a-cda4650fc7b3\\step7_sealed_agreement.png' });
console.log('Screenshot saved: step7_sealed_agreement.png');

const afterSignText = await page.evaluate(() => document.body.innerText.substring(0, 500).replace(/\n+/g, ' '));
console.log('Screen text after confirmation:', afterSignText);

await browser.close();
