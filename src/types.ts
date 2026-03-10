export type PlayMode = "single" | "multiple" | "dantuo" | "smart"

export interface SelectionState {
  mode: PlayMode
  front: number[]
  back: number[]
  frontDan: number[]
  frontTuo: number[]
  backDan: number[]
  backTuo: number[]
  lockedFront: number[]
  lockedBack: number[]
  additional: boolean
  multiplier: number
  quickPickCount: number
}

export interface ValidationResult {
  valid: boolean
  message: string
}

export interface CostBreakdown {
  betCount: number
  unitPrice: number
  multiplier: number
  amount: number
  additional: boolean
}

export interface GeneratedTicket {
  id: string
  sourceMode: PlayMode
  label: string
  frontNumbers: number[]
  backNumbers: number[]
  frontDan?: number[]
  frontTuo?: number[]
  backDan?: number[]
  backTuo?: number[]
  additional: boolean
  multiplier: number
  betCount: number
  amount: number
  note?: string
  createdAt: string
}

export interface HistoryEntry {
  id: string
  savedAt: string
  ticket: GeneratedTicket
}

export interface LottoHistoryRow {
  issue: string
  openDate: string
  week?: string
  frontNumbers: number[]
  backNumbers: number[]
  sales?: string
  prizePool?: string
  firstPrizeWinners?: string
  notes?: string
  extra: Record<string, string>
}

export interface HistoryDataset {
  syncedAt: string | null
  sourceUrl: string
  rows: LottoHistoryRow[]
  syncError?: string
}

export interface RecommendedTicket {
  frontNumbers: number[]
  backNumbers: number[]
  reason: string
}

export interface RecommendationDataset {
  generatedAt: string | null
  issueTarget: string
  sampleSize: number
  frontPool: number[]
  backPool: number[]
  suggestedTickets: RecommendedTicket[]
  methodSummary: string[]
  disclaimer: string
  analysisUnavailable?: string
}
