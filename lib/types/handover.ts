export interface BasicInfo {
  title: string
  overview: string
  fromPerson: string
  toPerson: string
  category: string
  frequency: string
  createdAt: string
}

export interface SystemInfo {
  systemName: string
  environment: string
  targetDevices: string
  osVersion: string
  tools: string
  connectionInfo: string
  documentUrl: string
}

export interface Procedure {
  id: string
  title: string
  description: string
  timing: string
  preCheck: string
  operation: string
  verification: string
  abortCondition: string
  rollback: string
  postCheck: string
  caution: string
  order: number
}

export interface IncidentResponse {
  id: string
  incident: string
  checks: string
  initialAction: string
  recoveryCheck: string
  escalation: string
  escalationCondition: string
  caution: string
}

export interface Precautions {
  notes: string
  prohibitions: string
  supplementaryNotes: string
}

export interface Reference {
  id: string
  name: string
  url: string
}

export interface HandoverDocument {
  id: string
  userId: string
  title: string
  basicInfo: BasicInfo
  systemInfo: SystemInfo
  procedures: Procedure[]
  incidents: IncidentResponse[]
  precautions: Precautions
  references: Reference[]
  version: number
  createdAt: string
  updatedAt: string
}
