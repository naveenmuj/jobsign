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

  await page.goto('http://localhost:8081', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));

  // Dismiss onboarding if present
  await page.evaluate(() => {
    const divs = Array.from(document.querySelectorAll('div, button'));
    const skipBtn = divs.find(d => d.innerText && d.innerText.trim() === 'Skip for Now');
    if (skipBtn) skipBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // In the browser, make hasCustomBusinessName false and businessName empty so the prompt modal triggers
  await page.evaluate(async () => {
    // Add a mock signed quote if none exists so we can click into it
    const store = window.__useQuoteStore ? window.__useQuoteStore.getState() : null;
  });

  // Let's create an estimate and click into it or trigger handleSharePDF on HomeScreen
  // On HomeScreen, let's inject a quote and click share PDF
  await page.evaluate(() => {
    // Trigger the CompanyNamePromptModal directly on screen to inspect its visual design
    const state = JSON.parse(localStorage.getItem('jobsign-store-storage') || '{}');
    if (state.state) {
      state.state.profile = {
        ...state.state.profile,
        hasCustomBusinessName: false,
        businessName: '',
      };
      localStorage.setItem('jobsign-store-storage', JSON.stringify(state));
    }
  });

  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));

  // Dismiss onboarding if shown
  await page.evaluate(() => {
    const divs = Array.from(document.querySelectorAll('div, button'));
    const skipBtn = divs.find(d => d.innerText && d.innerText.trim() === 'Skip for Now');
    if (skipBtn) skipBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Click "+ New Estimate"
  await page.evaluate(() => {
    const divs = Array.from(document.querySelectorAll('div, button'));
    const btn = divs.find(d => d.innerText && d.innerText.trim() === 'New Estimate');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  // Set client name
  await page.evaluate(() => {
    const inp = document.querySelector('input');
    if (inp) {
      inp.value = 'Robert Vance';
      inp.dispatchEvent(new Event('input', { bubbles: true }));
    }
    // Add preset
    const preset = Array.from(document.querySelectorAll('div, span')).find(el => (el.innerText || '').includes('Diagnostic'));
    if (preset) preset.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Directly call the company modal trigger by invoking the component state or signing
  // We can also trigger showCompanyModal directly in React
  await page.evaluate(() => {
    // Look for Hand phone to client
    const signBtn = Array.from(document.querySelectorAll('div, button')).find(d => d.innerText && d.innerText.includes('Hand phone to client'));
    if (signBtn) signBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  // In Signature pad, draw and accept
  await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
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

  // Handle window.confirm: when window.confirm is called, choose OK so it selects "Send PDF Now"
  // In puppeteer:
  page.on('dialog', async dialog => {
    console.log('Dialog type:', dialog.type(), 'message:', dialog.message());
    await dialog.accept();
  });

  await new Promise(r => setTimeout(r, 2000));

  await page.screenshot({ path: path.join(artifactsDir, 'step12_company_prompt_modal.png') });
  console.log('Saved step12_company_prompt_modal.png');

  await browser.close();
})();
