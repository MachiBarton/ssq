import { cn } from "@/lib/utils"
import { formatNumber } from "@/lib/dlt"

export function NumberBall({ value, zone = "front", active = true }: { value: number; zone?: "front" | "back"; active?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold",
        zone === "front" ? "bg-redball text-white" : "bg-blueball text-white",
        !active && "opacity-35",
      )}
    >
      {formatNumber(value)}
    </span>
  )
}
