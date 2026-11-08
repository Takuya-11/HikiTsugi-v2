# 機能フロー詳細

各ユーザー操作がどのファイルを経由して処理されるかを追います。

---

## フロー 1: ログイン

```
ユーザー操作: /login でメールアドレス・パスワードを入力して送信

1. app/(auth)/login/page.tsx
   └── <form action={...}> の Server Action
       └── supabase.auth.signInWithPassword({ email, password })
           └── 成功 → Cookie にセッション保存 → /dashboard へリダイレクト
           └── 失敗 → エラーメッセージ表示
```

**関連ファイル:** `app/(auth)/login/page.tsx`, `lib/supabase/server.ts`

---

## フロー 2: ダッシュボード表示

```
ユーザー操作: /dashboard へアクセス

1. proxy.ts
   └── Supabase Auth getUser() → ログイン済みを確認

2. app/(protected)/dashboard/page.tsx（Server Component）
   └── export const instant = false → 毎回 SSR
   └── createClient() → supabase.from('documents').select(...)
       └── RLS: user_id = auth.uid() の行のみ返る
   └── 文書リストを HTML にレンダリング
```

**関連ファイル:** `proxy.ts`, `app/(protected)/dashboard/page.tsx`, `lib/supabase/server.ts`

---

## フロー 3: 新規文書作成

```
ユーザー操作: ダッシュボードの「新規作成」ボタンをクリック

1. components/dashboard/NewDocumentButton.tsx（Client Component）
   └── fetch POST /api/documents

2. app/api/documents/route.ts
   └── supabase.auth.getUser() → 認証確認
   └── INSERT INTO documents { user_id, title: '無題の引き継ぎ書', data: {空}, version: 1 }
   └── 200 { id: "uuid" }

3. NewDocumentButton
   └── router.push(`/documents/${id}/edit`)
```

**関連ファイル:** `components/dashboard/NewDocumentButton.tsx`, `app/api/documents/route.ts`

---

## フロー 4: 文書編集

```
ユーザー操作: 文書タイトルをクリックして編集画面へ

1. app/(protected)/documents/[id]/edit/page.tsx（Server Component）
   └── export const instant = false
   └── supabase.from('documents').select('id, title, data, version').eq('id', id).single()
       └── RLS: 自分の文書のみ取得可能（他人のは null → /dashboard へリダイレクト）
   └── <DocumentEditor initialDoc={doc} /> をレンダリング

2. components/editor/DocumentEditor.tsx（Client Component）
   └── useEffect: localStorage.getItem('draft-{id}') をチェック
       └── 存在すれば startTransition(() => setDoc(parsed)) で復元
       └── 「ローカルバックアップから復元しました」バナー表示
   └── 5タブ（基本情報/システム情報/作業手順/障害対応/注意・参考）をレンダリング
```

**関連ファイル:** `app/(protected)/documents/[id]/edit/page.tsx`, `components/editor/DocumentEditor.tsx`

---

## フロー 5: 自動保存（正常系）

```
ユーザー操作: フォームフィールドに入力

1. セクションコンポーネント（例: BasicInfoSection）
   └── onChange(newBasicInfo) → DocumentEditor の updateBasicInfo()

2. DocumentEditor.updateBasicInfo()
   └── setDoc(prev => { ...prev, basicInfo }) — React state 更新
   └── triggerSaveWithTitle(updated, nextTitle) — useAutoSave に通知

3. hooks/useAutoSave.ts
   └── localStorage.setItem('draft-{id}', JSON.stringify(data)) — 即時書き込み
   └── pendingData.current = data
   └── setSaveStatus('pending')
   └── debounce タイマーを 2000ms でリセット

4. 2秒後: debounce タイマー発火
   └── setSaveStatus('saving')
   └── fetch PATCH /api/documents/:id { title, data, version: currentVersion.current }

5. app/api/documents/[id]/route.ts
   └── supabase.auth.getUser() → 認証確認
   └── UPDATE documents SET title=?, data=?, version=version+1
       WHERE id=? AND version=?  ← 楽観的排他制御
   └── 200 { version: 新バージョン番号 }

6. useAutoSave
   └── currentVersion.current = 新バージョン番号（先に更新）
   └── pendingData.current === toSave かチェック
       └── 一致 → localStorage.removeItem('draft-{id}')、setSaveStatus('saved')
       └── 不一致 → setSaveStatus('pending')（追加入力があった）
```

**関連ファイル:** `hooks/useAutoSave.ts`, `app/api/documents/[id]/route.ts`

---

## フロー 6: ローカルバックアップ（ネットワーク断時）

```
ユーザー操作: オフライン状態で編集

フロー 5 の手順 1〜3（localStorage への即時書き込み）は完了する。
手順 4 の PATCH は失敗 → catch エラー → setSaveStatus('failed')
UI: 「保存失敗 — ローカルに保存済」（赤文字）

ユーザーがページをリロードすると:
1. DocumentEditor の useEffect で localStorage を確認
2. 保存失敗分のデータがあれば復元 → バナー表示
3. オンラインに戻ったら次の入力で自動保存が再試行される
```

**関連ファイル:** `hooks/useAutoSave.ts`, `components/editor/DocumentEditor.tsx`

---

## フロー 7: 競合検知（別デバイスで同時編集）

```
シナリオ: デバイスAとデバイスBで同じ文書を開いている

1. デバイスAが保存 → サーバー version が 1 → 2 になる

2. デバイスBが入力して自動保存タイマーが発火
   └── PATCH { version: 1 }（古いバージョン）を送信

3. app/api/documents/[id]/route.ts
   └── UPDATE WHERE version = 1 → 0行更新（サーバーは既に 2）
   └── PGRST116 エラーコード
   └── 現在の version を SELECT
   └── 409 { error: 'Conflict', serverVersion: 2 }

4. hooks/useAutoSave.ts
   └── setConflictInfo({ serverVersion: 2 })
   └── setSaveStatus('conflict')

5. DocumentEditor
   └── conflictInfo が null でない → 競合ダイアログ overlay を表示
```

**関連ファイル:** `hooks/useAutoSave.ts`, `app/api/documents/[id]/route.ts`, `components/editor/DocumentEditor.tsx`

---

## フロー 8: 競合解消

**サーバーの内容を採用する場合:**
```
1. ユーザー: 「サーバーの内容を読み込む」ボタンをクリック
2. DocumentEditor → resolveConflict('useServer')
3. useAutoSave.resolveConflict
   └── localStorage.removeItem('draft-{id}')（ローカルデータを破棄）
   └── router.refresh()（Server Component を再フェッチ）
4. EditPage が最新データを DB から取得して DocumentEditor を再マウント
```

**ローカルの内容を強制保存する場合:**
```
1. ユーザー: 「自分の変更を上書きする」ボタンをクリック
2. DocumentEditor → resolveConflict('forceLocal')
3. useAutoSave.resolveConflict
   └── currentVersion.current = serverVersion（サーバーバージョンに同期）
   └── setConflictInfo(null)（ダイアログを閉じる）
   └── executeSave(pendingData.current)（debounce なし即時 PATCH）
4. PATCH が成功 → フロー 5 の手順 6 へ
```

**関連ファイル:** `hooks/useAutoSave.ts`, `components/editor/DocumentEditor.tsx`

---

## フロー 9: プレビュー・印刷

```
ユーザー操作: エディタの「プレビュー」ボタンをクリック

1. DocumentEditor.validate() — バリデーション
   └── 失敗 → エラーフィールドにフォーカス・スクロール
   └── 成功 → router.push('/documents/:id/preview')

2. app/(protected)/documents/[id]/preview/page.tsx（Server Component）
   └── export const instant = false
   └── DB から最新データ取得
   └── <PreviewDocument title={...} data={...} />
   └── <PrintButton />（print:hidden なのでプレビュー時のみ表示）

3. ユーザー: 「印刷」ボタンをクリック
   └── PrintButton: window.print()
   └── @media print CSS が適用（A4・print:hidden 要素が非表示）
```

**関連ファイル:** `components/editor/DocumentEditor.tsx`, `app/(protected)/documents/[id]/preview/page.tsx`, `components/preview/PreviewDocument.tsx`, `components/preview/PrintButton.tsx`, `app/globals.css`

---

## フロー 10: 共有 URL 発行

```
ユーザー操作: 共有管理ページで「共有URLを発行」をクリック

1. components/share/ShareManager.tsx（Client Component）
   └── fetch POST /api/documents/:id/share

2. app/api/documents/[id]/share/route.ts（POST）
   └── supabase.auth.getUser() → 認証確認
   └── lib/token.ts generateShareToken()
       └── plainToken = crypto.randomBytes(32).toString('hex')（64文字）
       └── tokenHash = SHA-256(plainToken)
   └── INSERT share_tokens { document_id, token_hash, status: 'active' }
   └── 200 { token: plainToken }（平文は一度だけ返す）

3. ShareManager
   └── setToken(plainToken)
   └── setStatus('active')
   └── URL = `${origin}/view/${plainToken}` を表示
   └── コピーボタン: navigator.clipboard.writeText(url)
```

**セキュリティ注意:** DB には `token_hash` のみ保存。平文はこのレスポンスの後は永久に復元不可。

**関連ファイル:** `components/share/ShareManager.tsx`, `app/api/documents/[id]/share/route.ts`, `lib/token.ts`

---

## フロー 11: 共有 URL での閲覧（匿名アクセス）

```
操作: 受け取った共有 URL /view/{plainToken} へアクセス

1. proxy.ts
   └── /view/* は保護ルートではないため通過（認証チェックなし）

2. app/view/[token]/page.tsx（Server Component）
   └── export const instant = false
   └── tokenHash = hashToken(params.token)（SHA-256）
   └── createAdminClient()（Service Role Key で RLS バイパス）
   └── share_tokens WHERE token_hash = tokenHash
       └── 見つからない → redirect('/error?reason=invalid')
       └── status !== 'active' → redirect('/error?reason=revoked')
   └── documents WHERE id = tokenRow.document_id
   └── <PreviewDocument /> + <PrintButton />（閲覧・印刷可能）
```

**関連ファイル:** `app/view/[token]/page.tsx`, `lib/supabase/admin.ts`, `lib/token.ts`

---

## フロー 12: 共有の失効（Revoke）

```
ユーザー操作: 共有管理ページで「共有を停止」をクリック

1. ShareManager → fetch DELETE /api/documents/:id/share

2. app/api/documents/[id]/share/route.ts（DELETE）
   └── supabase.auth.getUser() → 認証確認
   └── UPDATE share_tokens
       SET status = 'revoked', revoked_at = now()
       WHERE document_id = id AND status = 'active'
   └── 204

3. ShareManager
   └── setStatus('revoked')
   └── setToken(null)（URL を表示から削除）

失効後に旧 URL にアクセスすると:
   フロー 11 の手順 2 で status = 'revoked'
   → redirect('/error?reason=revoked')
   → app/error/page.tsx に「共有が停止されました」メッセージ
```

**関連ファイル:** `components/share/ShareManager.tsx`, `app/api/documents/[id]/share/route.ts`, `app/error/page.tsx`
