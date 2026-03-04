-- llm_usage_logs: tracks every LLM API call
CREATE TABLE llm_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  feature TEXT NOT NULL,
  success BOOLEAN NOT NULL DEFAULT true,
  latency_ms INTEGER,
  tokens_in INTEGER,
  tokens_out INTEGER,
  error_type TEXT,
  is_fallback BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_llm_usage_created_at ON llm_usage_logs (created_at);
CREATE INDEX idx_llm_usage_provider ON llm_usage_logs (provider);

-- RLS: service_role only (no public access)
ALTER TABLE llm_usage_logs ENABLE ROW LEVEL SECURITY;

-- profiles: admin flag for auth
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (auth.uid() = id);

-- Cleanup function: delete logs older than 30 days
CREATE OR REPLACE FUNCTION cleanup_old_llm_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM llm_usage_logs WHERE created_at < now() - interval '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
