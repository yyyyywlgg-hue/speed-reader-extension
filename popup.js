let currentStyle = 'concise';
let currentSummary = '';
let currentOriginal = '';
let lastSummarizedText = '';

const stylePrompts = {
  concise: '请用2-3句话简洁总结以下内容的核心观点：',
  detailed: '请详细总结以下内容，包括主要观点、关键论据和结论：',
  bullet: '请将以下内容总结为3-5个要点，使用项目符号：',
  twitter: '请将以下内容总结为适合推特发布的格式（280字以内），要有吸引力：'
};

const styleNames = {
  concise: '简洁版',
  detailed: '详细版',
  bullet: '要点版',
  twitter: '推特版'
};

// API 配置
const API_CONFIG = {
  zhipu: {
    url: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    model: 'glm-4-flash'
  },
  ollama: {
    url: 'http://localhost:11434/api/generate',
    model: 'llama3.2'
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  await loadSavedData();
  setupEventListeners();
  await checkPendingText();
});

function setupEventListeners() {
  // 标签页切换
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      tab.classList.add('active');
      document.getElementById(tab.dataset.tab + '-tab').classList.add('active');
      
      if (tab.dataset.tab === 'history') loadHistory();
      if (tab.dataset.tab === 'favorites') loadFavorites();
    });
  });
  
  // API Key 保存
  document.getElementById('saveApiKey').addEventListener('click', async () => {
    const apiKey = document.getElementById('apiKey').value.trim();
    if (apiKey) {
      await chrome.storage.local.set({ zhipuApiKey: apiKey });
      showNotification('API Key 已保存！');
    }
  });
  
  // 模型选择
  document.getElementById('modelSelect').addEventListener('change', async (e) => {
    const model = e.target.value;
    await chrome.storage.local.set({ selectedModel: model });
    updateModelUI(model);
    showNotification(`已切换到${model === 'ollama' ? '本地 Ollama' : '智谱 AI'}`);
  });
  
  // Ollama 模型输入
  document.getElementById('ollamaModel').addEventListener('change', async (e) => {
    await chrome.storage.local.set({ ollamaModel: e.target.value });
  });
  
  // 切换风格
  document.querySelectorAll('.style-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const newStyle = btn.dataset.style;
      if (newStyle === currentStyle) return;
      
      document.querySelectorAll('.style-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentStyle = newStyle;
      
      if (lastSummarizedText) {
        showLoading();
        await summarizeText(lastSummarizedText);
      }
    });
  });
  
  // 复制
  document.getElementById('copyResult').addEventListener('click', () => {
    navigator.clipboard.writeText(currentSummary).then(() => {
      showNotification('已复制到剪贴板！');
    });
  });
  
  // 收藏
  document.getElementById('favoriteResult').addEventListener('click', async () => {
    await addToFavorites(currentOriginal, currentSummary, currentStyle);
    showNotification('已添加到收藏！');
    updateFavoriteCount();
  });
  
  // 导出 Markdown
  document.getElementById('exportMarkdown').addEventListener('click', () => {
    exportAsMarkdown();
  });
  
  // 导出 TXT
  document.getElementById('exportTxt').addEventListener('click', () => {
    exportAsTxt();
  });
  
  // 清空历史
  document.getElementById('clearHistory').addEventListener('click', async () => {
    if (confirm('确定要清空所有历史记录吗？')) {
      await chrome.storage.local.set({ history: [] });
      loadHistory();
      updateHistoryCount();
      showNotification('历史记录已清空');
    }
  });
  
  // 清空收藏
  document.getElementById('clearFavorites').addEventListener('click', async () => {
    if (confirm('确定要清空所有收藏吗？')) {
      await chrome.storage.local.set({ favorites: [] });
      loadFavorites();
      updateFavoriteCount();
      showNotification('收藏已清空');
    }
  });
  
  // 关闭弹窗
  document.querySelector('.close-btn').addEventListener('click', () => {
    document.getElementById('detailModal').classList.remove('active');
  });
  
  document.getElementById('detailModal').addEventListener('click', (e) => {
    if (e.target.id === 'detailModal') {
      document.getElementById('detailModal').classList.remove('active');
    }
  });
}

async function checkPendingText() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getPendingText' });
    if (response && response.text) {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      document.querySelector('[data-tab="summary"]').classList.add('active');
      document.getElementById('summary-tab').classList.add('active');
      
      showLoading();
      await summarizeText(response.text);
    }
  } catch (error) {
    console.log('No pending text');
  }
}

async function loadSavedData() {
  const result = await chrome.storage.local.get([
    'zhipuApiKey', 'selectedModel', 'ollamaModel', 'todayCount', 'totalCount', 
    'lastDate', 'history', 'favorites', 'autoSave'
  ]);
  
  // 加载 API Key
  if (result.zhipuApiKey) {
    document.getElementById('apiKey').value = result.zhipuApiKey;
  }
  
  // 加载模型选择
  const selectedModel = result.selectedModel || 'zhipu';
  document.getElementById('modelSelect').value = selectedModel;
  updateModelUI(selectedModel);
  
  // 加载 Ollama 模型名
  if (result.ollamaModel) {
    document.getElementById('ollamaModel').value = result.ollamaModel;
  }
  
  // 其他设置
  if (result.autoSave !== undefined) {
    document.getElementById('autoSave').checked = result.autoSave;
  }
  
  updateStats(result);
  updateHistoryCount();
  updateFavoriteCount();
  
  // 加载上次结果
  const lastResult = await chrome.storage.local.get(['lastSummary', 'lastOriginal', 'lastSummarizedText']);
  if (lastResult.lastSummary) {
    currentSummary = lastResult.lastSummary;
    currentOriginal = lastResult.lastOriginal || '';
    lastSummarizedText = lastResult.lastSummarizedText || '';
    displayResult(currentSummary);
  }
}

function updateModelUI(model) {
  const zhipuConfig = document.getElementById('zhipuConfig');
  const ollamaConfig = document.getElementById('ollamaConfig');
  
  if (model === 'zhipu') {
    zhipuConfig.style.display = 'block';
    ollamaConfig.style.display = 'none';
  } else {
    zhipuConfig.style.display = 'none';
    ollamaConfig.style.display = 'block';
  }
}

function updateStats(result) {
  const today = new Date().toDateString();
  let todayCount = result.todayCount || 0;
  let totalCount = result.totalCount || 0;
  
  if (result.lastDate !== today) {
    todayCount = 0;
  }
  
  document.getElementById('todayCount').textContent = todayCount;
  document.getElementById('totalCount').textContent = totalCount;
}

async function updateHistoryCount() {
  const result = await chrome.storage.local.get(['history']);
  document.getElementById('historyCount').textContent = (result.history || []).length;
}

async function updateFavoriteCount() {
  const result = await chrome.storage.local.get(['favorites']);
  document.getElementById('favoriteCount').textContent = (result.favorites || []).length;
}

async function incrementStats() {
  const result = await chrome.storage.local.get(['todayCount', 'totalCount', 'lastDate']);
  const today = new Date().toDateString();
  
  let todayCount = (result.lastDate === today) ? (result.todayCount || 0) : 0;
  let totalCount = result.totalCount || 0;
  
  todayCount++;
  totalCount++;
  
  await chrome.storage.local.set({
    todayCount: todayCount,
    totalCount: totalCount,
    lastDate: today
  });
  
  document.getElementById('todayCount').textContent = todayCount;
  document.getElementById('totalCount').textContent = totalCount;
}

function showLoading() {
  document.getElementById('result').classList.add('hidden');
  document.getElementById('loading').classList.remove('hidden');
  document.getElementById('copyResult').classList.add('hidden');
  document.getElementById('favoriteResult').classList.add('hidden');
  document.getElementById('exportMarkdown').classList.add('hidden');
  document.getElementById('exportTxt').classList.add('hidden');
}

function hideLoading() {
  document.getElementById('loading').classList.add('hidden');
  document.getElementById('result').classList.remove('hidden');
  document.getElementById('copyResult').classList.remove('hidden');
  document.getElementById('favoriteResult').classList.remove('hidden');
  document.getElementById('exportMarkdown').classList.remove('hidden');
  document.getElementById('exportTxt').classList.remove('hidden');
}

function formatResult(text) {
  return text.replace(/\n/g, '<br>');
}

function displayResult(text) {
  document.getElementById('result').innerHTML = formatResult(text);
}

async function summarizeText(text) {
  currentOriginal = text;
  lastSummarizedText = text;
  
  const settings = await chrome.storage.local.get(['selectedModel', 'zhipuApiKey', 'ollamaModel']);
  const model = settings.selectedModel || 'zhipu';
  
  const maxLength = 3000;
  const truncatedText = text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  const prompt = stylePrompts[currentStyle] + '\n\n' + truncatedText;
  
  try {
    let summary;
    
    if (model === 'zhipu') {
      summary = await callZhipuAPI(prompt, settings.zhipuApiKey);
    } else {
      summary = await callOllamaAPI(prompt, settings.ollamaModel);
    }
    
    currentSummary = summary;
    
    await chrome.storage.local.set({ 
      lastSummary: currentSummary,
      lastOriginal: currentOriginal,
      lastSummarizedText: lastSummarizedText
    });
    
    await incrementStats();
    
    const autoSave = await chrome.storage.local.get(['autoSave']);
    if (autoSave.autoSave !== false) {
      await saveToHistory(currentOriginal, currentSummary, currentStyle);
    }
    
    hideLoading();
    displayResult(currentSummary);
    updateHistoryCount();
    
  } catch (error) {
    hideLoading();
    document.getElementById('result').innerHTML = `<div class="empty-state" style="color: #e74c3c;">总结失败: ${error.message}</div>`;
  }
}

async function callZhipuAPI(prompt, apiKey) {
  if (!apiKey) {
    throw new Error('请先配置智谱 AI API Key');
  }
  
  const response = await fetch(API_CONFIG.zhipu.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: API_CONFIG.zhipu.model,
      messages: [{ role: 'user', content: prompt }],
      stream: false
    })
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `请求失败: ${response.status}`);
  }
  
  const data = await response.json();
  return data.choices[0].message.content;
}

async function callOllamaAPI(prompt, modelName) {
  const model = modelName || 'llama3.2';
  
  try {
    const response = await fetch(API_CONFIG.ollama.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model,
        prompt: prompt,
        stream: false
      })
    });
    
    if (!response.ok) {
      throw new Error('Ollama 服务未启动或模型不存在');
    }
    
    const data = await response.json();
    return data.response;
  } catch (error) {
    if (error.message.includes('Failed to fetch')) {
      throw new Error('无法连接到 Ollama，请确认：1. Ollama 已安装并运行 2. 模型已下载');
    }
    throw error;
  }
}

async function saveToHistory(original, summary, style) {
  const result = await chrome.storage.local.get(['history']);
  let history = result.history || [];
  
  const newItem = {
    id: Date.now(),
    original: original.substring(0, 200) + (original.length > 200 ? '...' : ''),
    summary: summary,
    style: style,
    timestamp: new Date().toISOString()
  };
  
  history.unshift(newItem);
  if (history.length > 50) history = history.slice(0, 50);
  
  await chrome.storage.local.set({ history: history });
}

async function addToFavorites(original, summary, style) {
  const result = await chrome.storage.local.get(['favorites']);
  let favorites = result.favorites || [];
  
  const newItem = {
    id: Date.now(),
    original: original.substring(0, 300) + (original.length > 300 ? '...' : ''),
    fullOriginal: original,
    summary: summary,
    style: style,
    timestamp: new Date().toISOString()
  };
  
  favorites.unshift(newItem);
  if (favorites.length > 100) favorites = favorites.slice(0, 100);
  
  await chrome.storage.local.set({ favorites: favorites });
}

async function loadHistory() {
  const result = await chrome.storage.local.get(['history']);
  const history = result.history || [];
  const container = document.getElementById('historyList');
  
  if (history.length === 0) {
    container.innerHTML = '<div class="empty-state">暂无历史记录</div>';
    return;
  }
  
  container.innerHTML = history.map(item => {
    const date = new Date(item.timestamp);
    const timeStr = `${date.getMonth()+1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
    const preview = item.summary.substring(0, 60) + '...';
    
    return `
      <div class="history-item" data-id="${item.id}" data-type="history">
        <div class="history-header">
          <span class="history-style">${styleNames[item.style]}</span>
          <span class="history-time">${timeStr}</span>
        </div>
        <div class="history-preview">${preview}</div>
      </div>
    `;
  }).join('');
  
  document.querySelectorAll('#historyList .history-item').forEach(item => {
    item.addEventListener('click', () => showDetail(parseInt(item.dataset.id), 'history'));
  });
}

async function loadFavorites() {
  const result = await chrome.storage.local.get(['favorites']);
  const favorites = result.favorites || [];
  const container = document.getElementById('favoritesList');
  
  if (favorites.length === 0) {
    container.innerHTML = '<div class="empty-state">暂无收藏<br><br>在总结结果中点击"⭐ 收藏"按钮添加</div>';
    return;
  }
  
  container.innerHTML = favorites.map((item, index) => {
    const date = new Date(item.timestamp);
    const timeStr = `${date.getMonth()+1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
    const preview = item.summary.substring(0, 60) + '...';
    
    return `
      <div class="history-item favorite-item" data-index="${index}">
        <div class="history-header">
          <span class="history-style" style="background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);">⭐ ${styleNames[item.style]}</span>
          <span class="history-time">${timeStr}</span>
        </div>
        <div class="history-preview">${preview}</div>
      </div>
    `;
  }).join('');
  
  document.querySelectorAll('#favoritesList .history-item').forEach(item => {
    item.addEventListener('click', () => showDetail(parseInt(item.dataset.index), 'favorites'));
  });
}

async function showDetail(idOrIndex, type) {
  let item;
  
  if (type === 'history') {
    const result = await chrome.storage.local.get(['history']);
    item = (result.history || []).find(h => h.id === idOrIndex);
  } else {
    const result = await chrome.storage.local.get(['favorites']);
    item = (result.favorites || [])[idOrIndex];
  }
  
  if (!item) return;
  
  const originalText = type === 'favorites' ? (item.fullOriginal || item.original) : item.original;
  document.getElementById('modalOriginal').textContent = originalText;
  document.getElementById('modalSummary').innerHTML = formatResult(item.summary);
  document.getElementById('detailModal').classList.add('active');
}

function exportAsMarkdown() {
  const markdown = `# 速读助手总结\n\n## 原文\n${currentOriginal}\n\n## 总结 (${styleNames[currentStyle]})\n${currentSummary}\n\n---\n导出时间：${new Date().toLocaleString()}\n`;
  
  downloadFile(markdown, `summary_${Date.now()}.md`, 'text/markdown');
  showNotification('已导出 Markdown 文件！');
}

function exportAsTxt() {
  const txt = `原文：\n${currentOriginal}\n\n总结 (${styleNames[currentStyle]})：\n${currentSummary}\n\n导出时间：${new Date().toLocaleString()}\n`;
  
  downloadFile(txt, `summary_${Date.now()}.txt`, 'text/plain');
  showNotification('已导出 TXT 文件！');
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function showNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 2000);
}
