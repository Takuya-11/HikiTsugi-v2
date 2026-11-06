# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクトの目的とコンセプト

**HikiTsugi v2** — 引き継ぐ人は簡単に。引き継がれる人には分かりやすく。

IT運用業務の担当者交代時に発生する「書き方がわからない・フォーマットがバラバラ・機密情報を外部ツールに送りたくない」という課題を解決するWebアプリ。ログイン認証・サーバーサイドデータ保存・安全な共有URL機能を持つ。

## 設計成果物（最優先仕様）

`docs/` ディレクトリの以下のドキュメントが仕様の基準。実装前に必ず参照する。

| ファイル | 内容 |
|---|---|
| `docs/02_information-architecture.md` | T-05: 画面構成・ユーザー定義・ナビゲーション設計 |
| `docs/requirements.md` | T-06: 機能要件・データモデル・MVP定義 |

コードとドキュメントに矛盾がある場合、ドキュメントを優先し、変更の前に確認する。

## 技術スタック（確定済み）

- フロントエンド: **Next.js 16.4.5** App Router + TypeScript strict
- スタイリング: **Tailwind CSS v4** + **shadcn/ui**
- 認証 + DB: **Supabase Auth + PostgreSQL + RLS**
- ホスティング: **Vercel**
- ローカルバックアップ: localStorage

## コマンド

`.bin/next` は Node.js v26 環境で動作しないため、全スクリプトが `node node_modules/next/dist/bin/next` を直接呼び出している。

```bash
# 開発サーバー（ポート 3002）
npm run dev
# = node node_modules/next/dist/bin/next dev --port 3002 --turbopack

# プロダクションビルド
npm run build

# 型チェック
npm run typecheck

# Lint
npm run lint
```

## Next.js 16 の重要な変更点（v1との差異）

AGENTS.md 参照: 「This is NOT the Next.js you know」

### proxy.ts（旧 middleware.ts）
Next.js 16 では `middleware.ts` が deprecated になり、**`proxy.ts`** に変更された。

```ts
// proxy.ts — 関数名も `middleware` → `proxy`
export async function proxy(request: NextRequest) { ... }
export const config = { matcher: [...] }
```

移行コマンド（既存 middleware.ts がある場合）:
```bash
npx @next/codemod@canary middleware-to-proxy . --force
```

### Supabase クライアントパターン

```ts
// Client Component: lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
export function createClient() { return createBrowserClient(...) }

// Server Component / Route Handler: lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(url, anonKey, { cookies: { getAll, setAll } })
}
```

## 開発ルール

### 実装サイクル
1機能ずつ実装→テスト→確認のサイクルを守る。複数機能を並行して実装しない。

### ブランチ戦略
Feature Branchワークフロー: **1機能 = 1ブランチ**。
```
main
└── feature/<機能名>  # 例: feature/auth, feature/document-editor
```

コミット前に `git diff` と `npm run lint` / `npm run typecheck` を確認してからコミットする。

### セキュリティ（最優先）
- 秘密情報（APIキー・シークレット・接続文字列）をソースコードやGitに含めない
- 環境変数は `.env.local` で管理（`.gitignore` 対象）
- **Supabase採用時はRLSを設定してから動作確認する**（RLS無効のままテスト終了しない）
- 作成者と閲覧者の権限は厳密に分離する

### 既存プロジェクトとの分離
- **`/Users/itotaku/dev/AI_test/HikiTsugi/` には一切変更を加えない**
- 既存のコードを参考にする場合は設計を確認してから使う（そのままコピーしない）

## ユーザビリティ方針
- 初心者でも迷わず使える操作フロー
- エラーメッセージは原因と対処法を具体的に記述（「エラーが発生しました」ではなく何が起きたかを示す）
- バリデーションエラーは該当箇所にインラインで表示し、自動スクロールでフォーカスする

## 環境変数

`.env.local` に設定（`.env.local.example` を参照）:
```
NEXT_PUBLIC_SUPABASE_URL=        # Supabase Project Settings > API
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Supabase Project Settings > API
SUPABASE_SERVICE_ROLE_KEY=       # サーバーサイドのみ
```

## DBスキーマ

`supabase/migrations/00001_initial_schema.sql` に定義済み。  
Supabase プロジェクト作成後: `supabase link --project-ref <ref>` → `supabase db push`

## 次のPhase（feature/auth）

1. ユーザーが Supabase Dashboard で新規プロジェクト作成
2. `.env.local` に URL・Anon Key・Service Role Key を設定
3. `supabase link --project-ref <ref>` → `supabase db push` でマイグレーション適用
4. `feature/auth` ブランチで認証フロー実装開始
