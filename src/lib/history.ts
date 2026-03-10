import type { HistoryDataset, LottoHistoryRow } from "@/types"

export function searchHistory(rows: LottoHistoryRow[], query: string) {
  const trimmed = query.trim()
  if (!trimmed) return rows
  return rows.filter((row) => row.issue.includes(trimmed) || row.openDate.includes(trimmed) || row.frontNumbers.join(" ").includes(trimmed) || row.backNumbers.join(" ").includes(trimmed))
}

export function getHistorySummary(dataset: HistoryDataset) {
  if (dataset.syncError) {
    return `历史数据同步失败，当前为空。`
  }
  if (!dataset.rows.length) {
    return "暂无历史开奖数据。"
  }
  return `已同步 ${dataset.rows.length} 期历史开奖。`
}
