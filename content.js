// 内容脚本 - 可以在这里添加更多网页交互功能
// 目前主要通过 background.js 处理右键菜单

// 可选：添加快捷键支持
document.addEventListener('keydown', (e) => {
  // Ctrl+Shift+S 快速总结
  if (e.ctrlKey && e.shiftKey && e.key === 'S') {
    const selection = window.getSelection().toString();
    if (selection) {
      chrome.runtime.sendMessage({
        action: 'showSummary',
        text: selection
      });
    }
  }
});
