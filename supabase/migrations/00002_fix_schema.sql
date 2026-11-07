-- viewer_read_active ポリシーの削除（anon による token 一覧取得の脆弱性修正）
DROP POLICY IF EXISTS "viewer_read_active" ON share_tokens;

-- token UUID 列を削除し token_hash TEXT 列に置き換え
-- （MVP では既存データが存在しないため単純変換）
ALTER TABLE share_tokens DROP COLUMN IF EXISTS token;
ALTER TABLE share_tokens ADD COLUMN token_hash TEXT NOT NULL UNIQUE DEFAULT '';
ALTER TABLE share_tokens ALTER COLUMN token_hash DROP DEFAULT;
