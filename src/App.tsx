import { useDeferredValue, useEffect, useMemo, useState } from "react"
import { History, RefreshCw } from "lucide-react"

import { HistoryTable } from "@/components/history-table"
import { RecommendationPanel } from "@/components/recommendation-panel"
import { RuleAccordion } from "@/components/rule-accordion"
import { SelectionPanel } from "@/components/selection-panel"
import { TicketCard } from "@/components/ticket-card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { DEFAULT_SELECTION, createTicketFromSelection, generateRandomTicket, toggleNumber, validateSelection } from "@/lib/dlt"
import { getHistorySummary, searchHistory } from "@/lib/history"
import { getRecommendationSummary } from "@/lib/recommendation"
import type { GeneratedTicket, HistoryDataset, HistoryEntry, RecommendationDataset, SelectionState } from "@/types"

const STORAGE_KEY = "dlt-picked-history"
const DATA_BASE = import.meta.env.BASE_URL
const DATA_PREFIX = DATA_BASE.endsWith("/") ? DATA_BASE : `${DATA_BASE}/`

const FALLBACK_HISTORY: HistoryDataset = {
  syncedAt: null,
  sourceUrl: "https://www.js-lottery.com/lottery/downLottoData",
  rows: [],
  syncError: "尚未加载历史开奖数据。",
}

const FALLBACK_RECOMMENDATION: RecommendationDataset = {
  generatedAt: null,
  issueTarget: "待同步",
  sampleSize: 0,
  frontPool: [],
  backPool: [],
  suggestedTickets: [],
  methodSummary: ["尚未加载推荐数据。"],
  disclaimer: "仅基于历史统计，仅供娱乐，不构成购彩建议。",
  analysisUnavailable: "尚未加载推荐数据。",
}

function App() {
  const [selection, setSelection] = useState<SelectionState>(DEFAULT_SELECTION)
  const [tickets, setTickets] = useState<GeneratedTicket[]>([])
  const [historyDataset, setHistoryDataset] = useState<HistoryDataset>(FALLBACK_HISTORY)
  const [recommendationDataset, setRecommendationDataset] = useState<RecommendationDataset>(FALLBACK_RECOMMENDATION)
  const [savedHistory, setSavedHistory] = useState<HistoryEntry[]>(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    try {
      return JSON.parse(raw) as HistoryEntry[]
    } catch {
      window.localStorage.removeItem(STORAGE_KEY)
      return []
    }
  })
  const [search, setSearch] = useState("")
  const deferredSearch = useDeferredValue(search)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(savedHistory.slice(0, 20)))
  }, [savedHistory])

  useEffect(() => {
    let active = true

    async function loadRuntimeData() {
      try {
        const [historyResponse, recommendationResponse] = await Promise.all([
          fetch(`${DATA_PREFIX}data/lotto-history.json`, { cache: "no-store" }),
          fetch(`${DATA_PREFIX}data/lotto-recommendation.json`, { cache: "no-store" }),
        ])

        const nextHistory = historyResponse.ok ? ((await historyResponse.json()) as HistoryDataset) : FALLBACK_HISTORY
        const nextRecommendation = recommendationResponse.ok ? ((await recommendationResponse.json()) as RecommendationDataset) : FALLBACK_RECOMMENDATION

        if (!active) return
        setHistoryDataset(nextHistory)
        setRecommendationDataset(nextRecommendation)
      } catch {
        if (!active) return
        setHistoryDataset(FALLBACK_HISTORY)
        setRecommendationDataset(FALLBACK_RECOMMENDATION)
      }
    }

    void loadRuntimeData()

    return () => {
      active = false
    }
  }, [])

  const validation = useMemo(() => validateSelection(selection), [selection])

  const filteredHistory = useMemo(() => searchHistory(historyDataset.rows, deferredSearch), [deferredSearch, historyDataset.rows])

  const handleToggleNumber = (group: keyof SelectionState, value: number) => {
    setSelection((current) => {
      const limits: Partial<Record<keyof SelectionState, number>> = {
        front: current.mode === "single" ? 5 : undefined,
        back: current.mode === "single" ? 2 : undefined,
        frontDan: 4,
        backDan: 1,
        lockedFront: 5,
        lockedBack: 2,
      }

      return {
        ...current,
        [group]: toggleNumber((current[group] as number[]) ?? [], value, limits[group]),
      }
    })
  }

  const handleGenerate = () => {
    const result = validateSelection(selection)
    if (!result.valid) return

    if (selection.mode === "smart") {
      const nextTickets = Array.from({ length: selection.quickPickCount }, () => generateRandomTicket(selection))
      setTickets(nextTickets)
      return
    }

    setTickets([createTicketFromSelection(selection)])
  }

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text)
  }

  const handleSaveTicket = (ticket: GeneratedTicket) => {
    setSavedHistory((current) => [
      {
        id: `${ticket.id}-${Date.now()}`,
        savedAt: new Date().toISOString(),
        ticket,
      },
      ...current,
    ])
  }

  const restoreTicket = (ticket: GeneratedTicket) => {
    setTickets([ticket])
  }

  return (
    <main className="min-h-screen px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <Card className="overflow-hidden border-border/60 bg-card/95">
          <CardContent className="grid gap-6 px-6 py-6 md:grid-cols-[1.3fr_0.9fr] md:px-8">
            <div className="space-y-4">
              <Badge className="bg-secondary text-secondary-foreground">大乐透静态选号站</Badge>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">机选、规则、历史开奖与每日统计推荐放在一页里。</h1>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
                  页面使用 shadcn/ui 组织交互，开奖号码与推荐结果来自构建产物中的静态 JSON。推荐仅基于历史统计，仅供娱乐。
                </p>
              </div>
            </div>
            <div className="grid gap-3 rounded-[1.4rem] border border-border bg-secondary/35 p-4 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">历史同步</span>
                <span>{historyDataset.syncedAt ? new Date(historyDataset.syncedAt).toLocaleString("zh-CN") : "未同步"}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">推荐分析</span>
                <span>{recommendationDataset.generatedAt ? new Date(recommendationDataset.generatedAt).toLocaleString("zh-CN") : "未生成"}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">历史记录</span>
                <span>{savedHistory.length} 条本地保存</span>
              </div>
              <Alert variant="destructive" className="bg-transparent">
                <AlertTitle>重要提示</AlertTitle>
                <AlertDescription>推荐号码并非预测结果，不构成购彩建议。</AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <SelectionPanel
            state={selection}
            validation={validation}
            onModeChange={(mode) => setSelection((current) => ({ ...current, mode }))}
            onToggleNumber={handleToggleNumber}
            onAdditionalChange={(value) => setSelection((current) => ({ ...current, additional: value }))}
            onMultiplierChange={(value) => setSelection((current) => ({ ...current, multiplier: Number.isFinite(value) ? value : 1 }))}
            onQuickPickCountChange={(value) => setSelection((current) => ({ ...current, quickPickCount: Number.isFinite(value) ? value : 1 }))}
            onGenerate={handleGenerate}
            latestTickets={tickets}
          />

          <div className="space-y-6">
            <RecommendationPanel dataset={recommendationDataset} />

            <Card>
              <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
                <div>
                  <CardTitle>本次选号结果</CardTitle>
                  <CardDescription>单式直接出一注，智能机选可批量生成多注。</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => setTickets([])}>
                  <RefreshCw className="h-4 w-4" />
                  清空
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {tickets.length ? tickets.map((ticket) => <TicketCard key={ticket.id} ticket={ticket} onCopy={handleCopy} onSave={handleSaveTicket} />) : <p className="text-sm text-muted-foreground">尚未生成号码。</p>}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>历史开奖名单</CardTitle>
              <CardDescription>{getHistorySummary(historyDataset)} {getRecommendationSummary(recommendationDataset)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input placeholder="按期号、日期或号码搜索" value={search} onChange={(event) => setSearch(event.target.value)} />
              {historyDataset.syncError ? (
                <Alert variant="destructive">
                  <AlertTitle>同步异常</AlertTitle>
                  <AlertDescription>{historyDataset.syncError}</AlertDescription>
                </Alert>
              ) : null}
              <HistoryTable rows={filteredHistory.slice(0, 120)} />
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
                <div>
                  <CardTitle>玩法与金额规则</CardTitle>
                  <CardDescription>页面实现遵循大乐透基础规则与金额上限。</CardDescription>
                </div>
                <Badge variant="outline">静态说明</Badge>
              </CardHeader>
              <CardContent>
                <RuleAccordion />
              </CardContent>
            </Card>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="secondary" className="w-full justify-center">
                  <History className="h-4 w-4" />
                  查看本地保存记录
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[80vh] overflow-auto">
                <DialogHeader>
                  <DialogTitle>本地保存记录</DialogTitle>
                  <DialogDescription>保存在当前浏览器的最近 20 条选号记录。</DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  {savedHistory.length ? (
                    savedHistory.map((entry) => (
                      <div key={entry.id} className="rounded-2xl border border-border p-4">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <span className="text-sm font-medium">{entry.ticket.label}</span>
                          <span className="text-xs text-muted-foreground">{new Date(entry.savedAt).toLocaleString("zh-CN")}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          前区 {entry.ticket.frontNumbers.join(" ")} · 后区 {entry.ticket.backNumbers.join(" ")}
                        </p>
                        <Button variant="ghost" size="sm" className="mt-2" onClick={() => restoreTicket(entry.ticket)}>
                          恢复到结果区
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">还没有保存记录。</p>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </main>
  )
}

export default App
