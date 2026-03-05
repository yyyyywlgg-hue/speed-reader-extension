// 创建右键菜单
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'summarizeText',
    title: '🚀 速读总结',
    contexts: ['selection']
  });
});

// 存储选中的文本
let pendingText = '';

// 处理右键菜单点击
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'summarizeText') {
    // 保存选中的文本
    pendingText = info.selectionText;
    
    // 打开 popup
    chrome.action.openPopup();
  }
});

// 监听 popup 请求文本的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getPendingText') {
    // 返回待处理的文本，并清空
    const text = pendingText;
    pendingText = '';
    sendResponse({ text: text });
    return true;
  }
});
