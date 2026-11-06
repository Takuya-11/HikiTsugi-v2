-- 引き継ぎ書本体
CREATE TABLE documents (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL DEFAULT '',
  data        JSONB NOT NULL DEFAULT '{}',
  version     INT NOT NULL DEFAULT 1,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 共有URL管理（expires_at は将来機能用 — MVP では NULL のまま）
CREATE TABLE share_tokens (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id  UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  token        UUID DEFAULT gen_random_uuid() NOT NULL UNIQUE,
  status       TEXT NOT NULL DEFAULT 'active'
                 CHECK (status IN ('active', 'revoked')),
  expires_at   TIMESTAMPTZ DEFAULT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  revoked_at   TIMESTAMPTZ DEFAULT NULL
);

-- RLS: documents（本人のみ CRUD）
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all" ON documents
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS: share_tokens
ALTER TABLE share_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all" ON share_tokens
  USING (
    document_id IN (SELECT id FROM documents WHERE user_id = auth.uid())
  )
  WITH CHECK (
    document_id IN (SELECT id FROM documents WHERE user_id = auth.uid())
  );
-- 閲覧者（anon）はアクティブなトークンのみ SELECT 可
CREATE POLICY "viewer_read_active" ON share_tokens
  FOR SELECT
  TO anon
  USING (status = 'active');

-- updated_at の自動更新
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
