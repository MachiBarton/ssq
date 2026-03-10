import { useEffect, useMemo, useState } from "react"
import { History, RefreshCw } from "lucide-react"

import { RuleAccordion } from "@/components/rule-accordion"
import { SelectionPanel } from "@/components/selection-panel"
import { TicketCard } from "@/components/ticket-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
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
      <div className="mx-auto max-w-7xl space-y-5">
        <section className="rounded-[1.4rem] border border-border/70 bg-card/95 px-6 py-6 soft-shadow md:px-8">
          <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">大乐透选号工具</h1>
          <p className="mt-2 text-sm text-muted-foreground">默认高级机选。左侧配置选号，右侧查看结果。</p>
        </section>

        <div className="grid gap-5 lg:grid-cols-12">
          <div className="lg:col-span-7">
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
          </div>

          <div className="flex min-h-0 flex-col gap-5 lg:col-span-5">
            <Card className="flex min-h-0 flex-1 flex-col lg:max-h-[76vh]">
              <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
                <div>
                  <CardTitle>本次选号结果</CardTitle>
                  <CardDescription>结果区固定高度，超出后在卡片内滚动。</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => setTickets([])}>
                  <RefreshCw className="h-4 w-4" />
                  清空
                </Button>
              </CardHeader>
              <CardContent className="min-h-0 flex-1">
                <ScrollArea className="h-full pr-3">
                  <div className="space-y-3">
                    {tickets.length ? tickets.map((ticket) => <TicketCard key={ticket.id} ticket={ticket} onCopy={handleCopy} onSave={handleSaveTicket} />) : <p className="text-sm text-muted-foreground">尚未生成号码。</p>}
                  </div>
                </ScrollArea>
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

        <div className="grid gap-5 lg:grid-cols-12">
          <Card className="lg:col-span-8">
            <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
              <div>
                <CardTitle>玩法与金额规则</CardTitle>
                <CardDescription>保留大乐透基础玩法说明和金额计算规则。</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <RuleAccordion />
            </CardContent>
          </Card>

          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle>使用提示</CardTitle>
              <CardDescription>快速完成一轮机选</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>1. 默认在高级机选里锁号或直接设定注数。</p>
              <p>2. 点“生成号码”后在右侧结果区查看。</p>
              <p>3. 结果可复制，也可存到本地记录。</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}

export default App
