import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const extDir = path.join(rootDir, 'extension');
const screenshotsDir = 'C:\\Users\\ANANT\\.gemini\\antigravity\\brain\\03eef5f3-ee42-4d88-b598-78d5bd754e77\\screenshots';

if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// 1. Setup local mock WhatsApp Web server on port 8088
const mockHtml = fs.readFileSync(
  path.join(rootDir, 'packages', 'engine', 'tests', 'fixtures', 'whatsapp_web_group.html'),
  'utf8'
);

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(mockHtml);
});

await new Promise((resolve) => server.listen(8088, resolve));
console.log('✓ Mock WhatsApp Web server running on http://localhost:8088');

// 2. Launch Chromium browser with extension loaded
const tempUserData = path.join(rootDir, '.browser-temp-phase5-' + Date.now());
const browserPath = fs.existsSync('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe')
  ? 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
  : 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const cdpPort = 9238;

const chromeProc = spawn(browserPath, [
  `--remote-debugging-port=${cdpPort}`,
  '--disable-gpu',
  '--headless=new',
  `--load-extension=${extDir}`,
  `--disable-extensions-except=${extDir}`,
  `--user-data-dir=${tempUserData}`,
  'about:blank',
], { stdio: 'ignore' });

console.log(`✓ Browser spawned (${path.basename(browserPath)}) on CDP port ${cdpPort}`);

// Helper to pause
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await sleep(2500);

// CDP Client Helper
class CdpSession {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.nextId = 1;
    this.callbacks = new Map();
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.callbacks.has(msg.id)) {
        const { resolve, reject } = this.callbacks.get(msg.id);
        this.callbacks.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message || JSON.stringify(msg.error)));
        else resolve(msg.result);
      }
    };
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.nextId++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expr) {
    const res = await this.send('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true,
    });
    return res?.result?.value;
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function getTargets() {
  const res = await fetch(`http://127.0.0.1:${cdpPort}/json/list`);
  return res.json();
}

function getExtensionId() {
  const manifest = JSON.parse(fs.readFileSync(path.join(extDir, 'manifest.json'), 'utf8'));
  const pubKeyDer = Buffer.from(manifest.key, 'base64');
  const sha256 = crypto.createHash('sha256').update(pubKeyDer).digest();
  return Array.from(sha256.slice(0, 16)).map(b => {
    const high = (b >> 4) & 0x0f;
    const low = b & 0x0f;
    return String.fromCharCode(97 + high) + String.fromCharCode(97 + low);
  }).join('');
}

try {
  const extId = getExtensionId();
  console.log(`✓ Extension ID deterministic key: ${extId}`);

  // --- Step 3: Authenticate User on Missed. Web App ---
  console.log('Step 3: Creating and authenticating test account on Missed. web app...');
  const newTargetRes = await fetch(`http://127.0.0.1:${cdpPort}/json/new?http://localhost:5173/signup`, { method: 'PUT' });
  const webAppTarget = await newTargetRes.json();
  const webSession = new CdpSession(webAppTarget.webSocketDebuggerUrl);
  await webSession.connect();
  await webSession.send('Page.enable');
  await webSession.send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });

  await sleep(1500);

  const testEmail = `phase5.companion.${Date.now()}@missed.dev`;
  const testPassword = 'Password123!';

  await webSession.eval(`
    (() => {
      const emailInput = document.querySelector('input[type="email"]');
      const passInputs = document.querySelectorAll('input[type="password"]');
      const form = document.querySelector('form');
      if (!emailInput || passInputs.length < 2 || !form) return false;

      const setVal = (el, v) => {
        Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(el, v);
        el.dispatchEvent(new Event('input', { bubbles: true }));
      };

      setVal(emailInput, '${testEmail}');
      setVal(passInputs[0], '${testPassword}');
      setVal(passInputs[1], '${testPassword}');

      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.click();
      return true;
    })()
  `);

  console.log(`Submitted signup for ${testEmail}, waiting for /workspace navigation...`);
  await sleep(2500);

  // Verify token
  const token = await webSession.eval(`localStorage.getItem('missed_auth_token')`);
  console.log(`✓ Authenticated session token obtained: ${token ? token.slice(0, 16) + '...' : 'NONE'}`);

  // --- Step 4: Open Mock WhatsApp Web Tab ---
  console.log('Step 4: Opening Mock WhatsApp Web in browser tab...');
  const waTargetRes = await fetch(`http://127.0.0.1:${cdpPort}/json/new?http://localhost:8088/mock-whatsapp-web.html`, { method: 'PUT' });
  const waTarget = await waTargetRes.json();
  const waSession = new CdpSession(waTarget.webSocketDebuggerUrl);
  await waSession.connect();
  await waSession.send('Page.enable');
  await waSession.send('Page.bringToFront');
  await sleep(2000);

  // --- Step 5: Open Extension Side Panel ---
  console.log('Step 5: Opening Extension Side Panel...');
  const sidepanelUrl = `chrome-extension://${extId}/sidepanel.html`;
  const panelTargetRes = await fetch(`http://127.0.0.1:${cdpPort}/json/new?${sidepanelUrl}`, { method: 'PUT' });
  const panelTarget = await panelTargetRes.json();
  const panelSession = new CdpSession(panelTarget.webSocketDebuggerUrl);
  await panelSession.connect();
  await panelSession.send('Page.enable');
  await panelSession.send('Emulation.setDeviceMetricsOverride', {
    width: 440,
    height: 750,
    deviceScaleFactor: 1,
    mobile: false,
  });

  await sleep(1500);

  // Ensure sidepanel has the session token stored in chrome.storage.local
  if (token) {
    await panelSession.eval(`
      chrome.storage.local.set({ missed_auth_token: '${token}' });
      if (window.__missed) window.__missed.refreshSessionToken();
    `);
    await sleep(800);
  }

  // Click "Capture current chat"
  console.log('Step 6: Triggering "Capture current chat" in extension side panel...');
  await panelSession.eval(`
    document.getElementById('catchMeUpBtn').click();
  `);

  await sleep(3000);

  // Verify conversation is captured and analyzed
  const title = await panelSession.eval(`document.getElementById('convTitle').textContent`);
  const msgCount = await panelSession.eval(`document.getElementById('msgCount').textContent`);
  const urgentCount = await panelSession.eval(`document.getElementById('urgentCount').textContent`);
  const taskCount = await panelSession.eval(`document.getElementById('tasksCount').textContent`);
  const decisionCount = await panelSession.eval(`document.getElementById('decisionsCount').textContent`);

  console.log(`Extracted chat title: "${title}"`);
  console.log(`Indexed messages: ${msgCount}`);
  console.log(`Findings: Urgent ${urgentCount}, Tasks ${taskCount}, Decisions ${decisionCount}`);

  // Screenshot 1: Side Panel Triage
  const triageScreenshot = await panelSession.send('Page.captureScreenshot', { format: 'png' });
  const triagePath = path.join(screenshotsDir, 'extension-sidepanel-triage.png');
  fs.writeFileSync(triagePath, Buffer.from(triageScreenshot.data, 'base64'));
  console.log(`✓ Saved screenshot: extension-sidepanel-triage.png`);

  // Step 7: Click "Save to workspace"
  console.log('Step 7: Clicking "Save to workspace" in side panel...');
  await panelSession.eval(`
    document.getElementById('saveWorkspaceBtn').click();
  `);

  await sleep(1200);

  const saveNotice = await panelSession.eval(`document.getElementById('noticeBanner').textContent`);
  console.log(`Save status notice: "${saveNotice}"`);

  // Screenshot 2: Side Panel Saved Confirmation
  const savedScreenshot = await panelSession.send('Page.captureScreenshot', { format: 'png' });
  const savedPath = path.join(screenshotsDir, 'extension-sidepanel-saved.png');
  fs.writeFileSync(savedPath, Buffer.from(savedScreenshot.data, 'base64'));
  console.log(`✓ Saved screenshot: extension-sidepanel-saved.png`);

  // --- Step 8: Confirm Saved Conversation in Web Workspace ---
  console.log('Step 8: Checking web workspace for saved conversation...');
  await webSession.eval(`window.location.reload()`);
  await sleep(3000);

  // Click on the newly saved conversation in sidebar / list
  const clickResult = await webSession.eval(`
    (() => {
      const titles = Array.from(document.querySelectorAll('h4'));
      const apolloTitle = titles.find(h => h.textContent && h.textContent.includes('Project Apollo Staging'));
      if (apolloTitle) {
        const card = apolloTitle.closest('.motion-card-lift') || apolloTitle.parentElement;
        if (card) {
          card.click();
          return 'Clicked card: ' + apolloTitle.textContent;
        }
      }
      return 'Card not found';
    })()
  `);
  console.log('Click result:', clickResult);

  await sleep(2500);

  // Trigger "Trace source" on urgent finding to show source highlight
  await webSession.eval(`
    (() => {
      const traceBtns = Array.from(document.querySelectorAll('button')).filter(b => b.textContent.includes('Trace source'));
      if (traceBtns.length > 0) traceBtns[0].click();
    })()
  `);

  await sleep(1500);

  // Screenshot 3: Web Workspace with conversation saved from extension
  const wsScreenshot = await webSession.send('Page.captureScreenshot', { format: 'png' });
  const wsPath = path.join(screenshotsDir, 'workspace-saved-from-extension.png');
  fs.writeFileSync(wsPath, Buffer.from(wsScreenshot.data, 'base64'));
  console.log(`✓ Saved screenshot: workspace-saved-from-extension.png`);

  // Screenshot 4: Mobile Viewport of Workspace
  await webSession.send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
  });
  await sleep(800);

  const mobileScreenshot = await webSession.send('Page.captureScreenshot', { format: 'png' });
  const mobilePath = path.join(screenshotsDir, 'workspace-extension-mobile.png');
  fs.writeFileSync(mobilePath, Buffer.from(mobileScreenshot.data, 'base64'));
  console.log(`✓ Saved screenshot: workspace-extension-mobile.png`);

  console.log('\n==========================================');
  console.log('ALL PHASE 5 VERIFICATION EVIDENCE CAPTURED!');
  console.log('==========================================\n');

  webSession.close();
  waSession.close();
  panelSession.close();
} finally {
  server.close();
  try {
    chromeProc.kill();
  } catch {}
}
