import { useEffect, useMemo, useState } from "react"
import { History, RefreshCw } from "lucide-react"

import { RuleAccordion } from "@/components/rule-accordion"
import { SelectionPanel } from "@/components/selection-panel"
import { TicketCard } from "@/components/ticket-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DEFAULT_SELECTION, createTicketFromSelection, generateRandomTicket, toggleNumber, validateSelection } from "@/lib/dlt"
import type { GeneratedTicket, HistoryEntry, SelectionState } from "@/types"

const STORAGE_KEY = "dlt-picked-history"

function App() {
  const [selection, setSelection] = useState<SelectionState>(DEFAULT_SELECTION)
  const [tickets, setTickets] = useState<GeneratedTicket[]>([])
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

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(savedHistory.slice(0, 20)))
  }, [savedHistory])

  const validation = useMemo(() => validateSelection(selection), [selection])

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
          <CardContent className="grid gap-6 px-6 py-6 md:grid-cols-[1.25fr_0.75fr] md:px-8">
            <div className="space-y-4">
              <Badge className="bg-secondary text-secondary-foreground">大乐透自助机选</Badge>
              <div className="space-y-3">
                <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">复古报刊风的大乐透选号工具，打开就进入高级机选。</h1>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
                  现在只保留纯前端选号能力，不再下载历史开奖、不做号码预测，也不包含任何定时任务。默认模式是高级机选，其余单式、复式、胆拖仍可手动切换。
                </p>
              </div>
            </div>
            <div className="grid gap-3 rounded-[1.4rem] border border-border bg-secondary/35 p-4 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">当前默认模式</span>
                <span>高级机选</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">本地保存</span>
                <span>{savedHistory.length} 条</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">页面能力</span>
                <span>纯静态前端</span>
              </div>
              <p className="rounded-2xl border border-border bg-card/80 p-3 text-sm text-muted-foreground">
                仅提供自助机选和玩法辅助，不提供历史数据、预测分析或自动同步。
              </p>
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
            <Card>
              <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
                <div>
                  <CardTitle>本次选号结果</CardTitle>
                  <CardDescription>高级机选默认批量生成，多注结果可直接复制或保存。</CardDescription>
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

            <Card>
              <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
                <div>
                  <CardTitle>玩法与金额规则</CardTitle>
                  <CardDescription>保留大乐透基础玩法说明和金额计算规则。</CardDescription>
                </div>
                <Badge variant="outline">规则</Badge>
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
                  <DialogDescription>仅保存在当前浏览器的最近 20 条机选结果。</DialogDescription>
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
