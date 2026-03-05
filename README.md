# 🚀 速读助手 - AI 网页总结 Chrome 插件

一键总结网页内容，支持**智谱 AI (在线)** 和 **Ollama (本地离线)** 两种模式。

## ✨ 功能特点

- 🔥 **双模型支持**：智谱 AI (在线) / Ollama (本地离线)
- 🎨 **多种风格**：简洁版 / 详细版 / 要点版 / 推特版
- 📚 **历史记录**：自动保存最近50条总结
- ⭐ **收藏功能**：手动收藏重要总结
- 💾 **导出功能**：支持 Markdown 和 TXT 格式
- 📊 **使用统计**：查看使用情况
- 🔒 **隐私保护**：本地模型完全离线，数据不出电脑

## 🚀 安装步骤

### 1. 下载插件

```bash
git clone https://github.com/yourusername/speed-reader-extension.git
cd speed-reader-extension
```

或者下载 ZIP 解压。

### 2. 安装到 Chrome

1. 打开 Chrome 浏览器，访问 `chrome://extensions/`
2. 开启右上角的"**开发者模式**"
3. 点击"**加载已解压的扩展程序**"
4. 选择本文件夹
5. 安装成功！

## 🔧 配置说明

### 方案一：智谱 AI (推荐，在线)

1. 访问 [智谱 AI 开放平台](https://open.bigmodel.cn/)
2. 注册账号，创建 API Key
3. 在插件设置中选择"智谱 AI"
4. 输入 API Key 并保存

**免费额度**：新用户有 100万 tokens

### 方案二：Ollama (本地离线)

1. **安装 Ollama**
   ```bash
   # macOS
   brew install ollama
   
   # 或从官网下载: https://ollama.com
   ```

2. **下载模型**
   ```bash
   ollama pull llama3.2
   # 或其他模型: mistral, qwen2.5 等
   ```

3. **保持 Ollama 运行**
   ```bash
   ollama serve
   ```

4. **插件设置**
   - 选择"Ollama (本地)"
   - 输入模型名称（默认: llama3.2）
   - 无需 API Key，完全离线！

## 📖 使用指南

### 基本使用

1. 在任意网页**选中文字**
2. **右键** → 点击"🚀 速读总结"
3. 插件自动弹出并显示总结结果

### 切换风格

在"总结"标签页选择风格：
- **简洁版**：2-3句话概括
- **详细版**：包含观点和论据
- **要点版**：3-5个要点
- **推特版**：280字以内

### 导出内容

总结完成后，点击：
- **📝 MD**：导出 Markdown 文件
- **📄 TXT**：导出纯文本文件

### 快捷键

- `Ctrl+Shift+S`：快速总结选中文字

## 🏗️ 项目结构

```
speed-reader-extension/
├── manifest.json      # 插件配置
├── popup.html         # 弹出窗口界面
├── popup.js           # 弹出窗口逻辑
├── background.js      # 后台服务
├── content.js         # 内容脚本
├── icons/             # 图标
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md          # 说明文档
```

## 🛠️ 开发计划

- [x] 支持智谱 AI
- [x] 支持 Ollama 本地模型
- [x] 历史记录功能
- [x] 收藏功能
- [x] 导出 Markdown/TXT
- [ ] 暗黑模式
- [ ] 自定义提示词
- [ ] 批量总结
- [ ] 划词翻译

## 🤝 贡献

欢迎提交 Issue 和 PR！

## 📄 License

MIT License - 免费开源，可自由使用和修改

---

**Made with ❤️ by OpenClaw**
