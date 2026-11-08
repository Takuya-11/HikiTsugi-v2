# Supabase ダッシュボード確認ガイド

> **テストを始める前に、このガイドの全項目を確認してください。**  
> テストに合格するには、マイグレーション 00002 が適用済みである必要があります。

---

## ダッシュボードへのアクセス方法

1. ブラウザで `https://supabase.com` を開く
2. ログインする
3. 左サイドバーまたはプロジェクト一覧から、このアプリのプロジェクトを開く

---

## 確認1：Migration 00002 の適用状況

マイグレーション 00002 が適用されていないと、共有URLが発行できません（テスト9〜11が全て不合格になります）。

### 確認方法

**方法A：テーブルの構造を見る（推奨）**

1. 左サイドバーの「Table Editor」をクリック
2. 「share_tokens」テーブルをクリック
3. 画面上部の「Columns（カラム）」タブを確認する

**合格の状態（00002 が適用済み）:**
- `token_hash` カラム（TEXT 型）が存在する
- `token` カラム（UUID 型）が**存在しない**

**要注意の状態（00002 が未適用）:**
- `token` カラム（UUID 型）が存在する
- `token_hash` カラムが存在しない

---

**方法B：SQL エディタで直接確認する**

1. 左サイドバーの「SQL Editor」をクリック
2. 「New query」をクリック
3. 以下の SQL を入力して実行（「RUN」ボタンをクリック）：

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'share_tokens'
ORDER BY ordinal_position;
```

**合格の出力例:**
```
column_name  | data_type
-------------|-------------------
id           | uuid
document_id  | uuid
token_hash   | text          ← これがあれば OK
status       | text
expires_at   | timestamp with time zone
created_at   | timestamp with time zone
revoked_at   | timestamp with time zone
```

`token` 行がなく、`token_hash` 行があれば **00002 は適用済みです。**

---

### 00002 が未適用だった場合

> **この SQL を実行する前に、必ず私に報告してください。勝手に実行しないこと。**

以下の SQL を実行する必要があります（内容を先に確認すること）：

```sql
-- viewer_read_active ポリシーの削除（anon による token 一覧取得の脆弱性修正）
DROP POLICY IF EXISTS "viewer_read_active" ON share_tokens;

-- token UUID 列を削除し token_hash TEXT 列に置き換え
ALTER TABLE share_tokens DROP COLUMN IF EXISTS token;
ALTER TABLE share_tokens ADD COLUMN token_hash TEXT NOT NULL UNIQUE DEFAULT '';
ALTER TABLE share_tokens ALTER COLUMN token_hash DROP DEFAULT;
```

**この SQL の目的:**
- `viewer_read_active` ポリシーを削除する（匿名ユーザーが全トークンを読めてしまう脆弱性の修正）
- UUID 型の `token` カラムを削除する（使用しない）
- `token_hash` TEXT カラムを追加する（SHA-256 ハッシュを保存するため）

---

## 確認2：share_tokens テーブルのカラム状態

確認1と同じ手順で確認できます。

**確認すること:**
- `token_hash` が TEXT 型で存在する → ✅
- `token` UUID カラムが存在しない → ✅

---

## 確認3：viewer_read_active ポリシーの削除確認

匿名ユーザーが全トークンを読み取れるポリシーが削除されているかを確認します。

### 確認方法

1. 左サイドバーの「Authentication」→「Policies」をクリック
2. 「share_tokens」テーブルのポリシー一覧を確認する

**合格の状態（安全）:**
- `owner_all` ポリシーのみ存在する
- `viewer_read_active` ポリシーが**存在しない**

**要注意の状態:**
- `viewer_read_active` ポリシーが存在する → 00002 が未適用の可能性

---

## 確認4：RLS（行レベルセキュリティ）の有効化確認

テーブルが RLS で保護されているかを確認します。これが無効だと、全てのデータが誰でも読み書きできてしまいます。

### 確認方法

1. 左サイドバーの「Table Editor」をクリック
2. 「documents」テーブルをクリック
3. 右上付近に「RLS enabled（RLS 有効）」という表示があることを確認

同じ手順で「share_tokens」テーブルも確認する。

**合格の状態:**
- `documents` テーブル：RLS が有効
- `share_tokens` テーブル：RLS が有効

---

**方法B：SQL で一括確認する**

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('documents', 'share_tokens');
```

**合格の出力:**
```
tablename     | rowsecurity
--------------|------------
documents     | true
share_tokens  | true
```

両方 `true` であれば **RLS は有効です。**

---

## 確認5：Service Role Key の使用場所確認

Service Role Key は「RLS を無視して全データにアクセスできる特権キー」です。サーバー側のコードだけで使用されているかを確認します。

### コード上の確認（すでに実施済み）

`lib/supabase/admin.ts` ファイルのみで使用されており、以下の安全対策が取られています：

- `import 'server-only'` — ブラウザ側のコードでこのファイルが使われると**ビルドエラー**になる
- 使用箇所: `app/view/[token]/page.tsx`（共有閲覧ページ）のみ

### Supabase Dashboard での確認

1. 左サイドバーの「Settings（設定）」→「API」をクリック
2. `service_role key` が表示されていることを確認
3. **この画面のスクリーンショットは撮らないこと**（キーが写るため）

> **Service Role Key は絶対に他人に見せないこと。GitHub にアップロードしないこと。**

---

## 確認サマリー（テスト前に記入）

| 確認項目 | 状態 |
|---|---|
| 1. Migration 00002 が適用済み（`token_hash` カラムがある） | ✅ / ❌ / 未確認 |
| 2. `token` カラムが存在しない | ✅ / ❌ / 未確認 |
| 3. `viewer_read_active` ポリシーが存在しない | ✅ / ❌ / 未確認 |
| 4a. `documents` テーブルの RLS が有効 | ✅ / ❌ / 未確認 |
| 4b. `share_tokens` テーブルの RLS が有効 | ✅ / ❌ / 未確認 |
| 5. Service Role Key がサーバー側コードのみで使用 | ✅（コード確認済み） |

**全て ✅ になったら、ブラウザ手動テストを開始できます。**

❌ がある項目があれば、テストを開始する前に報告してください。

---

## よくある問題と対処

### Q. Table Editor に `share_tokens` テーブルが表示されない
→ Migration 00001 も未適用の可能性がある。SQL エディタで以下を実行して確認：
```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
```
`documents` も `share_tokens` もない場合は、両方のマイグレーションが未適用。**実行前に必ず報告すること。**

### Q. RLS の確認画面が見当たらない
→ 「Table Editor」→ テーブル選択 → 右上の「Edit Table」ボタンをクリックすると RLS のオン/オフが確認できる。

### Q. SQL エディタの「RUN」ボタンが見当たらない
→ 画面右上の「Run」または `Ctrl + Enter` / `Command + Enter` で実行できる。
