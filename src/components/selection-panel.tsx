import { Info, WandSparkles } from "lucide-react"

import { ModeTabs } from "@/components/mode-tabs"
import { NumberBoard } from "@/components/number-board"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { BACK_NUMBERS, FRONT_NUMBERS, calculateCost, countBets } from "@/lib/dlt"
import type { GeneratedTicket, SelectionState, ValidationResult } from "@/types"

interface SelectionPanelProps {
  state: SelectionState
  validation: ValidationResult
  onModeChange: (mode: SelectionState["mode"]) => void
  onToggleNumber: (group: keyof SelectionState, value: number) => void
  onAdditionalChange: (value: boolean) => void
  onMultiplierChange: (value: number) => void
  onQuickPickCountChange: (value: number) => void
  onGenerate: () => void
  latestTickets: GeneratedTicket[]
}

export function SelectionPanel({
  state,
  validation,
  onModeChange,
  onToggleNumber,
  onAdditionalChange,
  onMultiplierChange,
  onQuickPickCountChange,
  onGenerate,
  latestTickets,
}: SelectionPanelProps) {
  const cost = calculateCost(state, countBets(state))

  return (
    <Card className="paper-grid sticky top-6">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>选号工作台</CardTitle>
            <CardDescription>默认进入高级机选，仍保留单式、复式、胆拖和锁号补齐能力。</CardDescription>
          </div>
          <Badge variant="secondary">{state.mode === "smart" ? `${state.quickPickCount} 注待生成` : `${cost.betCount} 注`}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs value={state.mode} onValueChange={(value) => onModeChange(value as SelectionState["mode"])}>
          <ModeTabs />
          <TabsContent value="single" className="space-y-4">
            <NumberBoard title="前区选号" hint="单式固定 5 个" numbers={FRONT_NUMBERS} selected={state.front} zone="front" onToggle={(value) => onToggleNumber("front", value)} />
            <NumberBoard title="后区选号" hint="单式固定 2 个" numbers={BACK_NUMBERS} selected={state.back} zone="back" onToggle={(value) => onToggleNumber("back", value)} />
          </TabsContent>
          <TabsContent value="multiple" className="space-y-4">
            <NumberBoard title="前区复式" hint="至少选择 5 个，越多注数越大" numbers={FRONT_NUMBERS} selected={state.front} zone="front" onToggle={(value) => onToggleNumber("front", value)} />
            <NumberBoard title="后区复式" hint="至少选择 2 个" numbers={BACK_NUMBERS} selected={state.back} zone="back" onToggle={(value) => onToggleNumber("back", value)} />
          </TabsContent>
          <TabsContent value="dantuo" className="space-y-4">
            <NumberBoard title="前区胆码" hint="1 到 4 个" numbers={FRONT_NUMBERS.filter((value) => !state.frontTuo.includes(value))} selected={state.frontDan} zone="front" tone="dan" onToggle={(value) => onToggleNumber("frontDan", value)} />
            <NumberBoard title="前区拖码" hint="与胆码互斥" numbers={FRONT_NUMBERS.filter((value) => !state.frontDan.includes(value))} selected={state.frontTuo} zone="front" tone="tuo" onToggle={(value) => onToggleNumber("frontTuo", value)} />
            <NumberBoard title="后区胆码" hint="最多 1 个" numbers={BACK_NUMBERS.filter((value) => !state.backTuo.includes(value))} selected={state.backDan} zone="back" tone="dan" onToggle={(value) => onToggleNumber("backDan", value)} />
            <NumberBoard title="后区拖码" hint="至少补足到 2 个" numbers={BACK_NUMBERS.filter((value) => !state.backDan.includes(value))} selected={state.backTuo} zone="back" tone="tuo" onToggle={(value) => onToggleNumber("backTuo", value)} />
          </TabsContent>
          <TabsContent value="smart" className="space-y-4">
            <NumberBoard title="锁定前区" hint="最多锁 5 个，其余随机补齐" numbers={FRONT_NUMBERS} selected={state.lockedFront} zone="front" onToggle={(value) => onToggleNumber("lockedFront", value)} />
            <NumberBoard title="锁定后区" hint="最多锁 2 个" numbers={BACK_NUMBERS} selected={state.lockedBack} zone="back" onToggle={(value) => onToggleNumber("lockedBack", value)} />
            <div className="rounded-2xl border border-border bg-secondary/30 p-4">
              <label className="mb-2 block text-sm font-medium" htmlFor="quick-pick-count">
                生成注数
              </label>
              <Input id="quick-pick-count" type="number" min={1} max={20} value={state.quickPickCount} onChange={(event) => onQuickPickCountChange(Number(event.target.value))} />
            </div>
          </TabsContent>
        </Tabs>

        <Accordion type="single" collapsible>
          <AccordionItem value="settings">
            <AccordionTrigger>高级设置</AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-border bg-secondary/25 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="text-sm font-medium">追加投注</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="inline-flex text-muted-foreground" type="button">
                            <Info className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>追加后单注金额由 2 元变为 3 元。</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{state.additional ? "当前为追加" : "当前为普通"}</span>
                    <Switch checked={state.additional} onCheckedChange={onAdditionalChange} />
                  </div>
                </div>
                <div className="rounded-2xl border border-border bg-secondary/25 p-4">
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium" htmlFor="multiplier">
                    倍数
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="inline-flex text-muted-foreground" type="button">
                            <Info className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>支持 1 到 99 倍。</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </label>
                  <Input id="multiplier" type="number" min={1} max={99} value={state.multiplier} onChange={(event) => onMultiplierChange(Number(event.target.value))} />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="rounded-[1.2rem] border border-border bg-card/80 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">实时金额</p>
              <p className="text-sm text-muted-foreground">
                {state.mode === "smart" ? `${state.quickPickCount} 注机选，预计 ${calculateCost(state, state.quickPickCount).amount} 元` : `${cost.betCount} 注 × ${cost.unitPrice} 元 × ${cost.multiplier} 倍 = ${cost.amount} 元`}
              </p>
            </div>
            <Button className="min-w-32" onClick={onGenerate}>
              <WandSparkles className="h-4 w-4" />
              生成号码
            </Button>
          </div>
          <Separator className="my-4" />
          <p className={`text-sm ${validation.valid ? "text-muted-foreground" : "text-destructive"}`}>{validation.message}</p>
          {latestTickets.length ? <p className="mt-2 text-xs text-muted-foreground">最近一次生成 {latestTickets.length} 条结果，右侧可复制或保存。</p> : null}
        </div>
      </CardContent>
    </Card>
  )
}
