import puppeteer from 'puppeteer-core';
import path from 'path';

const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const artifactDir = 'C:\\Users\\Admin\\.gemini\\antigravity-ide\\brain\\d9b1b9a0-a6fe-446f-8e25-a2dd06720ee8';

async function main() {
  console.log('Launching browser to test Chatbot Settings panel...');
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

    // Click Settings ⚙️
    console.log('Opening settings panel...');
    await page.click('button[title*="Cấu hình Khóa API"]');
    await new Promise(r => setTimeout(r, 1500));

    // Take screenshot of settings panel
    const screenshotPath = path.join(artifactDir, 'chatbot_settings_verified.png');
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log('Saved chatbot settings screenshot to:', screenshotPath);

    console.log('Chatbot settings verification completed successfully!');
  } catch (err) {
    console.error('Error during chatbot settings verification:', err);
  } finally {
    await browser.close();
  }
}

main();
