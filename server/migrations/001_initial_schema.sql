-- =============================================================================
-- Missed. (What Did I Miss?) — Phase 2 Initial Database Schema & RLS Policies
-- Target: PostgreSQL 15+ / Supabase (auth.users + auth.uid())
-- =============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. Automatic updated_at Trigger Function
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------------------
-- 2. Table: public.conversations
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(trim(title)) BETWEEN 1 AND 200),
  source_format TEXT NOT NULL CHECK (
    source_format IN ('json_standard', 'json_slack', 'txt_bracketed', 'txt_whatsapp', 'txt_simple')
  ),
  message_count INTEGER NOT NULL DEFAULT 0 CHECK (message_count >= 0),
  participant_count INTEGER NOT NULL DEFAULT 0 CHECK (participant_count >= 0),
  participants JSONB NOT NULL DEFAULT '[]'::jsonb,
  top_topics JSONB NOT NULL DEFAULT '[]'::jsonb,
  summary_bullets JSONB NOT NULL DEFAULT '[]'::jsonb,
  start_time TEXT NULL,
  end_time TEXT NULL,
  warning TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT conversations_id_owner_unique UNIQUE (id, owner_id)
);

CREATE INDEX IF NOT EXISTS idx_conversations_owner_created
  ON public.conversations (owner_id, created_at DESC, id DESC);

DROP TRIGGER IF EXISTS trg_conversations_updated_at ON public.conversations;
CREATE TRIGGER trg_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 3. Table: public.messages
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL CHECK (char_length(trim(external_id)) >= 1),
  seq INTEGER NOT NULL CHECK (seq >= 0),
  sender TEXT NOT NULL CHECK (char_length(trim(sender)) >= 1),
  text TEXT NOT NULL CHECK (char_length(trim(text)) >= 1),
  timestamp TEXT NULL,
  metadata JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT messages_conversation_seq_unique UNIQUE (conversation_id, seq),
  CONSTRAINT messages_conversation_external_id_unique UNIQUE (conversation_id, external_id),
  CONSTRAINT messages_id_conv_owner_unique UNIQUE (id, conversation_id, owner_id),
  CONSTRAINT messages_conversation_owner_fk
    FOREIGN KEY (conversation_id, owner_id)
    REFERENCES public.conversations(id, owner_id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_seq
  ON public.messages (conversation_id, seq ASC);

CREATE INDEX IF NOT EXISTS idx_messages_owner_id
  ON public.messages (owner_id);

-- -----------------------------------------------------------------------------
-- 4. Table: public.findings
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (
    type IN ('urgent', 'action_item', 'decision', 'deadline', 'mention')
  ),
  title TEXT NOT NULL CHECK (char_length(trim(title)) >= 1),
  snippet TEXT NOT NULL CHECK (char_length(trim(snippet)) >= 1),
  priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  source_message_id UUID NULL REFERENCES public.messages(id) ON DELETE SET NULL,
  source_external_id TEXT NOT NULL CHECK (char_length(trim(source_external_id)) >= 1),
  sender TEXT NOT NULL CHECK (char_length(trim(sender)) >= 1),
  timestamp TEXT NULL,
  assignee TEXT NULL,
  deadline TEXT NULL,
  relevance_score INTEGER NOT NULL CHECK (relevance_score BETWEEN 0 AND 100),
  analyzer TEXT NOT NULL DEFAULT 'deterministic' CHECK (analyzer IN ('deterministic', 'ai')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT findings_id_conv_owner_unique UNIQUE (id, conversation_id, owner_id),
  CONSTRAINT findings_conversation_owner_fk
    FOREIGN KEY (conversation_id, owner_id)
    REFERENCES public.conversations(id, owner_id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_findings_conversation_id
  ON public.findings (conversation_id);

CREATE INDEX IF NOT EXISTS idx_findings_owner_id
  ON public.findings (owner_id);

-- -----------------------------------------------------------------------------
-- 5. Table: public.tasks
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  finding_id UUID NOT NULL UNIQUE,
  conversation_id UUID NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT tasks_completion_consistency_chk CHECK (
    (completed = true AND completed_at IS NOT NULL) OR
    (completed = false AND completed_at IS NULL)
  ),
  CONSTRAINT tasks_finding_conv_owner_fk
    FOREIGN KEY (finding_id, conversation_id, owner_id)
    REFERENCES public.findings(id, conversation_id, owner_id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tasks_conversation_id
  ON public.tasks (conversation_id);

CREATE INDEX IF NOT EXISTS idx_tasks_owner_id
  ON public.tasks (owner_id);

DROP TRIGGER IF EXISTS trg_tasks_updated_at ON public.tasks;
CREATE TRIGGER trg_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 6. Table: public.user_settings
-- -----------------------------------------------------------------------------
-- Note: ai_enabled is a user preference toggle only. Per-conversation consent
-- before transmitting conversation content to an AI provider is enforced
-- separately (Phase 5).
CREATE TABLE IF NOT EXISTS public.user_settings (
  owner_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  ai_enabled BOOLEAN NOT NULL DEFAULT false,
  ai_consent_at TIMESTAMPTZ NULL,
  retention_days INTEGER NOT NULL DEFAULT 30 CHECK (retention_days IN (7, 30, 90, 365)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_user_settings_updated_at ON public.user_settings;
CREATE TRIGGER trg_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 7. Row-Level Security (RLS) Policies
-- -----------------------------------------------------------------------------
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations FORCE ROW LEVEL SECURITY;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages FORCE ROW LEVEL SECURITY;

ALTER TABLE public.findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.findings FORCE ROW LEVEL SECURITY;

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks FORCE ROW LEVEL SECURITY;

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings FORCE ROW LEVEL SECURITY;

-- Conversations Policies
DROP POLICY IF EXISTS conversations_select_own ON public.conversations;
CREATE POLICY conversations_select_own ON public.conversations
  FOR SELECT TO authenticated
  USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS conversations_insert_own ON public.conversations;
CREATE POLICY conversations_insert_own ON public.conversations
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS conversations_update_own ON public.conversations;
CREATE POLICY conversations_update_own ON public.conversations
  FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS conversations_delete_own ON public.conversations;
CREATE POLICY conversations_delete_own ON public.conversations
  FOR DELETE TO authenticated
  USING (auth.uid() = owner_id);

-- Messages Policies
DROP POLICY IF EXISTS messages_select_own ON public.messages;
CREATE POLICY messages_select_own ON public.messages
  FOR SELECT TO authenticated
  USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS messages_insert_own ON public.messages;
CREATE POLICY messages_insert_own ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = owner_id
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id AND c.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS messages_update_own ON public.messages;
CREATE POLICY messages_update_own ON public.messages
  FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS messages_delete_own ON public.messages;
CREATE POLICY messages_delete_own ON public.messages
  FOR DELETE TO authenticated
  USING (auth.uid() = owner_id);

-- Findings Policies
DROP POLICY IF EXISTS findings_select_own ON public.findings;
CREATE POLICY findings_select_own ON public.findings
  FOR SELECT TO authenticated
  USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS findings_insert_own ON public.findings;
CREATE POLICY findings_insert_own ON public.findings
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = owner_id
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id AND c.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS findings_update_own ON public.findings;
CREATE POLICY findings_update_own ON public.findings
  FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS findings_delete_own ON public.findings;
CREATE POLICY findings_delete_own ON public.findings
  FOR DELETE TO authenticated
  USING (auth.uid() = owner_id);

-- Tasks Policies
DROP POLICY IF EXISTS tasks_select_own ON public.tasks;
CREATE POLICY tasks_select_own ON public.tasks
  FOR SELECT TO authenticated
  USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS tasks_insert_own ON public.tasks;
CREATE POLICY tasks_insert_own ON public.tasks
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = owner_id
    AND EXISTS (
      SELECT 1 FROM public.findings f
      WHERE f.id = finding_id
        AND f.conversation_id = conversation_id
        AND f.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS tasks_update_own ON public.tasks;
CREATE POLICY tasks_update_own ON public.tasks
  FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS tasks_delete_own ON public.tasks;
CREATE POLICY tasks_delete_own ON public.tasks
  FOR DELETE TO authenticated
  USING (auth.uid() = owner_id);

-- User Settings Policies
DROP POLICY IF EXISTS user_settings_select_own ON public.user_settings;
CREATE POLICY user_settings_select_own ON public.user_settings
  FOR SELECT TO authenticated
  USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS user_settings_insert_own ON public.user_settings;
CREATE POLICY user_settings_insert_own ON public.user_settings
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS user_settings_update_own ON public.user_settings;
CREATE POLICY user_settings_update_own ON public.user_settings
  FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS user_settings_delete_own ON public.user_settings;
CREATE POLICY user_settings_delete_own ON public.user_settings
  FOR DELETE TO authenticated
  USING (auth.uid() = owner_id);

COMMIT;
