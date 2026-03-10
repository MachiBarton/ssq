import { TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { PlayMode } from "@/types"

const labels: Record<PlayMode, string> = {
  single: "单式",
  multiple: "复式",
  dantuo: "胆拖",
  smart: "高级机选",
}

export function ModeTabs() {
  return (
    <TabsList className="w-full justify-start overflow-auto">
      {(Object.keys(labels) as PlayMode[]).map((mode) => (
        <TabsTrigger key={mode} value={mode}>
          {labels[mode]}
        </TabsTrigger>
      ))}
    </TabsList>
  )
}
