在当前仓库执行大乐透数据更新流程：

1. 拉取 `https://www.js-lottery.com/lottery/downLottoData`
2. 解析 CSV，生成 `src/generated/lotto-history.json`
3. 基于历史开奖生成 `src/generated/lotto-recommendation.json`
4. 运行构建，确保 `dist` 更新
5. 不要修改无关文件

如果抓取失败：
- 保留空数据结构
- 写入明确错误信息
- 仍然完成构建
