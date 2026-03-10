import { Copy, Save } from "lucide-react"

import { NumberBall } from "@/components/number-ball"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ticketToText } from "@/lib/dlt"
import type { GeneratedTicket } from "@/types"

export function TicketCard({
  ticket,
  onCopy,
  onSave,
}: {
  ticket: GeneratedTicket
  onCopy: (text: string) => void
  onSave: (ticket: GeneratedTicket) => void
}) {
  return (
    <Card className="border-border/80 bg-card/95">
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-base">{ticket.label}</CardTitle>
            <Badge variant="secondary">{ticket.additional ? "追加" : "普通"}</Badge>
            <Badge variant="outline">{ticket.multiplier} 倍</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {ticket.betCount} 注 · {ticket.amount} 元
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="icon" variant="ghost" onClick={() => onCopy(ticketToText(ticket))}>
            <Copy className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => onSave(ticket)}>
            <Save className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {ticket.sourceMode === "dantuo" ? (
          <div className="space-y-2 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="min-w-12 text-muted-foreground">前胆</span>
              {ticket.frontDan?.map((value) => <NumberBall key={`fd-${value}`} value={value} zone="front" />)}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="min-w-12 text-muted-foreground">前拖</span>
              {ticket.frontTuo?.map((value) => <NumberBall key={`ft-${value}`} value={value} zone="front" active={false} />)}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="min-w-12 text-muted-foreground">后胆</span>
              {(ticket.backDan?.length ?? 0) > 0 ? ticket.backDan?.map((value) => <NumberBall key={`bd-${value}`} value={value} zone="back" />) : <span className="text-muted-foreground">无</span>}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="min-w-12 text-muted-foreground">后拖</span>
              {ticket.backTuo?.map((value) => <NumberBall key={`bt-${value}`} value={value} zone="back" active={false} />)}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="min-w-14 text-sm text-muted-foreground">前区</span>
              {ticket.frontNumbers.map((value) => (
                <NumberBall key={`front-${value}`} value={value} zone="front" />
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="min-w-14 text-sm text-muted-foreground">后区</span>
              {ticket.backNumbers.map((value) => (
                <NumberBall key={`back-${value}`} value={value} zone="back" />
              ))}
            </div>
          </div>
        )}
        {ticket.note ? <p className="text-sm text-muted-foreground">{ticket.note}</p> : null}
      </CardContent>
    </Card>
  )
}
