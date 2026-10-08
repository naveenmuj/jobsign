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

  // 1. Open New Estimate
  await page.evaluate(() => {
    const divs = Array.from(document.querySelectorAll('div, button'));
    const btn = divs.find(d => d.innerText && d.innerText.trim() === 'New Estimate');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  // 2. Select Diagnostic & Service Call ($95)
  await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('div, span'));
    const preset = all.find(el => (el.innerText || '').includes('Diagnostic & Service Call'));
    if (preset) preset.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Scroll to financial card
  const scrollToFinancialCard = async () => {
    await page.evaluate(() => {
      const scrollable = Array.from(document.querySelectorAll('div')).find(d => {
        const style = window.getComputedStyle(d);
        return (style.overflowY === 'auto' || style.overflowY === 'scroll') && d.scrollHeight > 1000;
      });
      if (scrollable) {
        scrollable.scrollTop = 380;
      }
    });
    await new Promise(r => setTimeout(r, 600));
  };

  await scrollToFinancialCard();

  // Capture State 1: Default Tax ON (8.25%) -> Subtotal $95, Tax $7.84, Total $102.84
  await page.screenshot({ path: path.join(artifactsDir, 'tax_state1_enabled_default.png') });
  console.log('Saved tax_state1_enabled_default.png');

  // Toggle Tax OFF (Tax-Exempt / 0%)
  await page.evaluate(() => {
    const divs = Array.from(document.querySelectorAll('div, button, span'));
    const toggle = divs.find(d => d.innerText && d.innerText.trim() === '✓ Tax Added');
    if (toggle) toggle.click();
  });
  await new Promise(r => setTimeout(r, 800));
  await scrollToFinancialCard();

  // Capture State 2: Tax OFF (Tax-exempt) -> Subtotal $95, Tax $0.00, Total $95.00
  await page.screenshot({ path: path.join(artifactsDir, 'tax_state2_exempt_off.png') });
  console.log('Saved tax_state2_exempt_off.png');

  // Toggle Tax back ON
  await page.evaluate(() => {
    const divs = Array.from(document.querySelectorAll('div, button, span'));
    const toggle = divs.find(d => d.innerText && d.innerText.trim() === '+ Add Tax (Optional)');
    if (toggle) toggle.click();
  });
  await new Promise(r => setTimeout(r, 800));

  // Customize Tax to UK VAT 20%
  await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input'));
    const labelInp = inputs.find(i => (i.placeholder || '').includes('Tax Label'));
    if (labelInp) {
      // Use native setter to trigger React state update cleanly
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      nativeSetter.call(labelInp, 'UK VAT');
      labelInp.dispatchEvent(new Event('input', { bubbles: true }));
    }
    const rateInp = inputs.find(i => i.value && (i.value === '8.25' || i.value === '0.00' || !isNaN(parseFloat(i.value))));
    if (rateInp) {
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      nativeSetter.call(rateInp, '20.00');
      rateInp.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
  await new Promise(r => setTimeout(r, 800));
  await scrollToFinancialCard();

  // Capture State 3: Custom 20% VAT -> Subtotal $95, Tax $19.00, Total $114.00
  await page.screenshot({ path: path.join(artifactsDir, 'tax_state3_custom_20_vat.png') });
  console.log('Saved tax_state3_custom_20_vat.png');

  // 4. Test Settings Screen:
  // Go back to home
  page.on('dialog', async d => await d.accept());
  await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('div, svg'));
    const backBtn = all.find(el => el.getAttribute('aria-label') === 'Back' || el.innerText === 'Cancel');
    if (backBtn) backBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Open Settings Screen
  await page.goto('http://localhost:8081', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  await page.evaluate(() => {
    const divs = Array.from(document.querySelectorAll('div, button'));
    // Gear icon or settings button
    const settingsBtn = divs.find(d => {
      const aria = d.getAttribute('aria-label') || '';
      return aria.toLowerCase().includes('setting') || (d.innerText && d.innerText.includes('Settings'));
    });
    if (settingsBtn) settingsBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  // Scroll to Tax preferences card in Settings
  await page.evaluate(() => {
    const scrollable = Array.from(document.querySelectorAll('div')).find(d => {
      const style = window.getComputedStyle(d);
      return (style.overflowY === 'auto' || style.overflowY === 'scroll') && d.scrollHeight > 1000;
    });
    if (scrollable) {
      scrollable.scrollTop = 800;
    }
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(artifactsDir, 'tax_state4_settings_tax_preferences.png') });
  console.log('Saved tax_state4_settings_tax_preferences.png');

  await browser.close();
  console.log('Verification completed!');
})();
