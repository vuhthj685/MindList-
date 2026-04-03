# 部署说明

## 一、网页版（GitHub Pages）

### 部署步骤

#### 1. 将代码推送到 GitHub

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/你的用户名/你的仓库名.git
git push -u origin main
```

#### 2. 在 GitHub 仓库开启 GitHub Pages

1. 进入仓库 **Settings → Pages**
2. Source 选择 **"Deploy from a branch"**
3. Branch 选择 **`gh-pages`**，目录选择 **`/ (root)`**
4. 点击 **Save**

#### 3. 触发自动部署

第一次推送后，GitHub Actions 会自动运行（`.github/workflows/deploy.yml`）：
- 自动安装依赖
- 自动构建 Vue 项目（GitHub Pages 模式）
- 自动部署到 `gh-pages` 分支

访问地址格式：`https://你的用户名.github.io/你的仓库名/`

#### 4. 后续更新

每次向 `main` 分支推送代码，会自动重新构建并部署。

---

### 本地构建网页版（可选）

```bash
cd web
npm install
npm run build:ghpages
```

构建产物在 `dist/` 目录，可部署到任何静态文件服务器。

---

## 二、桌面客户端（Electron）

### 方式一：GitHub Actions 自动打包（推荐）

代码推送到 GitHub 后，有两种触发方式：

**方式A：手动触发**
1. 进入仓库 **Actions** 页面
2. 找到 **"打包桌面客户端"** 工作流
3. 点击 **"Run workflow"**
4. 选择目标平台（windows / mac / linux / all）
5. 构建完成后，在 **Artifacts** 下载安装包

**方式B：发布新版本时自动触发**
```bash
git tag v1.0.0
git push origin v1.0.0
```
推送版本标签后，自动打包三个平台的安装包，并创建 GitHub Release。

---

### 方式二：本地手动打包

#### 前提条件
- 安装 Node.js 18+
- 在 `web/` 目录安装依赖：`npm install`
- 在 `electron/` 目录安装依赖：`npm install`

#### 构建步骤

```bash
# 第一步：构建 Vue 项目（Electron 模式）
cd web
npm run build:electron

# 第二步：打包安装程序（在 electron/ 目录）
cd ../electron
npm run build:win     # Windows
npm run build:mac     # macOS
npm run build:linux   # Linux
```

安装包输出在 `electron-dist/` 目录：
- Windows：`electron-dist/思维清单 Setup 1.0.0.exe`
- macOS：`electron-dist/思维清单-1.0.0.dmg`
- Linux：`electron-dist/思维清单-1.0.0.AppImage`

---

### 直接运行（不打包，开发测试用）

```bash
# 第一步：构建 Vue 项目
cd web
npm run build:electron

# 第二步：运行 Electron
cd ../electron
npm install
npm start
```

---

## 三、注意事项

1. **数据存储**：所有数据存在浏览器/Electron 的 `localStorage` 中，换设备需要导出文件备份
2. **网页版限制**：本地文件操作功能（打开/保存 .smm 文件）需要浏览器支持 File System Access API（Chrome 86+）
3. **Electron 版**：支持所有功能，无跨域限制，数据存储在本机 localStorage 中
4. **AI 功能**：需要在设置中配置 API Key，否则 AI 功能不可用
