import { Sparkles } from "lucide-react"

import { NumberBall } from "@/components/number-ball"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { RecommendationDataset } from "@/types"

export function RecommendationPanel({ dataset }: { dataset: RecommendationDataset }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>本期统计推荐</CardTitle>
              <CardDescription>{dataset.generatedAt ? `更新时间 ${new Date(dataset.generatedAt).toLocaleString("zh-CN")}` : "等待同步"}</CardDescription>
            </div>
            <Badge>目标期号 {dataset.issueTarget}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">前区推荐池</p>
            <div className="flex flex-wrap gap-2">
              {dataset.frontPool.map((value) => (
                <NumberBall key={`pool-front-${value}`} value={value} zone="front" />
              ))}
              {!dataset.frontPool.length ? <span className="text-sm text-muted-foreground">暂无推荐池</span> : null}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">后区推荐池</p>
            <div className="flex flex-wrap gap-2">
              {dataset.backPool.map((value) => (
                <NumberBall key={`pool-back-${value}`} value={value} zone="back" />
              ))}
              {!dataset.backPool.length ? <span className="text-sm text-muted-foreground">暂无推荐池</span> : null}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">分析说明</p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {dataset.methodSummary.map((line) => (
                <li key={line}>• {line}</li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" />
            推荐组合
          </CardTitle>
          <CardDescription>展示 3 至 5 组可参考的统计型组合。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {dataset.suggestedTickets.map((ticket) => (
            <div key={`${ticket.frontNumbers.join("-")}-${ticket.backNumbers.join("-")}`} className="rounded-2xl border border-border/80 bg-secondary/35 p-4">
              <div className="mb-3 flex flex-wrap gap-2">
                {ticket.frontNumbers.map((value) => (
                  <NumberBall key={`sgf-${value}`} value={value} zone="front" />
                ))}
                {ticket.backNumbers.map((value) => (
                  <NumberBall key={`sgb-${value}`} value={value} zone="back" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">{ticket.reason}</p>
            </div>
          ))}
          {!dataset.suggestedTickets.length ? <p className="text-sm text-muted-foreground">暂无推荐组合。</p> : null}
        </CardContent>
      </Card>

      <Alert variant={dataset.analysisUnavailable ? "destructive" : "default"}>
        <AlertTitle>免责声明</AlertTitle>
        <AlertDescription>{dataset.analysisUnavailable ?? dataset.disclaimer}</AlertDescription>
      </Alert>
    </div>
  )
}
