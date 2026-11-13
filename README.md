# みんなの日本語・黑狗王之路

純靜態網站（HTML/CSS/vanilla JS，無建置步驟，可直接放 GitHub Pages）。架構參考 news-english。

## 檔案
- `index.html` 首頁：黑狗王狀態卡＋單元清單（由 `rw.js` 的 `UNITS` 產生）
- `lessonNN.html` / `lessonNN-data.js`（`window.LESSON`）/ `lessonNN-audio.js`（字串→mp3 對照 `window.UNIT_C`）/ `lessonNN-audio/*.mp3`
- `unit.js` 共用引擎（單字卡、筆記、課文、練習、口說），不含課別專屬邏輯
- `jp.js` `{漢字|かな}` 標記工具（ruby／純文字／假名）
- `rw.js` 練習紀錄（localStorage `jpMinnaRW1`）、完成規則、版本檢查 `version.txt`（改版時同步改 `PAGEVER` 與 `?v=N`）
- `dogs.js` 黑狗王系統（`jpBlackDogKing1`），監聽 `rwx` 事件；`kennel.html` 狗舍
- `speech.js` 單一 `<audio>` 重用、playbackRate 語速；找不到 mp3 退回 speechSynthesis（ja-JP）
- localStorage 不可用時，自動退回記憶體。

## 加新課（例如第 24 課）
1. 複製 `lesson23-data.js` → `lesson24-data.js`，改 `uid:"l24"`、`n:24` 與內容（讀音用 `{漢字|かな}`）。
2. 複製 `lesson23.html` → `lesson24.html`，把 `lesson23-` 全改 `lesson24-`。
3. 在 `rw.js` 的 `UNITS` 加一行（id 用 `l24`、file、name、title、count、types）。
4. 產生語音（見下）。
5. 若上線，`version.txt` 與各頁 `PAGEVER`／`?v=` 數字一起加一。

## 產生語音
```
cd /workspace/japanese-site
node tools/collect.js lesson23 > /tmp/lesson23.json
/workspace/venv-tts/bin/python tools/build_audio.py lesson23
```
聲音：`ja-JP-NanamiNeural`（預設）、`ja-JP-KeitaNeural`（男聲角色／例文回答）。已存在的 mp3 會跳過，失敗可重跑。

## 改例文
直接編輯 `lesson23-data.js` 的 `sentences`，再重跑上面兩個指令。
