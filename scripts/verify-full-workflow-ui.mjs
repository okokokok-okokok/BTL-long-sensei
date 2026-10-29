import puppeteer from 'puppeteer-core';
import path from 'path';

const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const artifactDir = 'C:\\Users\\Admin\\.gemini\\antigravity-ide\\brain\\d9b1b9a0-a6fe-446f-8e25-a2dd06720ee8';

async function main() {
  console.log('Launching browser to test full workflow on website...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1400,900'],
    defaultViewport: { width: 1400, height: 900 },
  });

  const page = await browser.newPage();

  try {
    console.log('Navigating to login...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });

    console.log('Logging in as Vu Hai Anh B23DCVT036...');
    await page.type('input[type="text"]', 'B23DCVT036');
    await page.type('input[type="password"]', 'ptit@123');
    await page.click('button[type="submit"]');

    await page.waitForFunction(() => window.location.pathname !== '/login', { timeout: 15000 });
    console.log('Logged in. Current URL:', page.url());
    await new Promise(r => setTimeout(r, 2000));

    // Open Chatbot
    console.log('Opening chatbot...');
    await page.click('button[title="Trợ lý Chatbot PTIT AI"]');
    await new Promise(r => setTimeout(r, 1000));

    // 1. Screenshot chat with guide banner and chip
    const bannerScreenshot = path.join(artifactDir, 'chatbot_chat_banner_verified.png');
    await page.screenshot({ path: bannerScreenshot, fullPage: false });
    console.log('Saved chat banner screenshot to:', bannerScreenshot);

    // 2. Click the guide banner to open the full 3-step workflow
    console.log('Clicking guide banner...');
    await page.click('div[class*="from-amber-500/10"]');
    await new Promise(r => setTimeout(r, 1200));

    const workflowScreenshot = path.join(artifactDir, 'chatbot_full_workflow_verified.png');
    await page.screenshot({ path: workflowScreenshot, fullPage: false });
    console.log('Saved full workflow screenshot to:', workflowScreenshot);

    console.log('All workflow verification screenshots captured successfully!');
  } catch (err) {
    console.error('Error during workflow verification:', err);
  } finally {
    await browser.close();
  }
}

main();
