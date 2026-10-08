import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const screenshotDir = 'C:\\Users\\navee\\.gemini\\antigravity\\brain\\b314feb6-90fa-43b6-b33a-cda4650fc7b3';

console.log('=== STARTING JOBSIGN E2E DEVTOOLS TEST ===');
console.log(`Connecting to Chrome at: ${chromePath}`);

const browser = await puppeteer.launch({
  executablePath: chromePath,
  headless: 'new',
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--window-size=412,915',
  ],
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 412, height: 915, isMobile: true, hasTouch: true });

  const consoleMessages = [];
  const pageErrors = [];

  // Capture DevTools console logs
  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push({ type: msg.type(), text });
    if (msg.type() === 'error') {
      console.log(`[DevTools Console ERROR] ${text}`);
    }
  });

  // Capture unhandled page errors
  page.on('pageerror', err => {
    pageErrors.push(err.message);
    console.log(`[DevTools Page ERROR] ${err.message}`);
  });

  console.log('Navigating to http://localhost:8081...');
  await page.goto('http://localhost:8081', { waitUntil: 'networkidle0', timeout: 30000 });

  console.log('Waiting for root app container...');
  await page.waitForSelector('#root', { timeout: 10000 });

  // Give React Native web a second to mount and render
  await new Promise(r => setTimeout(r, 3000));

  // Take Step 1 screenshot: Pristine HomeScreen
  const screenshot1Path = path.join(screenshotDir, 'e2e_01_home_screen.png');
  await page.screenshot({ path: screenshot1Path, fullPage: true });
  console.log(`✓ Screenshot 1 saved: ${screenshot1Path}`);

  // Inspect page title and rendered text
  const pageTitle = await page.title();
  console.log(`Page Title: "${pageTitle}"`);

  // Extract visible text content
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log('--- Rendered Text Summary (first 300 chars) ---');
  console.log(bodyText.substring(0, 300));
  console.log('----------------------------------------------');

  // Find interactive buttons / elements
  const interactiveElements = await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll('button, [role="button"], input, div[tabindex]'));
    return elements.map(el => ({
      tagName: el.tagName,
      role: el.getAttribute('role'),
      text: el.innerText ? el.innerText.trim() : el.getAttribute('aria-label') || el.getAttribute('placeholder') || ''
    })).filter(el => el.text.length > 0 && el.text.length < 50);
  });

  console.log(`Found ${interactiveElements.length} interactive elements on HomeScreen:`);
  interactiveElements.slice(0, 10).forEach((el, idx) => {
    console.log(`  [${idx}] <${el.tagName}> role="${el.role}" text="${el.text.replace(/\n/g, ' ')}"`);
  });

  // Attempt to find and tap "New Quote" or "+" button
  console.log('Testing interaction: Looking for New Quote button...');
  const newQuoteClicked = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('*'));
    for (const el of all) {
      const text = el.innerText || '';
      const aria = el.getAttribute('aria-label') || '';
      if (text.includes('New Quote') || aria.includes('New Quote') || text.includes('Create Quote') || aria.includes('Add')) {
        el.click();
        return { clicked: true, text: text || aria };
      }
    }
    return { clicked: false };
  });

  if (newQuoteClicked.clicked) {
    console.log(`✓ Clicked element: "${newQuoteClicked.text}"`);
    await new Promise(r => setTimeout(r, 2000));

    // Take Step 2 screenshot: Quote Builder
    const screenshot2Path = path.join(screenshotDir, 'e2e_02_quote_builder.png');
    await page.screenshot({ path: screenshot2Path, fullPage: true });
    console.log(`✓ Screenshot 2 saved: ${screenshot2Path}`);

    // Check if inputs are rendered
    const inputs = await page.evaluate(() => {
      const inputEls = Array.from(document.querySelectorAll('input, textarea'));
      return inputEls.map(i => ({ placeholder: i.placeholder, type: i.type }));
    });
    console.log(`Found ${inputs.length} input fields in Quote Builder:`, inputs);

    // Fill in client name if an input exists
    if (inputs.length > 0) {
      await page.type('input', 'John Doe (DevTools Test)');
      await new Promise(r => setTimeout(r, 1000));
      const screenshot3Path = path.join(screenshotDir, 'e2e_03_filled_form.png');
      await page.screenshot({ path: screenshot3Path, fullPage: true });
      console.log(`✓ Screenshot 3 saved: ${screenshot3Path}`);
    }
  } else {
    console.log('Notice: New Quote button not matched by text, taking full page inspection.');
  }

  console.log('\n=== DEVTOOLS AUDIT SUMMARY ===');
  console.log(`Total Console Messages: ${consoleMessages.length}`);
  console.log(`Unhandled Page Errors: ${pageErrors.length}`);
  if (pageErrors.length === 0) {
    console.log('✓ ZERO UNHANDLED JAVASCRIPT EXCEPTIONS');
  } else {
    console.log('Errors encountered:', pageErrors);
  }

} catch (err) {
  console.error('E2E Test Execution Error:', err);
} finally {
  await browser.close();
  console.log('Browser closed.');
}
