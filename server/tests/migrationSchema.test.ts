import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Phase 2 SQL Migration Schema & RLS Verification', () => {
  const migrationPath = join(
    import.meta.dirname,
    '..',
    'migrations',
    '001_initial_schema.sql'
  );
  const sql = readFileSync(migrationPath, 'utf8');

  const tables = [
    'conversations',
    'messages',
    'findings',
    'tasks',
    'user_settings',
  ] as const;

  it('defines all five core persistence tables with owner_id references to auth.users(id)', () => {
    for (const table of tables) {
      assert.match(
        sql,
        new RegExp(`CREATE TABLE IF NOT EXISTS public\\.${table}\\b`, 'i'),
        `Missing CREATE TABLE for public.${table}`
      );
    }
    assert.match(sql, /REFERENCES auth\.users\(id\) ON DELETE CASCADE/i);
  });

  it('enables and forces Row-Level Security (RLS) on every persistence table', () => {
    for (const table of tables) {
      assert.match(
        sql,
        new RegExp(`ALTER TABLE public\\.${table} ENABLE ROW LEVEL SECURITY;`, 'i'),
        `Missing ENABLE ROW LEVEL SECURITY for public.${table}`
      );
      assert.match(
        sql,
        new RegExp(`ALTER TABLE public\\.${table} FORCE ROW LEVEL SECURITY;`, 'i'),
        `Missing FORCE ROW LEVEL SECURITY for public.${table}`
      );
    }
  });

  it('defines explicit SELECT, INSERT, UPDATE, and DELETE policies using auth.uid() = owner_id', () => {
    for (const table of tables) {
      for (const action of ['select', 'insert', 'update', 'delete'] as const) {
        assert.match(
          sql,
          new RegExp(`CREATE POLICY ${table}_${action}_own ON public\\.${table}`, 'i'),
          `Missing ${action.toUpperCase()} RLS policy on public.${table}`
        );
      }
    }
    assert.match(sql, /auth\.uid\(\)\s*=\s*owner_id/i);
  });

  it('enforces composite foreign-key tenant integrity across child tables', () => {
    assert.match(
      sql,
      /FOREIGN KEY \(conversation_id, owner_id\)\s+REFERENCES public\.conversations\(id, owner_id\)\s+ON DELETE CASCADE/i
    );
    assert.match(
      sql,
      /FOREIGN KEY \(finding_id, conversation_id, owner_id\)\s+REFERENCES public\.findings\(id, conversation_id, owner_id\)\s+ON DELETE CASCADE/i
    );
  });
});
