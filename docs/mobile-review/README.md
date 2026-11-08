# HikiTsugi v2 — モバイルレビュー資料

> スマートフォン（GitHub モバイルアプリ / ブラウザ）から開発内容を確認するための解説資料集です。

---

## このリポジトリについて

**HikiTsugi v2** は、業務引き継ぎ書を Web 上で作成・共有できるアプリです。

- ログインしたユーザーが引き継ぎ書（ドキュメント）を複数作成・編集できる
- 自動保存（2秒 debounce）で書き途中の内容をサーバーに保存する
- 共有 URL を発行すると、ログイン不要で第三者が閲覧・印刷できる

---

## 実装済み機能

| フェーズ | ブランチ | 内容 |
|---|---|---|
| Phase 1 | `feature/setup` | Next.js 16.4.5 + Supabase + shadcn/ui 環境構築 |
| Phase 2 | `feature/db-fix` | DBスキーマ修正・サーバー専用ユーティリティ（admin.ts, token.ts） |
| Phase 3 | `feature/auth` | ログイン・登録・保護ルート（proxy.ts） |
| Phase 4 | `feature/dashboard` | ダッシュボード（文書一覧・新規作成・削除） |
| Phase 5 | `feature/document-editor` | 引き継ぎ書エディタ（5セクション・自動保存・競合検知） |
| Phase 6 | `feature/preview-print` | プレビュー画面・印刷 CSS |
| Phase 7 | `feature/sharing` | 共有 URL 発行・閲覧ページ・失効ページ |

**現在のブランチ: `feature/sharing`（MVP 完成）**

---

## 技術スタック

| 分類 | 技術 |
|---|---|
| フレームワーク | Next.js 16.4.5 (App Router + Partial Prerender) |
| UI ライブラリ | React 19.3.0 |
| スタイリング | Tailwind CSS v4 |
| コンポーネント | shadcn/ui (@base-ui/react Button) |
| 認証 / DB | Supabase (PostgreSQL + RLS) |
| ORM 相当 | @supabase/ssr (createBrowserClient / createServerClient) |
| 言語 | TypeScript (strict) |
| Node.js | v26.3.0 |

---

## 資料の読み方（推奨順）

```
1. README.md（本ファイル）       全体像とスタック
2. architecture.md              データフロー・コンポーネント構造図
3. file-guide.md                各ファイルの役割一覧
4. feature-flows.md             ユーザー操作別の処理フロー
5. glossary.md                  用語集（初めて見るキーワードを調べる）
```

---

## ローカル開発コマンド

```bash
# 開発サーバー起動（ポート 3001）
npm run dev

# 型チェック
npx tsc --noEmit

# Lint
npx eslint .

# プロダクションビルド
npm run build
```

`.env.local` に Supabase の接続情報が必要（Git には含まれていません）。

---

## セキュリティ方針

- `.env.local` は `.gitignore` 対象（GitHub に上がらない）
- `SUPABASE_SERVICE_ROLE_KEY` は `lib/supabase/admin.ts` のみで使用し、`server-only` パッケージで Client 側への流出を防止
- 共有トークンは SHA-256 ハッシュのみ DB に保存（平文は発行時の一度だけ返却）
- RLS（Row Level Security）により、他人のドキュメントは読み書きできない

---

## 関連資料（プロジェクト内）

- `docs/requirements.md` — 機能要件 (FR) 一覧
- `docs/02_information-architecture.md` — 画面遷移図
- `CLAUDE.md` — Claude Code への開発ガイドライン
- `supabase/migrations/` — DB マイグレーション SQL
