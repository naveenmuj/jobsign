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

  await page.goto('http://localhost:8081', { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  // Click "New Estimate"
  await page.evaluate(() => {
    const divs = Array.from(document.querySelectorAll('div, button'));
    const btn = divs.find(d => d.innerText && d.innerText.trim() === 'New Estimate');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  // Add line item via custom adder: "Emergency Water Heater Install", "$850.00"
  await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input'));
    const descInp = inputs.find(i => (i.placeholder || '').includes('Custom item'));
    const priceInp = inputs.find(i => (i.placeholder || '') === '0.00');
    if (descInp && priceInp) {
      descInp.value = 'Water Heater Replacement';
      descInp.dispatchEvent(new Event('input', { bubbles: true }));
      priceInp.value = '850.00';
      priceInp.dispatchEvent(new Event('input', { bubbles: true }));
    }
    const addBtns = Array.from(document.querySelectorAll('div, button'));
    const addBtn = addBtns.find(d => d.innerText && d.innerText.trim() === 'Add');
    if (addBtn) addBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Scroll down so Financial Summary is perfectly framed
  await page.evaluate(() => {
    const scrollContainers = Array.from(document.querySelectorAll('div')).filter(d => {
      const style = window.getComputedStyle(d);
      return style.overflowY === 'auto' || style.overflowY === 'scroll';
    });
    if (scrollContainers.length > 0) {
      scrollContainers[0].scrollTop = 450;
    } else {
      window.scrollTo(0, 450);
    }
  });
  await new Promise(r => setTimeout(r, 800));

  // 1. Capture default tax view (8.25% Sales Tax on $850.00 = $70.13, Total: $920.13)
  await page.screenshot({ path: path.join(artifactsDir, 'tax_summary_1_default.png') });
  console.log('Saved tax_summary_1_default.png');

  // 2. Click Tax button to toggle OFF
  await page.evaluate(() => {
    const divs = Array.from(document.querySelectorAll('div, button'));
    const toggle = divs.find(d => d.innerText && d.innerText.includes('Tax Added'));
    if (toggle) toggle.click();
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(artifactsDir, 'tax_summary_2_exempt.png') });
  console.log('Saved tax_summary_2_exempt.png');

  // 3. Toggle back ON
  await page.evaluate(() => {
    const divs = Array.from(document.querySelectorAll('div, button'));
    const toggle = divs.find(d => d.innerText && d.innerText.includes('Add Tax'));
    if (toggle) toggle.click();
  });
  await new Promise(r => setTimeout(r, 800));

  // 4. Change tax to UK VAT 20%
  await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input'));
    const labelInp = inputs.find(i => (i.placeholder || '').includes('Tax Label'));
    if (labelInp) {
      labelInp.value = 'VAT (UK 20%)';
      labelInp.dispatchEvent(new Event('input', { bubbles: true }));
    }
    // Rate input
    const rateInp = inputs.find(i => i.value === '8.25');
    if (rateInp) {
      rateInp.value = '20.00';
      rateInp.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(artifactsDir, 'tax_summary_3_vat_20.png') });
  console.log('Saved tax_summary_3_vat_20.png');

  // 5. Test Settings Screen: go back and open Settings tab
  page.on('dialog', async d => await d.accept());
  await page.evaluate(() => {
    // Back button
    const backBtn = document.querySelector('div[role="button"]');
    if (backBtn) backBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Open Settings Screen from Home screen
  await page.evaluate(() => {
    const divs = Array.from(document.querySelectorAll('div, button'));
    // Home header has gear icon or Settings button
    const settingsBtn = divs.find(d => d.getAttribute('aria-label') === 'Settings' || (d.innerText && d.innerText.includes('Settings')));
    if (settingsBtn) settingsBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Scroll down to Tax Preferences in Settings
  await page.evaluate(() => {
    const scrollContainers = Array.from(document.querySelectorAll('div')).filter(d => {
      const style = window.getComputedStyle(d);
      return style.overflowY === 'auto' || style.overflowY === 'scroll';
    });
    if (scrollContainers.length > 0) {
      scrollContainers[0].scrollTop = 700;
    } else {
      window.scrollTo(0, 700);
    }
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(artifactsDir, 'tax_summary_4_settings_tax_screen.png') });
  console.log('Saved tax_summary_4_settings_tax_screen.png');

  await browser.close();
  console.log('Done visual test!');
})();
