# 員工紀錄表管理程式

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

