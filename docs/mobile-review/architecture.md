# アーキテクチャ図

## 1. 全体データフロー

```mermaid
graph TD
    Browser["ブラウザ（React）"]
    ServerComp["Server Component<br/>（Next.js）"]
    RouteHandler["Route Handler<br/>（API）"]
    SupabaseAuth["Supabase Auth"]
    SupabaseDB["Supabase DB<br/>（PostgreSQL + RLS）"]
    LocalStorage["localStorage<br/>（バックアップ）"]

    Browser -- "フォーム入力 onChange" --> LocalStorage
    Browser -- "PATCH /api/documents/:id" --> RouteHandler
    Browser -- "POST/DELETE /api/documents/:id/share" --> RouteHandler
    ServerComp -- "createServerClient()" --> SupabaseAuth
    ServerComp -- "createServerClient()" --> SupabaseDB
    RouteHandler -- "createClient()" --> SupabaseAuth
    RouteHandler -- "createClient()" --> SupabaseDB
```

---

## 2. ページルーティング

```mermaid
graph LR
    Root["/（トップ）"]
    Login["/login"]
    Register["/register"]
    Dashboard["/dashboard"]
    Edit["/documents/:id/edit"]
    Preview["/documents/:id/preview"]
    Share["/documents/:id/share"]
    View["/view/:token"]
    Error["/error?reason=..."]

    Root -- "未ログイン" --> Login
    Root -- "ログイン済み" --> Dashboard
    Login --> Dashboard
    Register --> Dashboard
    Dashboard --> Edit
    Edit --> Preview
    Edit --> Share
    Share -- "共有URL発行" --> View
    View -- "トークン無効" --> Error
    View -- "トークン失効" --> Error
```

---

## 3. 認証フロー（proxy.ts）

```mermaid
sequenceDiagram
    participant ブラウザ
    participant proxy.ts
    participant Supabase Auth

    ブラウザ->>proxy.ts: GET /dashboard（Cookieあり）
    proxy.ts->>Supabase Auth: getUser()
    alt ログイン済み
        Supabase Auth-->>proxy.ts: user あり
        proxy.ts-->>ブラウザ: 通過（コンテンツを返す）
    else 未ログイン
        Supabase Auth-->>proxy.ts: null
        proxy.ts-->>ブラウザ: 307 Redirect /login
    end
```

**ファイル:** `proxy.ts`（Next.js 16 では `middleware.ts` ではなく `proxy.ts`）

---

## 4. 自動保存ステートマシン

```mermaid
stateDiagram-v2
    [*] --> idle

    idle --> pending : onChange()
    pending --> pending : onChange()
    pending --> saving : 2秒経過（debounce）

    saving --> saved : PATCH 200\npendingData === toSave
    saving --> pending : PATCH 200\npendingData ≠ toSave
    saving --> failed : ネットワークエラー / 5xx
    saving --> conflict : PATCH 409

    saved --> pending : onChange()
    failed --> pending : onChange()

    conflict --> saving : resolveConflict('forceLocal')
    conflict --> idle : resolveConflict('useServer')\n→ router.refresh()
```

**ファイル:** `hooks/useAutoSave.ts`

---

## 5. 共有トークンのセキュリティフロー

```mermaid
sequenceDiagram
    participant オーナー
    participant API
    participant DB
    participant 閲覧者

    オーナー->>API: POST /api/documents/:id/share
    API->>API: crypto.randomBytes(32) = 平文トークン
    API->>API: SHA-256(平文) = token_hash
    API->>DB: INSERT share_tokens { token_hash, status:'active' }
    API-->>オーナー: { token: 平文 }（一度だけ）
    Note over API,DB: DB には token_hash のみ保存

    オーナー->>閲覧者: URL /view/{平文} を共有

    閲覧者->>API: GET /view/{平文}
    API->>API: SHA-256(平文) = token_hash
    API->>DB: SELECT WHERE token_hash = ? （Admin クライアント）
    DB-->>API: { document_id, status }
    API->>DB: SELECT documents WHERE id = document_id
    DB-->>API: document
    API-->>閲覧者: プレビューページ
```

**ファイル:** `app/view/[token]/page.tsx`, `lib/token.ts`, `lib/supabase/admin.ts`

---

## 6. コンポーネントツリー（エディタ画面）

```
EditPage（Server Component）
└── DocumentEditor（Client Component）  ← 状態管理ハブ
    ├── [タブUI]
    ├── BasicInfoSection
    ├── SystemInfoSection
    ├── ProceduresSection
    │   └── [上下移動ボタン]
    ├── IncidentsSection
    ├── PrecautionsSection（Precautions + Reference[]）
    ├── [保存ステータス表示]
    └── [競合ダイアログ overlay]
```

**hooks:** `useAutoSave` が DocumentEditor 内で呼ばれる。各セクションは `onChange` コールバックで変更を上位へ伝える。

---

## 7. DB テーブル構造

```
documents
  id          UUID  PK
  user_id     UUID  FK → auth.users
  title       TEXT
  data        JSONB   （引き継ぎ書の全フィールド）
  version     INT     （楽観的排他制御）
  created_at  TIMESTAMPTZ
  updated_at  TIMESTAMPTZ  （自動更新トリガー）

share_tokens
  id           UUID  PK
  document_id  UUID  FK → documents.id
  token_hash   TEXT  UNIQUE  （SHA-256ハッシュ）
  status       TEXT  CHECK IN ('active','revoked')
  created_at   TIMESTAMPTZ
  revoked_at   TIMESTAMPTZ  NULLABLE
```

**RLS ポリシー:**
- `documents`: owner_all — `user_id = auth.uid()` の行のみ操作可能
- `share_tokens`: owner_all — `document_id` の owner のみ操作可能（anon は操作不可）
- 閲覧ページは `createAdminClient()`（Service Role Key）で RLS をバイパス

**マイグレーション:** `supabase/migrations/00001_initial_schema.sql`, `00002_fix_schema.sql`
