# 用語集

HikiTsugi v2 のコードを読む際に登場するキーワードの意味・使われ方を説明します。

---

## Next.js

### App Router
Next.js 13 以降の新しいルーティング方式。`app/` ディレクトリにファイルを置くだけでルートが生成される。  
HikiTsugi v2 では全ページが App Router を使用。

### Server Component
サーバーだけで実行される React コンポーネント。DB や Cookie にアクセスできる。ブラウザに JS が送られない。  
HikiTsugi v2 では `export default async function Page(...)` の形で定義。

### Client Component
ブラウザで実行される React コンポーネント。`'use client'` ディレクティブを先頭に書く。`useState`・`useEffect`・イベントハンドラはここで使える。  
例: `DocumentEditor.tsx`、`ShareManager.tsx`

### Route Handler
API エンドポイント。`app/api/.../route.ts` に `export async function GET/POST/PATCH/DELETE(request)` を定義する。  
例: `app/api/documents/[id]/route.ts` → PATCH（自動保存）・DELETE（削除）

### `export const instant = false`
Next.js 16 特有の設定。ページを「毎リクエスト SSR（Per-request rendering）」に強制する。  
`cookies()` や `searchParams` を使うページに必要。書かないと静的プリレンダリングされ Cookie が読めなくなる。  
（Next.js 13-15 での `export const dynamic = 'force-dynamic'` に相当）

### Partial Prerender (PPR)
Next.js 16 のデフォルト動作。静的部分と動的部分を混在させる機能。`instant = false` を書くとページ全体が動的になる。

### `proxy.ts`
Next.js 16 の Middleware ファイル。Next.js 13-15 では `middleware.ts` という名前だったが、16 で変更された。全リクエストをインターセプトして認証チェックを行う。

### Turbopack
Next.js の新しいバンドラー（Webpack の後継）。`npm run dev` 時は Turbopack を使用。

---

## React

### `startTransition`
React 19 の API。UI の更新を「優先度低い遷移」としてマークする。  
HikiTsugi v2 では `useEffect` 内での `setState` に使用（ESLint ルール `react-hooks/set-state-in-effect` への対応）。

### `useCallback`
関数をメモ化する React フック。deps が変わらない限り同じ関数参照を返す。  
HikiTsugi v2 では `updateBasicInfo` などの update 関数が stale closure を起こさないために使用。

### Stale Closure（古いクロージャ）
関数が作成された時点の変数をキャプチャしてしまい、その後に変数が変わっても古い値を参照し続けるバグ。  
対策: `setDoc(prev => ...)` のように setter 内で `prev` を使うパターン。

### `useRef`
値を保持するが、変更時に再レンダリングを起こさない React フック。  
HikiTsugi v2 では `pendingData.current`（最新の未保存データ）・`currentVersion.current`（版数）の管理に使用。

---

## Supabase

### Supabase
PostgreSQL を使ったオープンソースの BaaS（Backend as a Service）。認証・DB・ストレージを提供。

### RLS（Row Level Security）
PostgreSQL の機能。テーブルの行レベルで読み書きの権限を制御する。  
HikiTsugi v2 では「自分のドキュメントしか読み書きできない」というポリシーが設定されている。

### `createServerClient`
`@supabase/ssr` パッケージの関数。Server Component / Route Handler で使う。Cookie からセッションを読む。  
HikiTsugi v2 では `lib/supabase/server.ts` に `createClient()` として wrapping。

### `createBrowserClient`
`@supabase/ssr` パッケージの関数。Client Component で使う。  
HikiTsugi v2 では `lib/supabase/client.ts` に `createClient()` として wrapping。

### `createAdminClient`（Service Role Key）
RLS をバイパスして全行にアクセスできる特権クライアント。  
HikiTsugi v2 では `lib/supabase/admin.ts`。`server-only` で Client Component への流出を防止。  
使用箇所: `app/view/[token]/page.tsx`（共有閲覧ページ）のみ。

### Migration（マイグレーション）
DB スキーマの変更履歴ファイル。`supabase/migrations/*.sql` に順番に並ぶ。  
`supabase db push` または Supabase ダッシュボードで適用する。

### `auth.uid()`
RLS ポリシー内で使える関数。現在ログインしているユーザーの UUID を返す。  
`WHERE user_id = auth.uid()` のように使ってユーザー分離を実現。

### `PGRST116`
Supabase/PostgREST のエラーコード。`.single()` で 0 行が返ったときに発生。  
HikiTsugi v2 では PATCH で 0 行更新（楽観的排他制御の競合検知）に使用。

---

## 自動保存・競合制御

### Debounce（デバウンス）
連続する入力イベントを一定時間待って最後の一回だけ実行する手法。  
HikiTsugi v2 では 2000ms (2秒)。タイピング中は PATCH を送らず、2秒止まったら送る。

### 楽観的排他制御（Optimistic Locking）
「他の人が変更していないはず」と楽観的に仮定して処理を進め、競合したときだけ検知する手法。  
HikiTsugi v2 では `version` カラムを使用: PATCH 送信時に現在の version を送り、サーバー側で `WHERE version = ?` で確認。0行更新なら競合（409）。

### 409 Conflict
HTTP ステータスコード。リソースの現在の状態と矛盾する操作を試みたときに返す。  
HikiTsugi v2 では楽観的排他制御の競合時に使用。レスポンスに `{ serverVersion: number }` を含む。

### localStorage
ブラウザに小さなデータを永続保存できる仕組み（ページを閉じても残る）。  
HikiTsugi v2 では `draft-{documentId}` キーで未保存データをバックアップ。PATCH 成功後に削除。

### `pendingData.current === toSave`（参照等値チェック）
同じオブジェクト参照かを確認する。PATCH を送った後に追加入力がなければ `true` → localStorage を削除して良い。  
追加入力があれば別オブジェクトが作られるため `false` → まだ未保存データが残っている。

---

## セキュリティ

### SHA-256
暗号学的ハッシュ関数。入力が同じなら出力は常に同じだが、出力から入力を逆算できない。  
HikiTsugi v2 では共有トークンのハッシュ化に使用。DB には `token_hash` のみ保存。

### `server-only`
npm パッケージ。`import 'server-only'` を書くと、そのモジュールが Client Component に import されたときにビルドエラーを出す。  
HikiTsugi v2 では `lib/supabase/admin.ts`・`lib/token.ts` に記述（Service Role Key の漏洩防止）。

### CSRF（Cross-Site Request Forgery）
悪意あるサイトから別サービスへの不正リクエストを送る攻撃。  
Next.js App Router の Route Handler は SameSite Cookie でデフォルト保護されている。

### .env.local
環境変数を管理するファイル。`.gitignore` に含まれており、Git にはコミットされない。  
HikiTsugi v2 では Supabase URL・ANON キー・SERVICE_ROLE キーを格納。

---

## TypeScript

### `Omit<T, K>`
型 `T` からプロパティ `K` を除いた型を作る TypeScript ユーティリティ型。  
例: `DocumentData = Omit<HandoverDocument, 'id' | 'userId' | 'version' | 'createdAt' | 'updatedAt'>`

### `Promise<{ id: string }>`
Next.js 16 の App Router では、`params` と `searchParams` が `Promise` でラップされている。`await params` が必要。

### `strict: true`
TypeScript の厳格モード。`null` や `undefined` の可能性を型で追跡させる。HikiTsugi v2 では有効。

---

## Git・開発フロー

### feature ブランチ
機能ごとに独立したブランチを作って開発する手法。  
HikiTsugi v2 では `feature/auth`、`feature/dashboard` など各フェーズに対応。

### `main` ブランチ
本番用のブランチ。HikiTsugi v2 では現在コミットがなく、feature ブランチで開発中。

### shadcn/ui
Radix UI / @base-ui/react をベースにした UI コンポーネント集。コードをプロジェクトにコピーして使う。  
HikiTsugi v2 では `Button` コンポーネントなどを使用。`buttonVariants()` で Tailwind クラスを取得できる。

### CVA（Class Variance Authority）
Tailwind CSS のバリアント（`variant="outline"` など）を管理するライブラリ。shadcn/ui が使用。
