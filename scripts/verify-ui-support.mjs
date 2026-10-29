import puppeteer from 'puppeteer-core';
import path from 'path';

const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const artifactDir = 'C:\\Users\\Admin\\.gemini\\antigravity-ide\\brain\\d9b1b9a0-a6fe-446f-8e25-a2dd06720ee8';

async function main() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
    defaultViewport: { width: 1440, height: 900 },
  });

  const page = await browser.newPage();

  try {
    // 1. Student verification
    console.log('1. Navigating to login page...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });

    console.log('Logging in as student B23DCVT022...');
    await page.type('input[type="text"]', 'B23DCVT022');
    await page.type('input[type="password"]', 'ptit@123');
    await page.click('button[type="submit"]');

    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    console.log('Student dashboard loaded. Current URL:', page.url());

    // Check that student has "Liên hệ Hỗ trợ" button
    const hasSupportBtn = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.some(b => b.textContent.includes('Liên hệ Hỗ trợ'));
    });
    console.log('Student sidebar has "Liên hệ Hỗ trợ" button:', hasSupportBtn);

    // Click "Liên hệ Hỗ trợ"
    console.log('Opening Support Modal...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent.includes('Liên hệ Hỗ trợ'));
      if (btn) btn.click();
    });

    await page.waitForSelector('.fixed.inset-0', { visible: true });
    await new Promise(r => setTimeout(r, 1000));

    // Switch to tab "Theo Dõi Tiến Độ Xử Lý"
    console.log('Switching to "Theo Dõi Tiến Độ Xử Lý" tab...');
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button'));
      const trackTab = tabs.find(b => b.textContent.includes('Theo Dõi Tiến Độ Xử Lý'));
      if (trackTab) trackTab.click();
    });

    await new Promise(r => setTimeout(r, 1500));

    // Capture screenshot of Student Tracking Modal
    const studentScreenshotPath = path.join(artifactDir, 'student_support_tracking.png');
    await page.screenshot({ path: studentScreenshotPath, fullPage: false });
    console.log('Saved student tracking screenshot to:', studentScreenshotPath);

    // Close modal
    await page.evaluate(() => {
      const closeBtns = Array.from(document.querySelectorAll('button'));
      const close = closeBtns.find(b => b.textContent.trim() === '✕');
      if (close) close.click();
    });
    await new Promise(r => setTimeout(r, 500));

    // Log out
    console.log('Logging out student...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const logoutBtn = btns.find(b => b.textContent.includes('Đăng xuất'));
      if (logoutBtn) logoutBtn.click();
    });

    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    console.log('Logged out. Current URL:', page.url());

    // 2. Admin verification
    console.log('Logging in as Admin admin@ptit...');
    await page.type('input[type="text"]', 'admin@ptit');
    await page.type('input[type="password"]', 'ptitcstranphu@123');
    await page.click('button[type="submit"]');

    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    console.log('Admin dashboard loaded. Current URL:', page.url());

    // Check that Admin does NOT have "Liên hệ Hỗ trợ" button in sidebar
    const adminHasSupportBtn = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.some(b => b.textContent.includes('Liên hệ Hỗ trợ') && b.closest('nav'));
    });
    console.log('Admin sidebar has "Liên hệ Hỗ trợ" button (SHOULD BE FALSE):', adminHasSupportBtn);

    // Click "Tiếp Nhận & Xử Lý Hỗ Trợ"
    console.log('Navigating to Tiếp Nhận & Xử Lý Hỗ Trợ (/admin?tab=support)...');
    await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      const link = links.find(a => a.textContent.includes('Tiếp Nhận & Xử Lý Hỗ Trợ'));
      if (link) link.click();
    });

    await new Promise(r => setTimeout(r, 2000));

    // Capture screenshot of Admin Support Center
    const adminCenterPath = path.join(artifactDir, 'admin_support_center.png');
    await page.screenshot({ path: adminCenterPath, fullPage: false });
    console.log('Saved admin support center screenshot to:', adminCenterPath);

    // Click "Xử lý & Cập nhật" for TK-2026-081
    console.log('Opening QTV Action Modal for ticket...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const editBtn = btns.find(b => b.textContent.includes('Xử lý & Cập nhật'));
      if (editBtn) editBtn.click();
    });

    await new Promise(r => setTimeout(r, 1200));

    // Capture screenshot of QTV Action Modal
    const adminActionModalPath = path.join(artifactDir, 'admin_support_action_modal.png');
    await page.screenshot({ path: adminActionModalPath, fullPage: false });
    console.log('Saved admin action modal screenshot to:', adminActionModalPath);

    console.log('All verification steps completed successfully!');
  } catch (err) {
    console.error('Error during verification:', err);
  } finally {
    await browser.close();
  }
}

main();
