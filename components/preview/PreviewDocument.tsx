import type {
  HandoverDocument,
  IncidentResponse,
  Precautions,
  Procedure,
  Reference,
  SystemInfo,
} from '@/lib/types/handover'

type DocumentData = Omit<HandoverDocument, 'id' | 'userId' | 'version' | 'createdAt' | 'updatedAt'>

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8 break-inside-avoid-page">
      <h2 className="mb-3 border-b-2 border-foreground pb-1 text-base font-bold text-foreground">
        {title}
      </h2>
      {children}
    </section>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  if (!value) return null
  return (
    <div className="mb-2 grid grid-cols-[8rem_1fr] gap-2 text-sm">
      <dt className="font-medium text-muted-foreground">{label}</dt>
      <dd className="whitespace-pre-wrap text-foreground">{value}</dd>
    </div>
  )
}

function ProcedureItem({ procedure, index }: { procedure: Procedure; index: number }) {
  return (
    <div className="mb-4 break-inside-avoid rounded border border-border p-3">
      <h3 className="mb-2 text-sm font-semibold text-foreground">
        手順 {index + 1}: {procedure.title}
      </h3>
      <dl>
        <Field label="実施タイミング" value={procedure.timing} />
        <Field label="作業内容" value={procedure.description} />
        <Field label="事前確認事項" value={procedure.preCheck} />
        <Field label="操作コマンド" value={procedure.operation} />
        <Field label="確認方法" value={procedure.verification} />
        <Field label="中止条件" value={procedure.abortCondition} />
        <Field label="ロールバック手順" value={procedure.rollback} />
        <Field label="事後確認" value={procedure.postCheck} />
        <Field label="注意点" value={procedure.caution} />
      </dl>
    </div>
  )
}

function IncidentItem({ incident, index }: { incident: IncidentResponse; index: number }) {
  return (
    <div className="mb-4 break-inside-avoid rounded border border-border p-3">
      <h3 className="mb-2 text-sm font-semibold text-foreground">
        障害対応 {index + 1}: {incident.incident}
      </h3>
      <dl>
        <Field label="発生時の確認事項" value={incident.checks} />
        <Field label="一次対応" value={incident.initialAction} />
        <Field label="復旧確認方法" value={incident.recoveryCheck} />
        <Field label="エスカレーション先" value={incident.escalation} />
        <Field label="エスカレーション条件" value={incident.escalationCondition} />
        <Field label="注意点" value={incident.caution} />
      </dl>
    </div>
  )
}

function SystemInfoSection({ data }: { data: SystemInfo }) {
  return (
    <dl>
      <Field label="システム名" value={data.systemName} />
      <Field label="環境区分" value={data.environment} />
      <Field label="対象機器" value={data.targetDevices} />
      <Field label="OS バージョン" value={data.osVersion} />
      <Field label="使用ツール" value={data.tools} />
      <Field label="接続情報" value={data.connectionInfo} />
      <Field label="参考 URL" value={data.documentUrl} />
    </dl>
  )
}

function PrecautionsSection({ data }: { data: Precautions }) {
  return (
    <dl>
      <Field label="注意事項" value={data.notes} />
      <Field label="禁止事項" value={data.prohibitions} />
      <Field label="補足事項" value={data.supplementaryNotes} />
    </dl>
  )
}

function ReferencesSection({ data }: { data: Reference[] }) {
  if (data.length === 0) return null
  return (
    <div className="mt-4">
      <h3 className="mb-2 text-sm font-semibold text-foreground">参考資料</h3>
      <ul className="space-y-1 text-sm">
        {data.map((ref) => (
          <li key={ref.id}>
            {ref.url ? (
              <a
                href={ref.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                {ref.name || ref.url}
              </a>
            ) : (
              <span className="text-foreground">{ref.name}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function PreviewDocument({
  title,
  data,
}: {
  title: string
  data: DocumentData
}) {
  const { basicInfo, systemInfo, procedures, incidents, precautions, references } = data

  return (
    <article className="mx-auto max-w-[210mm] bg-background px-8 py-10 text-foreground print:p-0">
      <header className="mb-8">
        <h1 className="mb-1 text-2xl font-bold text-foreground">{title || '無題の引き継ぎ書'}</h1>
        {basicInfo.overview && (
          <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{basicInfo.overview}</p>
        )}
      </header>

      <Section title="1. 基本情報">
        <dl>
          <Field label="業務名" value={basicInfo.title} />
          <Field label="引き継ぎ元担当者" value={basicInfo.fromPerson} />
          <Field label="引き継ぎ先担当者" value={basicInfo.toPerson} />
          <Field label="業務カテゴリ" value={basicInfo.category} />
          <Field label="実施頻度" value={basicInfo.frequency} />
          <Field label="作成日" value={basicInfo.createdAt} />
        </dl>
      </Section>

      {Object.values(systemInfo).some(Boolean) && (
        <Section title="2. システム・環境情報">
          <SystemInfoSection data={systemInfo} />
        </Section>
      )}

      {procedures.length > 0 && (
        <Section title="3. 作業手順">
          {procedures
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((p, i) => (
              <ProcedureItem key={p.id} procedure={p} index={i} />
            ))}
        </Section>
      )}

      {incidents.length > 0 && (
        <Section title="4. 障害対応">
          {incidents.map((inc, i) => (
            <IncidentItem key={inc.id} incident={inc} index={i} />
          ))}
        </Section>
      )}

      {(precautions.notes || precautions.prohibitions || precautions.supplementaryNotes || references.length > 0) && (
        <Section title="5. 注意事項・参考資料">
          <PrecautionsSection data={precautions} />
          <ReferencesSection data={references} />
        </Section>
      )}
    </article>
  )
}
