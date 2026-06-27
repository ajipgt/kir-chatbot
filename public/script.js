const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');

// Riwayat percakapan untuk multi-turn context
const conversation = [];

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const userMessage = input.value.trim();
  if (!userMessage) return;

  appendMessage('user', userMessage);
  conversation.push({ role: 'user', text: userMessage });
  input.value = '';

  const submitBtn = form.querySelector('button');
  submitBtn.disabled = true;

  const thinkingEl = appendMessage('bot', 'Sedang memproses...', true);

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversation }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data && data.result) {
      thinkingEl.innerHTML = parseMarkdown(data.result);
      thinkingEl.classList.remove('thinking');
      conversation.push({ role: 'model', text: data.result });
    } else {
      thinkingEl.innerHTML = 'Maaf, tidak ada respons yang diterima.';
      thinkingEl.classList.remove('thinking');
    }
  } catch (err) {
    console.error('Fetch error:', err);
    thinkingEl.innerHTML = 'Gagal terhubung ke server. Coba lagi.';
    thinkingEl.classList.remove('thinking');
  } finally {
    submitBtn.disabled = false;
    chatBox.scrollTop = chatBox.scrollHeight;
  }
});

/**
 * Parse markdown: heading, bold, italic, list, newline
 * @param {string} text
 * @returns {string} HTML string
 */
function parseMarkdown(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^\s*[\*\-] (.+)$/gm, '<li>$1</li>')
    .replace(/^\s*\d+\. (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`)
    .replace(/(?<!>)\n(?!<)/g, '<br>');
}

/**
 * Tambah bubble pesan ke chat box
 * @param {'user' | 'bot'} sender
 * @param {string} text
 * @param {boolean} isThinking
 * @returns {HTMLElement} elemen bubble
 */
function appendMessage(sender, text, isThinking = false) {
  const messageEl = document.createElement('div');
  messageEl.classList.add('message', sender);

  const bubble = document.createElement('div');
  bubble.classList.add('bubble');
  if (isThinking) bubble.classList.add('thinking');
  bubble.innerHTML = parseMarkdown(text);

  messageEl.appendChild(bubble);
  chatBox.appendChild(messageEl);
  chatBox.scrollTop = chatBox.scrollHeight;

  return bubble;
}