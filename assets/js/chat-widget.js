/* Sahay, the AARK website assistant. Talks to /api/chat (streamed plain text).
   The conversation lives in sessionStorage only, so it clears when the tab closes. */
(function () {
  'use strict';
  if (window.__aarkChat) return;
  window.__aarkChat = true;

  var STORE = 'aark_chat_v1';
  var PHONE = '+91 99091 15550';
  var WELCOME = 'Namaste! I\'m Sahay, AARK\'s helper. I can answer questions about AARK International School: admissions, fees, age criteria, the curriculum, the campus and how to visit. Ask in English, हिन्दी or ગુજરાતી.';
  var CHIPS = [
    ['Fees for 2026–27', 'What are the fees for 2026–27?'],
    ['Age criteria', 'What is the age criteria for Nursery and KG?'],
    ['How to apply', 'How do I apply for admission?'],
    ['Book a visit', 'How can I book a campus visit?'],
    ['Transport', 'Is school transport available?']
  ];
  var ICON_SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/></svg>';
  var ICON_X = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  var ICON_RESET = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 12a8.5 8.5 0 1 0 2.5-6"/><path d="M3.5 4v4h4"/></svg>';
  var ICON_SEND = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6"/></svg>';

  function load() { try { var v = JSON.parse(sessionStorage.getItem(STORE) || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; } }
  function save() { try { sessionStorage.setItem(STORE, JSON.stringify(history.slice(-20))); } catch (e) { /* private mode: keep in memory */ } }

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  // Tiny, safe formatter: escape everything, then add bold, bullets, links and the phone number.
  function linkify(s) {
    return s
      .replace(/(https:\/\/[^\s<)]+[^\s<).,;:!?])/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')
      .replace(/(^|[\s(])(\/[a-z0-9-]+\.html(?:#[a-z0-9-]+)?)/gi, '$1<a href="$2">$2</a>')
      .replace(/\+91[\s-]?99091[\s-]?15550/g, '<a href="tel:+919909115550">' + PHONE + '</a>');
  }
  function format(text) {
    var out = [], list = null;
    esc(text).split(/\n/).forEach(function (line) {
      var t = line.trim();
      var item = /^[-*•]\s+(.*)$/.exec(t);
      if (item) { if (!list) { list = []; } list.push('<li>' + inline(item[1]) + '</li>'); return; }
      if (list) { out.push('<ul>' + list.join('') + '</ul>'); list = null; }
      if (t) out.push('<p>' + inline(t) + '</p>');
    });
    if (list) out.push('<ul>' + list.join('') + '</ul>');
    return out.join('');
  }
  function inline(s) { return linkify(s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')); }

  var history = load();
  var busy = false;
  var root = document.createElement('div');
  root.className = 'ac-root';
  root.innerHTML =
    '<button class="ac-launch" type="button" aria-expanded="false" aria-controls="ac-panel" aria-label="Ask Sahay, the AARK helper"><span class="ac-sun">' + ICON_SUN + '</span><span class="ac-label">Ask Sahay</span></button>' +
    '<section class="ac-panel" id="ac-panel" role="dialog" aria-modal="false" aria-labelledby="ac-title">' +
      '<header class="ac-head"><span class="ac-sun">' + ICON_SUN + '</span>' +
        '<div class="ac-title"><strong id="ac-title">Sahay</strong><span>AARK\'s helper for parents</span></div>' +
        '<button class="ac-icon-btn" type="button" data-reset aria-label="Start a new chat">' + ICON_RESET + '</button>' +
        '<button class="ac-icon-btn" type="button" data-close aria-label="Close chat">' + ICON_X + '</button></header>' +
      '<div class="ac-log" role="log" aria-live="polite" aria-relevant="additions"></div>' +
      '<div class="ac-chips"></div>' +
      '<form class="ac-form"><label class="ac-sr" for="ac-input">Your question</label>' +
        '<textarea class="ac-input" id="ac-input" rows="1" maxlength="800" placeholder="Type your question…" autocomplete="off"></textarea>' +
        '<button class="ac-send" type="submit" aria-label="Send">' + ICON_SEND + '</button></form>' +
      '<p class="ac-foot">AI assistant using AARK\'s published information. Please confirm important details with the school.</p>' +
    '</section>';
  document.body.appendChild(root);

  var launch = root.querySelector('.ac-launch');
  var log = root.querySelector('.ac-log');
  var chips = root.querySelector('.ac-chips');
  var form = root.querySelector('.ac-form');
  var input = root.querySelector('.ac-input');
  var send = root.querySelector('.ac-send');

  function bubble(role, html, extra) {
    var el = document.createElement('div');
    el.className = 'ac-msg ' + role + (extra ? ' ' + extra : '');
    el.innerHTML = html;
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
    return el;
  }
  function render() {
    log.innerHTML = '';
    bubble('bot', format(WELCOME));
    history.forEach(function (m) { bubble(m.role === 'user' ? 'user' : 'bot', format(m.content)); });
    chips.innerHTML = '';
    if (!history.length) {
      CHIPS.forEach(function (c) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'ac-chip'; b.textContent = c[0];
        b.addEventListener('click', function () { ask(c[1]); });
        chips.appendChild(b);
      });
    }
  }

  function open() { root.classList.add('is-open'); launch.setAttribute('aria-expanded', 'true'); if (!log.childNodes.length) render(); setTimeout(function () { input.focus(); }, 50); }
  function close() { root.classList.remove('is-open'); launch.setAttribute('aria-expanded', 'false'); launch.focus(); }

  async function ask(text) {
    text = (text || '').trim();
    if (!text || busy) return;
    busy = true; send.disabled = true; chips.innerHTML = '';
    history.push({ role: 'user', content: text }); save();
    bubble('user', format(text));
    input.value = ''; resize();
    var reply = bubble('bot', '<span class="ac-typing" aria-label="Typing"><i></i><i></i><i></i></span>');
    var answer = '';
    try {
      var res = await fetch('/api/chat', {
        method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history.slice(-12) })
      });
      if (!res.ok || !res.body) {
        var err = {}; try { err = await res.json(); } catch (e) { /* not JSON */ }
        throw new Error(err.error || ('Please call the school on ' + PHONE + '.'));
      }
      var reader = res.body.getReader(), dec = new TextDecoder();
      for (;;) {
        var r = await reader.read();
        if (r.done) break;
        answer += dec.decode(r.value, { stream: true });
        reply.innerHTML = format(answer);
        log.scrollTop = log.scrollHeight;
      }
      answer += dec.decode();
      answer = answer.trim();
      if (!answer) throw new Error('Please call the school on ' + PHONE + '.');
      reply.innerHTML = format(answer);
      history.push({ role: 'assistant', content: answer }); save();
    } catch (e) {
      history.pop(); save();   // keep the history valid: the unanswered question is dropped
      reply.className = 'ac-msg bot is-error';
      reply.innerHTML = format(e.message || ('Please call the school on ' + PHONE + '.'));
    } finally {
      busy = false; send.disabled = false; input.focus();
    }
  }

  function resize() { input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, 120) + 'px'; }

  launch.addEventListener('click', open);
  root.querySelector('[data-close]').addEventListener('click', close);
  root.querySelector('[data-reset]').addEventListener('click', function () { history = []; save(); render(); input.focus(); });
  form.addEventListener('submit', function (e) { e.preventDefault(); ask(input.value); });
  input.addEventListener('input', resize);
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); ask(input.value); } });
  root.addEventListener('keydown', function (e) { if (e.key === 'Escape' && root.classList.contains('is-open')) close(); });
  document.querySelectorAll('[data-open-chat]').forEach(function (el) { el.addEventListener('click', function (e) { e.preventDefault(); open(); }); });
})();
