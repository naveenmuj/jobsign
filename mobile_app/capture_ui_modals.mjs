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
  await page.setViewport({ width: 412, height: 915 });

  // 1. Clear storage so onboarding is guaranteed to trigger on first run
  await page.goto('http://localhost:8081', { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));

  // Capture Screenshot 1: Onboarding Modal with Skip button
  await page.screenshot({ path: path.join(artifactsDir, 'step10_onboarding_modal.png') });
  console.log('Saved step10_onboarding_modal.png');

  // Click "Skip for Now" to dismiss onboarding gracefully
  await page.evaluate(() => {
    const divs = Array.from(document.querySelectorAll('div, button'));
    const skipBtn = divs.find(d => d.innerText && d.innerText.trim() === 'Skip for Now');
    if (skipBtn) skipBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  // Open Settings screen to view Shop & Business Profile card
  await page.evaluate(() => {
    const icon = document.querySelector('.lucide-settings');
    let target = icon;
    while (target && target.tagName !== 'DIV') {
      target = target.parentElement;
    }
    if (target) target.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  await new Promise(r => setTimeout(r, 1500));

  // Scroll to Shop & Business Profile card in Settings
  await page.evaluate(() => {
    const scrollable = Array.from(document.querySelectorAll('div')).find(d => {
      const style = window.getComputedStyle(d);
      return (style.overflowY === 'auto' || style.overflowY === 'scroll') && d.scrollHeight > 1000;
    });
    if (scrollable) scrollable.scrollTop = 380;
  });
  await new Promise(r => setTimeout(r, 800));

  // Capture Screenshot 2: Settings Profile card with logo & address
  await page.screenshot({ path: path.join(artifactsDir, 'step11_settings_profile_card.png') });
  console.log('Saved step11_settings_profile_card.png');

  // Go back to home
  await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('div, svg'));
    const backBtn = all.find(el => el.getAttribute('aria-label') === 'Back' || el.innerText === 'Back');
    if (backBtn) backBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Go to New Estimate
  await page.evaluate(() => {
    const divs = Array.from(document.querySelectorAll('div, button'));
    const newBtn = divs.find(d => d.innerText && d.innerText.trim() === 'New Estimate');
    if (newBtn) newBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  // Add line item and client name
  await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input'));
    if (inputs[0]) {
      inputs[0].value = 'Michael Adams';
      inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
    }
    const all = Array.from(document.querySelectorAll('div, span'));
    const preset = all.find(el => (el.innerText || '').includes('Diagnostic & Service Call'));
    if (preset) preset.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Click Hand phone to client -> opens Signature Pad
  await page.evaluate(() => {
    const divs = Array.from(document.querySelectorAll('div, button'));
    const signBtn = divs.find(d => d.innerText && d.innerText.includes('Hand phone to client'));
    if (signBtn) signBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  // Draw signature and save
  await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(30, 80);
        ctx.lineTo(250, 80);
        ctx.stroke();
      }
    }
    const btns = Array.from(document.querySelectorAll('div, button'));
    const acceptBtn = btns.find(b => b.innerText && (b.innerText.includes('Accept & Lock') || b.innerText.includes('Accept')));
    if (acceptBtn) acceptBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  // When Alert pops up ("Estimate sealed" -> Send PDF Now)
  // Catch dialog or click Send PDF Now
  page.on('dialog', async dialog => {
    console.log('Dialog:', dialog.message());
    await dialog.accept(); // Clicks "Send PDF Now"
  });

  await new Promise(r => setTimeout(r, 1500));

  // Capture Screenshot 3: Company Name Prompt Modal before PDF generation
  await page.screenshot({ path: path.join(artifactsDir, 'step12_company_prompt_modal.png') });
  console.log('Saved step12_company_prompt_modal.png');

  await browser.close();
  console.log('All UI captures completed!');
})();
