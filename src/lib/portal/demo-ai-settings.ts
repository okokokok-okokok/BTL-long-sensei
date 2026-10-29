import fs from 'node:fs/promises';
import path from 'node:path';
import lockfile from 'proper-lockfile';
import { PortalError } from './domain';

function location() {
  return process.env.PORTAL_AI_CONFIG_FILE || path.join(path.dirname(path.resolve(process.env.PORTAL_DEMO_FILE || '.data/portal-demo.json')), 'ai-config.json');
}
export async function readDemoAiSettings(): Promise<{ geminiKey: string; updatedAt?: string }> {
  try {
    const data = JSON.parse(await fs.readFile(location(), 'utf8'));
    if (typeof data.geminiKey !== 'string') throw new Error('Invalid config');
    return { geminiKey: data.geminiKey, updatedAt: data.updatedAt };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return { geminiKey: process.env.GEMINI_API_KEY || '' };
    throw new PortalError('Không đọc được cấu hình trợ lý học tập đã lưu.', 503);
  }
}
export async function writeDemoAiSettings(geminiKey: string) {
  const target = location();
  await fs.mkdir(path.dirname(target), { recursive: true });
  const release = await lockfile.lock(target, { realpath: false, retries: { retries: 10, minTimeout: 50 } });
  try {
    const temporary = target + '.' + process.pid + '.tmp';
    await fs.writeFile(temporary, JSON.stringify({ geminiKey, updatedAt: new Date().toISOString() }), { mode: 0o600 });
    await fs.rename(temporary, target);
  } finally { await release(); }
  return true;
}
