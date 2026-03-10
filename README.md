# 大乐透选号站

基于 `Vite + React + shadcn/ui` 的静态大乐透选号工具，包含：

- 单式、复式、胆拖、追加、多倍、锁号后机选
- 本期统计推荐号码展示
- 历史开奖名单检索
- 本地保存最近选号记录
- GitHub Actions 或 cron 定时同步 CSV 并生成静态 JSON
- Python/cron 版定时同步脚本

部署基路径固定为 `/ssq`，适合作为 GitHub Pages 项目站点路径。

## 开发

```bash
npm install
npm run dev
```

## 构建

前端只在本地打包：

```bash
npm run build
```

打包完成后，提交仓库中的 `dist`。GitHub Actions 不再执行构建，只负责把仓库里已有的 `dist` 发布到 `gh-pages`。

之后定时只运行 Python 脚本，直接覆盖打包产物里的数据文件：

```bash
python3 scripts/generate_lotto_data.py
```

这个脚本会同时更新：

- `public/data/*.json`
- `dist/data/*.json`
- `src/generated/*.json`（仅保留为调试产物）

这样前端打包后不需要重新执行 `npm build`，页面会在运行时读取 `data/*.json`。

## GitHub Pages 部署

仓库已包含 GitHub Pages 工作流：

- [`.github/workflows/deploy-pages.yml`](/Volumes/T7/stCode/ssq/.github/workflows/deploy-pages.yml)

推送到 `main` 后会自动：

1. 读取仓库中已提交的 `dist`
2. 将 `dist` 发布到 `gh-pages` 分支

GitHub 仓库地址是 `MachiBarton/ssq`，对应 Pages 路径为 `/ssq`。

GitHub 仓库设置里请将 Pages Source 设为：

- `Deploy from a branch`
- Branch: `gh-pages`
- Folder: `/ (root)`

如果你仍要保留旧的 Node 版本同步脚本用于调试：

```bash
npm run sync:data:node
```

## 数据来源

- 历史开奖 CSV: `https://www.js-lottery.com/lottery/downLottoData`
- 玩法规则:
  - `https://www.js-lottery.com/wfzq/dlt/wfjs/cms/post-146354.html`
  - `https://www.js-lottery.com/wfzq/dlt/wfjs/cms/post-146353.html`

## 自动同步

仓库内置 `.github/workflows/sync-data.yml`，默认每天执行一次：

1. 拉取最新 CSV
2. 解析为 `src/generated/lotto-history.json`
3. 计算推荐池和推荐组合
4. 写入 `src/generated/lotto-recommendation.json`
5. 自动提交变更

如果你要在自己机器或服务器上定时跑，而不是 GitHub Actions：

```bash
scripts/run_daily_lotto_sync.sh
```

这个脚本会：

1. 加锁，避免重复运行
2. 优先执行 `scripts/generate_lotto_data.py`
3. 回退支持调用 Codex CLI prompt
4. 不重新构建，只更新 `dist/data/*.json`
5. 自动提交并推送数据文件；本机或服务器上的 `dist/data/*.json` 会被直接覆盖

你可以把它挂到 `cron` 或 `launchd`。Codex 不能替你在“Codex 云端”长期托管这项任务，但仓库已经具备可直接部署到你自己环境的定时入口。
