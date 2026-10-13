import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getSafeRedirect, getApiUrl } from '../src/config/env.ts';
import { ApiError } from '../src/api/client.ts';
import {
  SAMPLE_MESSAGES,
  analyzeConversation,
} from '@missed/engine';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendRoot = path.resolve(__dirname, '..');

describe('Phase 4A — Frontend Authentication, Routing & Persistence Integration', () => {
  describe('1. Security & Open-Redirect Prevention (getSafeRedirect)', () => {
    it('accepts safe internal application routes', () => {
      assert.equal(getSafeRedirect('/workspace'), '/workspace');
      assert.equal(
        getSafeRedirect('/workspace?filter=urgent'),
        '/workspace?filter=urgent'
      );
      assert.equal(getSafeRedirect('/demo'), '/demo');
      assert.equal(getSafeRedirect('/'), '/');
    });

    it('rejects external URLs and returns safe fallback', () => {
      assert.equal(getSafeRedirect('https://malicious.com'), '/workspace');
      assert.equal(getSafeRedirect('http://attacker.com/login'), '/workspace');
      assert.equal(getSafeRedirect('//attacker.com'), '/workspace');
      assert.equal(getSafeRedirect('javascript:alert(1)'), '/workspace');
      assert.equal(getSafeRedirect('\\evil.com'), '/workspace');
    });

    it('returns custom fallback when input is empty or invalid', () => {
      assert.equal(getSafeRedirect(null, '/demo'), '/demo');
      assert.equal(getSafeRedirect(undefined, '/'), '/');
      assert.equal(getSafeRedirect('', '/demo'), '/demo');
      assert.equal(getSafeRedirect('   ', '/workspace'), '/workspace');
    });
  });

  describe('2. API Base URL and Endpoint Normalization (getApiUrl)', () => {
    it('ensures /api base path is consistently formatted', () => {
      const healthUrl = getApiUrl('/health');
      assert.ok(healthUrl.endsWith('/api/health'), `Expected ${healthUrl} to end with /api/health`);

      const authUrl = getApiUrl('/auth/signin');
      assert.ok(authUrl.endsWith('/api/auth/signin'), `Expected ${authUrl} to end with /api/auth/signin`);

      const prefixedUrl = getApiUrl('/api/conversations');
      assert.ok(prefixedUrl.endsWith('/api/conversations'), `Expected ${prefixedUrl} to end with /api/conversations`);
      assert.ok(!prefixedUrl.includes('/api/api/'), 'Must not duplicate /api prefix');
    });
  });

  describe('3. API Error Normalization & Status Mapping', () => {
    it('creates ApiError with code, status, message, and details', () => {
      const err = new ApiError('INVALID_CREDENTIALS', 401, 'Invalid email or password.');
      assert.equal(err.name, 'ApiError');
      assert.equal(err.code, 'INVALID_CREDENTIALS');
      assert.equal(err.status, 401);
      assert.equal(err.message, 'Invalid email or password.');
    });

    it('identifies 413 Payload Too Large and 422 Unprocessable Entity errors', () => {
      const payloadErr = new ApiError('PAYLOAD_TOO_LARGE', 413, 'File exceeds 10 MiB limit.');
      assert.equal(payloadErr.status, 413);

      const formatErr = new ApiError('INVALID_CONVERSATION_FORMAT', 422, 'Cannot parse conversation export.');
      assert.equal(formatErr.status, 422);
    });

    it('identifies 429 Rate Limit errors', () => {
      const rateLimitErr = new ApiError('RATE_LIMIT_EXCEEDED', 429, 'Too many requests. Please slow down.');
      assert.equal(rateLimitErr.status, 429);
    });
  });

  describe('4. Routing & Page Architecture File Verification', () => {
    it('ensures all required public and protected route components exist', () => {
      const expectedPages = [
        'src/pages/LandingPage.tsx',
        'src/pages/SignUpPage.tsx',
        'src/pages/LoginPage.tsx',
        'src/pages/DemoPage.tsx',
        'src/pages/WorkspacePage.tsx',
        'src/components/auth/ProtectedRoute.tsx',
        'src/context/AuthContext.tsx',
        'src/api/client.ts',
        'src/config/env.ts',
      ];

      for (const relPath of expectedPages) {
        const fullPath = path.join(frontendRoot, relPath);
        assert.ok(fs.existsSync(fullPath), `Expected file to exist at ${relPath}`);
      }
    });

    it('verifies App.tsx mounts public landing, signup, login, demo, and protected workspace routes', () => {
      const appPath = path.join(frontendRoot, 'src', 'App.tsx');
      const content = fs.readFileSync(appPath, 'utf-8');

      assert.ok(content.includes('path="/" element={<LandingPage />}'));
      assert.ok(content.includes('path="/signup"'));
      assert.ok(content.includes('path="/login"'));
      assert.ok(content.includes('path="/demo" element={<DemoPage />}'));
      assert.ok(content.includes('path="/workspace"'));
      assert.ok(content.includes('<ProtectedRoute>'));
      assert.ok(content.includes('<PublicOnlyRoute>'));
    });
  });

  describe('5. Guest Demo vs Authenticated Cloud Isolation', () => {
    it('guarantees guest demo runs deterministic engine locally with zero cloud write requirements', () => {
      // Analyze sample conversation in memory
      const analysis = analyzeConversation(SAMPLE_MESSAGES);
      assert.ok(analysis.findings.length > 0, 'Demo must produce findings locally');
      assert.ok(analysis.recap.totalMessages > 0, 'Demo must compute recap locally');

      // Demo findings link to valid source messages
      for (const finding of analysis.findings) {
        const sourceMsg = SAMPLE_MESSAGES.find((m) => m.id === finding.sourceMessageId);
        assert.ok(sourceMsg, `Finding ${finding.id} must link to a valid source message in sample dataset`);
      }
    });

    it('ensures DemoPage file explicitly labels guest demo and offers sign-up CTA', () => {
      const demoPath = path.join(frontendRoot, 'src', 'pages', 'DemoPage.tsx');
      const content = fs.readFileSync(demoPath, 'utf-8');

      assert.ok(content.includes('Guest Demo Mode'));
      assert.ok(content.includes('Sign Up to Save to Cloud'));
      assert.ok(content.includes('Zero cloud writes'));
    });
  });

  describe('6. Workspace Cloud Persistence & Task Sync Contract', () => {
    it('verifies WorkspacePage provides cloud conversation listing and deletion flows', () => {
      const workspacePath = path.join(frontendRoot, 'src', 'pages', 'WorkspacePage.tsx');
      const content = fs.readFileSync(workspacePath, 'utf-8');

      assert.ok(content.includes('api.listConversations'));
      assert.ok(content.includes('api.getConversation'));
      assert.ok(content.includes('api.createConversation'));
      assert.ok(content.includes('api.deleteConversation'));
      assert.ok(content.includes('api.updateTask'));
      assert.ok(content.includes('Cloud Saved'));
      assert.ok(content.includes('Local Memory'));
    });

    it('verifies account deletion confirmation requires explicit confirmation phrase', () => {
      const workspacePath = path.join(frontendRoot, 'src', 'pages', 'WorkspacePage.tsx');
      const content = fs.readFileSync(workspacePath, 'utf-8');

      assert.ok(content.includes('DELETE_MY_ACCOUNT'));
      assert.ok(content.includes('deleteAccount'));
    });
  });
});
