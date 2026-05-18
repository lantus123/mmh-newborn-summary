# 馬偕新生兒入院摘要與會診單產生器

Mackay Memorial Hospital · BR Admission Summary & Consultation Form Generator

Single-page client-side tool: 貼入產房原始紀錄 → 即時生成診斷、入院摘要、會診單、出院摘要。

## 多院區 — URL 參數切換

同一份 code 透過 `?campus=` 切換院區，避免 2 個 repo sync 痛苦。

| 院區 | URL | 差異點 |
|---|---|---|
| 北馬（default）| `https://lantus123.github.io/mmh-newborn-summary/` | HC 監測 Q2H→QD |
| 東馬 | `https://lantus123.github.io/mmh-newborn-summary/?campus=ttmh` | HC 監測 Q8H |

## 新增院區

只改 `index.html` 開頭的 `CAMPUS_CONFIGS`：

```javascript
const CAMPUS_CONFIGS = {
  tpc: { name: '北馬', fullName: '...', hcMonitor: {...} },
  ttmh: { name: '東馬', fullName: '...', hcMonitor: {...} },
  // 新院區加在這
  tmh: { name: '淡馬', fullName: 'Mackay Memorial Hospital (Tamsui)', hcMonitor: {...} },
};
```

`?campus=tmh` 立刻可用，HTML/UI 不用改。Generator 邏輯（parser、output 模板）兩院區共用——bug 修一次兩邊都好。

## 部署

托管於 GitHub Pages。

嵌入 Google Sites：插入 → 內嵌 → 依網址 → 貼上方 URL（注意北馬/東馬 URL 不同）。

## 開發流程

純靜態 HTML，本機改完直接：

```bash
git add index.html
git commit -m "..."
git push
```

約 30 秒後 GitHub Pages 自動 deploy，Sites iframe 自動拿到新版。

## 維護差異點時的 workflow

- **修共用 bug / 加新功能**：直接改 generator/parser → 自動兩院區都吃到
- **加院區獨有設定**（HC schedule、未來其他差異）：在 `CAMPUS_CONFIGS` 物件加欄位 + 把 generator 對應位置從 hardcode 改成 `CAMPUS.xxx`
- **驗證 0 regression**：本機 `open index.html` 跟 `open 'index.html?campus=ttmh'` 各貼一份測試 input，比對輸出符合預期
