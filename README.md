# 北馬新生兒入院摘要與會診單產生器

Mackay Memorial Hospital (Taipei) · BR Admission Summary & Consultation Form Generator

Single-page client-side tool: 貼入產房原始紀錄 → 即時生成診斷、入院摘要、會診單、出院摘要。

## 部署

托管於 GitHub Pages：`https://lantus123.github.io/mmh-newborn-summary/`

嵌入 Google Sites：插入 → 內嵌 → 依網址 → 貼上方 URL。

## 開發流程

純靜態 HTML，本機改完直接：

```bash
git add index.html
git commit -m "..."
git push
```

約 30 秒後 GitHub Pages 自動 deploy，Sites iframe 自動拿到新版。
