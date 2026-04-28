-- ─────────────────────────────────────────────
--  Clipency — Supabase Schema
--  Run this in: Supabase Dashboard → SQL Editor
-- ─────────────────────────────────────────────

-- 1. Submissions table
CREATE TABLE IF NOT EXISTS public.submissions (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id     INT NOT NULL,
  campaign_title  TEXT NOT NULL,
  platform        TEXT NOT NULL,
  account_handle  TEXT NOT NULL,
  video_url       TEXT NOT NULL,
  -- Stats (updated later via your backend / webhook)
  views           BIGINT DEFAULT 0,
  likes           BIGINT DEFAULT 0,
  comments        BIGINT DEFAULT 0,
  earnings        NUMERIC(10,2) DEFAULT 0.00,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','paid')),
  submitted_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_submissions_updated_at ON public.submissions;
CREATE TRIGGER trg_submissions_updated_at
  BEFORE UPDATE ON public.submissions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. Row Level Security
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Users can only read their own submissions
CREATE POLICY "select_own_submissions" ON public.submissions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own submissions
CREATE POLICY "insert_own_submissions" ON public.submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update stats on their own submissions (views/likes/comments)
CREATE POLICY "update_own_submissions" ON public.submissions
  FOR UPDATE USING (auth.uid() = user_id);

-- 4. Helper view: per-user aggregate stats
CREATE OR REPLACE VIEW public.user_stats AS
SELECT
  user_id,
  COUNT(*)                          AS total_submissions,
  COUNT(*) FILTER (WHERE status IN ('approved','paid')) AS approved_submissions,
  COALESCE(SUM(views),   0)         AS total_views,
  COALESCE(SUM(likes),   0)         AS total_likes,
  COALESCE(SUM(comments),0)         AS total_comments,
  COALESCE(SUM(earnings),0.00)      AS total_earnings,
  COUNT(DISTINCT campaign_id)       AS active_campaigns
FROM public.submissions
GROUP BY user_id;
