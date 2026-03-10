import type { RecommendationDataset } from "@/types"

export function getRecommendationSummary(dataset: RecommendationDataset) {
  if (dataset.analysisUnavailable) {
    return "本次推荐生成失败，页面仅保留选号与历史查询。"
  }
  return `基于最近 ${dataset.sampleSize} 期数据生成推荐池与示例组合。`
}
