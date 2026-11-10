# 員工紀錄表管理程式

目前開發與正式建置的 API、Excel 文件及 ONLYOFFICE 回呼網址統一為 `http://192.168.0.87:7511`，編輯器為 `http://192.168.0.87:7000`。`.env`、設定預設值及備援網址採相同位址；修改環境設定後重新啟動前端。前端連到 `.87` 後會使用該主機的後端與資料，新功能仍須部署相應後端程式及資料庫版本。

## Environment Prepare

本專案使用 **Node.js 22.x**（固定開發版本記錄於 `.nvmrc` 與 `.node-version`）。
目前的 Umi 4.2.10 相依套件會呼叫 Node.js 24 起已移除的
`process.binding('http_parser')`，因此請使用 Node.js 22 安裝及執行。

Windows PowerShell 每次開啟新終端機後，先在專案目錄執行：

```powershell
.\use-node.ps1
node --version
npm install
npm start
```

`use-node.ps1` 會從 Node.js 官方網站下載固定版本、檢查 SHA-256，並將
`.tools` 內的 Node.js 加入目前終端機的 PATH；不變更系統 Node.js 或永久 PATH。
首次執行需連網。若公司限制 PowerShell 腳本，可改用已安裝的 Node.js 版本管理工具
切換至 `.nvmrc` 指定版本。`.npmrc` 的 `engine-strict` 會在使用不相容版本安裝時
提早中止，避免再次執行到 `max setup` 才失敗。

Install `node_modules`:

```bash
npm install
```

or

```bash
yarn
```

## Provided Scripts



### Start project

```bash
npm start
```

### Build project

```bash
npm run build
```

### Check code style

```bash
npm run lint
```

You can also use script to auto fix some lint error:

```bash
npm run lint:fix
```

### Test code

```bash
npm test
```

