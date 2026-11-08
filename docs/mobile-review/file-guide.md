# ファイルガイド

各ファイルの役割・実行タイミング・依存関係・変更時の影響をまとめています。

---

## 設定・エントリポイント

### `next.config.ts`
- **役割:** Next.js の設定（Tailwind v4 / turbopack 連携）
- **変更時の影響:** アプリ全体のビルド設定に影響。変更後はビルドが必要

### `proxy.ts`
- **役割:** Next.js 16 の Middleware 相当。全リクエストをインターセプト。`/(protected)` ルートで未ログインなら `/login` へリダイレクト
- **実行タイミング:** 全リクエストの前（Edge Runtime）
- **注意:** Next.js 16 では `middleware.ts` ではなく `proxy.ts`。名前を変えると認証保護が完全に無効になる

### `tsconfig.json`
- **役割:** TypeScript 設定（strict: true, `@/` = プロジェクトルートへのパスエイリアス）

### `eslint.config.mjs`
- **役割:** ESLint 設定（Next.js / React Hooks / TypeScript ルール）

---

## アプリルート（`app/`）

### `app/layout.tsx`
- **役割:** 全ページ共通の HTML ラッパー（フォント・テーマ・メタタグ）
- **変更時の影響:** 全ページのレイアウトに影響

### `app/globals.css`
- **役割:** Tailwind CSS v4 のグローバルスタイル。`@media print` ブロックに印刷用 CSS
- **注意:** 印刷関連 CSS（`@page`、`.print:hidden`、`.break-inside-avoid`）はここでのみ定義

### `app/page.tsx`
- **役割:** トップページ（`/`）。ログイン済みは `/dashboard`、未ログインは `/login` へリダイレクト

### `app/(auth)/login/page.tsx`
- **役割:** メールアドレス + パスワードのログインフォーム。Supabase Auth の `signInWithPassword` を呼ぶ

### `app/(auth)/register/page.tsx`
- **役割:** ユーザー登録フォーム。`supabase.auth.signUp` を呼ぶ

### `app/(protected)/layout.tsx`
- **役割:** ログイン済みページ共通のレイアウト（ヘッダー・ログアウトボタン）

### `app/(protected)/dashboard/page.tsx`
- **役割:** 文書一覧ページ。`export const instant = false` で毎回 SSR。RLS でそのユーザーの文書のみ表示
- **接続先:** Supabase `documents` テーブル（SELECT）

### `app/(protected)/documents/[id]/edit/page.tsx`
- **役割:** 編集画面の Server Component。文書を取得して `DocumentEditor` に渡す
- **接続先:** Supabase `documents`（SELECT one）→ 存在しなければ `/dashboard` へリダイレクト

### `app/(protected)/documents/[id]/preview/page.tsx`
- **役割:** 印刷プレビュー画面。`export const instant = false`。最新データを DB から取得して `PreviewDocument` に渡す

### `app/(protected)/documents/[id]/share/page.tsx`
- **役割:** 共有管理画面。現在の共有ステータス（`none/active/revoked`）を `ShareManager` に渡す
- **接続先:** Supabase `documents`（title 取得）+ `share_tokens`（現在の status 取得）

### `app/api/documents/route.ts`
- **役割:** `POST /api/documents` — 新規文書作成。`export const instant = false`
- **認証:** `supabase.auth.getUser()` で確認。user_id を DB に挿入
- **レスポンス:** `{ id: string }` → ダッシュボードがこれを受けてリダイレクト

### `app/api/documents/[id]/route.ts`
- **役割:**
  - `PATCH /api/documents/:id` — 自動保存（楽観的排他制御）
  - `DELETE /api/documents/:id` — 文書削除
- **楽観的排他制御:** PATCH で `WHERE id=? AND version=?` → 0行更新なら 409 Conflict を返す

### `app/api/documents/[id]/share/route.ts`
- **役割:**
  - `POST` — 共有トークン発行。`crypto.randomBytes(32)` で平文生成 → SHA-256 ハッシュを DB 保存 → 平文を一度だけ返す
  - `DELETE` — 共有失効。`status='revoked', revoked_at=now()` に更新

### `app/view/[token]/page.tsx`
- **役割:** 共有閲覧ページ（認証不要）。`createAdminClient()` で RLS をバイパスして文書を取得
- **セキュリティ:** 平文トークンを SHA-256 ハッシュ化してから DB 検索。`status !== 'active'` なら `/error?reason=revoked` へ

### `app/error/page.tsx`
- **役割:** 共有 URL エラー表示。`?reason=invalid` または `?reason=revoked` で異なるメッセージを表示

---

## コンポーネント（`components/`）

### `components/editor/DocumentEditor.tsx`
- **役割:** エディタ画面の中心（Client Component）。フォーム全体の `doc` state を持つ
- **重要パターン:**
  - `useCallback` + `setDoc(prev => ...)` — stale closure 防止
  - `startTransition(() => setDoc(...))` — useEffect 内の setState（ESLint ルール対応）
  - `conflictInfo` state → 競合ダイアログ overlay
- **接続先:** `useAutoSave` フック、各セクションコンポーネント

### `components/editor/sections/BasicInfoSection.tsx`
- **役割:** 基本情報タブ（業務名・概要・担当者など）
- **フィールド:** `title`（必須）, `overview`, `fromPerson`, `toPerson`, `category`, `frequency`, `createdAt`

### `components/editor/sections/SystemInfoSection.tsx`
- **役割:** システム情報タブ（システム名・環境・接続情報など）
- **フィールド:** `systemName`, `environment`, `targetDevices`, `osVersion`, `tools`, `connectionInfo`, `documentUrl`（URL バリデーション）

### `components/editor/sections/ProceduresSection.tsx`
- **役割:** 作業手順タブ。手順カードの追加・削除・上下移動ボタン
- **重要:** 移動後に `order` を `index` で再採番（`.map((p, i) => ({ ...p, order: i }))`）
- **フィールド/手順:** `title`, `description`, `timing`, `preCheck`, `operation`, `verification`, `abortCondition`, `rollback`, `postCheck`, `caution`

### `components/editor/sections/IncidentsSection.tsx`
- **役割:** 障害対応タブ
- **フィールド:** `incident`, `checks`, `initialAction`, `recoveryCheck`, `escalation`, `escalationCondition`, `caution`

### `components/editor/sections/PrecautionsSection.tsx`
- **役割:** 注意・参考タブ（`Precautions` フィールド + `Reference[]` リスト）
- **フィールド/Precautions:** `notes`, `prohibitions`, `supplementaryNotes`
- **フィールド/Reference:** `name`, `url`（URL バリデーション）

### `components/preview/PreviewDocument.tsx`
- **役割:** Server Component。引き継ぎ書の全セクションを印刷向けレイアウトで表示
- **注意:** `Procedure` を `order` でソートしてから表示（`.slice().sort((a, b) => a.order - b.order)`）
- **内部ヘルパー:** `Field`（値が空なら null を返す）、`SubSection`（variant: `default/warn/danger/code`）

### `components/preview/PrintButton.tsx`
- **役割:** 印刷ボタン（`window.print()` を呼ぶ Client Component）。`print:hidden` で印刷時非表示

### `components/share/ShareManager.tsx`
- **役割:** 共有管理 UI（Client Component）。`none/active/revoked` の 3 状態で表示切替
- **注意:** POST 後に返ってくる平文トークンは state に保持。ページを離れると再表示不可（設計上の意図）

### `components/auth/LogoutButton.tsx`
- **役割:** ログアウトボタン（Client Component）。`supabase.auth.signOut()`

### `components/dashboard/NewDocumentButton.tsx`
- **役割:** 新規作成ボタン。`POST /api/documents` を呼び、返ってきた `id` で `/documents/:id/edit` へ遷移

### `components/dashboard/DeleteButton.tsx`
- **役割:** 文書削除ボタン（確認ダイアログあり）。`DELETE /api/documents/:id` を呼ぶ

---

## フック（`hooks/`）

### `hooks/useAutoSave.ts`
- **役割:** 自動保存ロジック（2秒 debounce + 楽観的排他制御 + localStorage バックアップ）
- **状態:** `SaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'failed' | 'conflict'`
- **重要な実装詳細:**
  - `pendingData.current` — 最後に onChange を受けたデータ（ref = 再レンダリングなし）
  - `currentVersion.current` — 現在の楽観的バージョン番号（PATCH 成功後に更新）
  - localStorage の削除条件: PATCH 200 AND `pendingData.current === toSave`（参照等値）
  - `resolveConflict('forceLocal')`: `currentVersion.current` をサーバーバージョンに上書きして即時 PATCH

---

## ライブラリ（`lib/`）

### `lib/supabase/client.ts`
- **役割:** Client Component 用 Supabase クライアント（`createBrowserClient`）
- **使用場所:** `LogoutButton`, `ShareManager` など `'use client'` コンポーネント

### `lib/supabase/server.ts`
- **役割:** Server Component / Route Handler 用（`createServerClient`）。Cookie を通じてセッションを管理
- **使用場所:** 全 Server Component・Route Handler

### `lib/supabase/admin.ts`
- **役割:** Service Role Key を使う Admin クライアント。RLS をバイパス
- **`import 'server-only'`:** Client に誤って import されるとビルドエラー
- **使用場所:** `app/view/[token]/page.tsx`（共有閲覧。anon では share_tokens が読めないため）

### `lib/token.ts`
- **役割:** 共有トークンのユーティリティ
  - `generateShareToken()`: `crypto.randomBytes(32)` で平文生成 + `hashToken()` でハッシュ化
  - `hashToken(token)`: `crypto.createHash('sha256').update(token).digest('hex')`
- **`import 'server-only'`:** Client への流出を防止

### `lib/types/handover.ts`
- **役割:** 引き継ぎ書の全型定義（`HandoverDocument`, `BasicInfo`, `SystemInfo`, `Procedure`, `IncidentResponse`, `Precautions`, `Reference`）
- **変更時の影響:** 型を追加・変更したら `lib/defaults.ts`（空値）・フォームコンポーネント・`PreviewDocument` の全てを更新

### `lib/utils.ts`
- **役割:** shadcn/ui の `cn()` ユーティリティ（Tailwind クラスの条件付き結合）

---

## DBマイグレーション（`supabase/migrations/`）

### `00001_initial_schema.sql`
- `documents` テーブル + RLS（owner_all）
- `share_tokens` テーブル + RLS（owner_all + viewer_read_active anon ポリシー）
- `token` UUID カラム（後の 00002 で削除）

### `00002_fix_schema.sql`
- `viewer_read_active` 削除（anon に share_tokens の読み取りを禁止）
- `token` UUID カラム削除
- `token_hash TEXT NOT NULL UNIQUE` 追加
- 閲覧は `createAdminClient()` 経由に変更（`app/view/[token]/page.tsx`）
