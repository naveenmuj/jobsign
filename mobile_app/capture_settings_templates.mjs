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

  // Dismiss onboarding modal if present
  await page.evaluate(() => {
    const divs = Array.from(document.querySelectorAll('div, button'));
    const skipBtn = divs.find(d => d.innerText && d.innerText.trim() === 'Skip for Now');
    if (skipBtn) skipBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  // Click Settings gear icon
  await page.evaluate(() => {
    const icon = document.querySelector('.lucide-settings');
    let target = icon;
    while (target && target.tagName !== 'DIV') {
      target = target.parentElement;
    }
    if (target) target.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  await new Promise(r => setTimeout(r, 1500));

  // Scroll to Invoice Design & Templates
  await page.evaluate(() => {
    const scrollable = Array.from(document.querySelectorAll('div')).find(d => {
      const style = window.getComputedStyle(d);
      return (style.overflowY === 'auto' || style.overflowY === 'scroll') && d.scrollHeight > 1000;
    });
    if (scrollable) scrollable.scrollTop = 820;
  });
  await new Promise(r => setTimeout(r, 800));

  await page.screenshot({ path: path.join(artifactsDir, 'step13_settings_template_picker_1.png') });
  console.log('Saved step13_settings_template_picker_1.png');

  // Scroll down to view Minimal Clean and Industrial Trade templates
  await page.evaluate(() => {
    const scrollable = Array.from(document.querySelectorAll('div')).find(d => {
      const style = window.getComputedStyle(d);
      return (style.overflowY === 'auto' || style.overflowY === 'scroll') && d.scrollHeight > 1000;
    });
    if (scrollable) scrollable.scrollTop = 1450;
  });
  await new Promise(r => setTimeout(r, 800));

  await page.screenshot({ path: path.join(artifactsDir, 'step13_settings_template_picker_2.png') });
  console.log('Saved step13_settings_template_picker_2.png');

  // Click Industrial Trade template
  await page.evaluate(() => {
    const divs = Array.from(document.querySelectorAll('div'));
    const tradeTitle = divs.find(d => d.innerText && d.innerText.trim() === 'Industrial Trade');
    if (tradeTitle) {
      tradeTitle.click();
    }
  });
  await new Promise(r => setTimeout(r, 600));

  await page.screenshot({ path: path.join(artifactsDir, 'step13_settings_trade_template_selected.png') });
  console.log('Saved step13_settings_trade_template_selected.png');

  await browser.close();
  console.log('Done capturing template settings!');
})();
