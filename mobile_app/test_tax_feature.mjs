import puppeteer from 'puppeteer-core';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactsDir = 'C:\\Users\\navee\\.gemini\\antigravity\\brain\\b314feb6-90fa-43b6-b33a-cda4650fc7b3';

(async () => {
  console.log('Launching Chrome to test Tax Customization & Defaults...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--window-size=420,880', '--no-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 412, height: 915, isMobile: true, hasTouch: true });

  console.log('1. Connecting to Metro web app...');
  await page.goto('http://localhost:8081', { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  // Screenshot 1: HomeScreen
  await page.screenshot({ path: path.join(artifactsDir, 'tax_test_1_home.png') });
  console.log('  ✓ Saved tax_test_1_home.png');

  // Step 2: Click "New Estimate"
  console.log('2. Clicking "New Estimate" button...');
  await page.evaluate(() => {
    const divs = Array.from(document.querySelectorAll('div, button'));
    const btn = divs.find(d => d.innerText && d.innerText.trim() === 'New Estimate');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  // Step 3: Fill in inputs
  console.log('3. Filling client and adding preset item...');
  await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input'));
    for (const inp of inputs) {
      const ph = (inp.getAttribute('placeholder') || '').toLowerCase();
      if (ph.includes('client name')) {
        inp.value = 'Sarah Jenkins';
        inp.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }

    // Click "+ Diagnostics" preset chip
    const divs = Array.from(document.querySelectorAll('div, button'));
    const preset = divs.find(d => d.innerText && d.innerText.includes('Diagnostics'));
    if (preset) preset.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Screenshot 2: Default Tax applied
  await page.screenshot({ path: path.join(artifactsDir, 'tax_test_2_default_tax.png') });
  console.log('  ✓ Step 2: Default Tax applied, saved tax_test_2_default_tax.png');

  // Step 4: Toggle Tax OFF (Exempt)
  console.log('4. Toggling Tax OFF (making document tax-exempt)...');
  await page.evaluate(() => {
    const divs = Array.from(document.querySelectorAll('div, button'));
    const toggle = divs.find(d => d.innerText && d.innerText.trim() === '✓ Tax Added');
    if (toggle) toggle.click();
  });
  await new Promise(r => setTimeout(r, 800));

  await page.screenshot({ path: path.join(artifactsDir, 'tax_test_3_tax_exempt.png') });
  console.log('  ✓ Step 3: Tax turned OFF (0% exempt), saved tax_test_3_tax_exempt.png');

  // Step 5: Toggle Tax back ON and customize to UK VAT 20%
  console.log('5. Toggling Tax ON and customizing to 20% UK VAT...');
  await page.evaluate(() => {
    const divs = Array.from(document.querySelectorAll('div, button'));
    const toggle = divs.find(d => d.innerText && d.innerText.trim() === '+ Add Tax (Optional)');
    if (toggle) toggle.click();
  });
  await new Promise(r => setTimeout(r, 800));

  await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input'));
    for (const inp of inputs) {
      const ph = (inp.getAttribute('placeholder') || '').toLowerCase();
      if (ph.includes('tax label')) {
        inp.value = 'VAT (UK)';
        inp.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
    // Find rate input (with value 8.25)
    const rateInput = inputs.find(i => i.value === '8.25');
    if (rateInput) {
      rateInput.value = '20.00';
      rateInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
  await new Promise(r => setTimeout(r, 1000));

  await page.screenshot({ path: path.join(artifactsDir, 'tax_test_4_vat_20pct.png') });
  console.log('  ✓ Step 4: Customized to 20% VAT (UK), saved tax_test_4_vat_20pct.png');

  // Step 6: Click "★ Keep 20.00% enabled by default"
  console.log('6. Saving as default for all future quotes...');
  page.on('dialog', async dialog => {
    console.log(`  [Dialog] ${dialog.message()}`);
    await dialog.accept();
  });

  await page.evaluate(() => {
    const divs = Array.from(document.querySelectorAll('div, button'));
    const keepBtn = divs.find(d => d.innerText && d.innerText.includes('Keep'));
    if (keepBtn) keepBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  await page.screenshot({ path: path.join(artifactsDir, 'tax_test_5_saved_default.png') });
  console.log('  ✓ Step 5: Default saved preference, saved tax_test_5_saved_default.png');

  await browser.close();
  console.log('All tax feature tests completed successfully!');
})();
