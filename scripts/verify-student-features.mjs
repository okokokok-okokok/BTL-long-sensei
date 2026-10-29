import puppeteer from 'puppeteer-core';
import path from 'path';

const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const artifactDir = 'C:\\Users\\Admin\\.gemini\\antigravity-ide\\brain\\d9b1b9a0-a6fe-446f-8e25-a2dd06720ee8';

async function main() {
  console.log('Launching browser for comprehensive verification...');
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
    await new Promise(r => setTimeout(r, 1500));

    // 1. Check Profile
    console.log('Checking Profile (/profile)...');
    await page.goto('http://localhost:3000/profile', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));
    const profilePath = path.join(artifactDir, 'profile_faculty_verified.png');
    await page.screenshot({ path: profilePath, fullPage: false });
    console.log('Saved profile screenshot to:', profilePath);

    // 2. Check Weekly Schedule
    console.log('Checking Weekly Schedule (/schedule)...');
    await page.goto('http://localhost:3000/schedule', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));
    const schedulePath = path.join(artifactDir, 'weekly_schedule_verified.png');
    await page.screenshot({ path: schedulePath, fullPage: false });
    console.log('Saved weekly schedule screenshot to:', schedulePath);

    // 3. Check Curriculum
    console.log('Checking Curriculum (/curriculum)...');
    await page.goto('http://localhost:3000/curriculum', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));
    const curriculumPath = path.join(artifactDir, 'curriculum_verified.png');
    await page.screenshot({ path: curriculumPath, fullPage: false });
    console.log('Saved curriculum screenshot to:', curriculumPath);

    console.log('All verifications completed successfully!');
  } catch (err) {
    console.error('Error during verification:', err);
  } finally {
    await browser.close();
  }
}

main();
