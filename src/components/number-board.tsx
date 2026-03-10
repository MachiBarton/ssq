import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { formatNumber } from "@/lib/dlt"

interface NumberBoardProps {
  title: string
  hint: string
  numbers: number[]
  selected: number[]
  zone: "front" | "back"
  tone?: "normal" | "dan" | "tuo"
  onToggle: (value: number) => void
}

export function NumberBoard({ title, hint, numbers, selected, zone, tone = "normal", onToggle }: NumberBoardProps) {
  const activeClass =
    tone === "dan"
      ? "border-redball/60 bg-redball text-white hover:bg-redball"
      : tone === "tuo"
        ? "border-dashed border-redball/50 bg-redball/10 text-redball hover:bg-redball/15"
        : zone === "front"
          ? "border-redball/25 bg-redball/10 text-redball hover:bg-redball/15"
          : "border-blueball/25 bg-blueball/10 text-blueball hover:bg-blueball/15"

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>
        <Badge variant="secondary">{selected.length} 已选</Badge>
      </div>
      <div className="grid grid-cols-7 gap-2 sm:grid-cols-9">
        {numbers.map((value) => {
          const active = selected.includes(value)
          return (
            <Button
              key={value}
              type="button"
              variant="outline"
              size="sm"
              className={cn(
                "h-10 rounded-full border bg-card px-0 font-semibold",
                active ? activeClass : "text-muted-foreground hover:bg-secondary",
              )}
              onClick={() => onToggle(value)}
            >
              {formatNumber(value)}
            </Button>
          )
        })}
      </div>
    </div>
  )
}
