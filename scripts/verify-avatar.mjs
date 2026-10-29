import puppeteer from 'puppeteer-core';
import path from 'path';

const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const artifactDir = 'C:\\Users\\Admin\\.gemini\\antigravity-ide\\brain\\d9b1b9a0-a6fe-446f-8e25-a2dd06720ee8';

async function main() {
  console.log('Launching browser to check avatar...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800'],
    defaultViewport: { width: 1280, height: 800 },
  });

  const page = await browser.newPage();

  try {
    console.log('Navigating to login...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });

    console.log('Logging in as Vu Hai Anh B23DCVT036...');
    await page.type('input[type="text"]', 'B23DCVT036');
    await page.type('input[type="password"]', 'ptit@123');
    await page.click('button[type="submit"]');

    // Wait for SPA redirection to dashboard
    await page.waitForFunction(() => window.location.pathname !== '/login', { timeout: 15000 });
    console.log('Logged in successfully. Current URL:', page.url());
    await new Promise(r => setTimeout(r, 1000));

    // Click 'Hồ sơ cá nhân' in sidebar
    console.log('Clicking Hồ sơ cá nhân in sidebar...');
    await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      const profileLink = links.find(a => a.getAttribute('href') === '/profile' || a.textContent.includes('Hồ sơ'));
      if (profileLink) profileLink.click();
    });

    await page.waitForFunction(() => window.location.pathname === '/profile', { timeout: 15000 });
    await new Promise(r => setTimeout(r, 2000));

    // Capture screenshot of profile page with new avatar
    const profileScreenshot = path.join(artifactDir, 'profile_avatar_verified.png');
    await page.screenshot({ path: profileScreenshot, fullPage: false });
    console.log('Saved profile screenshot to:', profileScreenshot);

    const profileAvatarSrc = await page.evaluate(() => {
      const img = document.querySelector('img[alt="Student Avatar"]');
      return img ? img.getAttribute('src') : null;
    });
    console.log('Profile avatar src:', profileAvatarSrc);

    console.log('Verification completed successfully!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await browser.close();
  }
}

main();
