/* Sahay, the AARK website assistant.
 *
 * Free by default: answers come from the built-in answer bank in
 * assets/js/sahay-answers.js (English, Hindi, Gujarati), matched in the browser.
 * If the site has an AI key (/api/public-config says assistantAi), questions the
 * answer bank can't handle go to /api/chat instead of the "call the school" reply.
 *
 * The conversation lives in sessionStorage only, so it clears when the tab closes. */
(function () {
  'use strict';
  if (window.__aarkChat) return;
  window.__aarkChat = true;

  var STORE = 'aark_chat_v2';
  var PHONE = '+91 99091 15550';
  var WELCOME = 'Namaste! I\'m Sahay, AARK\'s helper. Ask me about admissions, fees, age criteria, the curriculum, the campus or how to visit, in English, हिन्दी or ગુજરાતી.';
  // Sahay's face: a friendly robot in AARK colours (paper-white head, navy visor,
  // gold eyes and antenna light, purple ears). The eyes blink via CSS.
  var ROBOT = '<svg class="ac-bot" viewBox="0 0 48 48" aria-hidden="true">' +
    '<line x1="24" y1="5" x2="24" y2="11" stroke="#fbf7ef" stroke-width="2.4" stroke-linecap="round"/>' +
    '<circle class="ac-bot-light" cx="24" cy="5" r="3.4" fill="#fac803"/>' +
    '<rect x="4.5" y="20" width="4" height="10" rx="2" fill="#a37ebb"/><rect x="39.5" y="20" width="4" height="10" rx="2" fill="#a37ebb"/>' +
    '<rect x="8" y="11" width="32" height="28" rx="11" fill="#fbf7ef"/>' +
    '<rect x="12.5" y="17" width="23" height="15" rx="7" fill="#182033"/>' +
    '<g class="ac-bot-eyes"><ellipse cx="19.5" cy="23.5" rx="2.6" ry="3" fill="#fac803"/><ellipse cx="28.5" cy="23.5" rx="2.6" ry="3" fill="#fac803"/></g>' +
    '<path d="M20.5 28.2q3.5 2.4 7 0" fill="none" stroke="#fac803" stroke-width="1.8" stroke-linecap="round"/>' +
    '</svg>';
  // The floating mascot on the launcher: same robot with a body, a waving arm,
  // the AARK sun on its chest and a hover glow. All motion is CSS (see .ac-m-*).
  var MASCOT = '<svg class="ac-mascot-svg" viewBox="0 -12 120 162" aria-hidden="true">' +
    '<ellipse class="ac-m-shadow" cx="60" cy="142" rx="26" ry="5" fill="#182033" opacity=".22"/>' +
    '<g class="ac-m-float">' +
      '<ellipse class="ac-m-glow" cx="60" cy="128" rx="20" ry="6" fill="#fac803" opacity=".55"/>' +
      '<g class="ac-m-arm-l"><path d="M36 96L25 118" stroke="#a37ebb" stroke-width="11" stroke-linecap="round"/><circle cx="24" cy="121" r="7" fill="#fbf7ef"/></g>' +
      '<rect x="32" y="86" width="56" height="40" rx="18" fill="#4f256d"/>' +
      '<rect x="36" y="88" width="48" height="10" rx="5" fill="#fff" opacity=".12"/>' +
      '<g class="ac-m-badge"><circle cx="60" cy="107" r="8.5" fill="#fac803"/>' +
        '<g stroke="#fac803" stroke-width="2" stroke-linecap="round"><path d="M60 94.5v-2.5M60 119.5v2.5M47.5 107h-2.5M72.5 107h2.5M51.2 98.2l-1.8-1.8M68.8 115.8l1.8 1.8M51.2 115.8l-1.8 1.8M68.8 98.2l1.8-1.8"/></g>' +
        '<circle cx="60" cy="107" r="4" fill="#182033"/></g>' +
      '<rect x="53" y="78" width="14" height="10" rx="4" fill="#d9cfe2"/>' +
      '<g class="ac-m-head">' +
        '<line x1="60" y1="8" x2="60" y2="22" stroke="#d9cfe2" stroke-width="3" stroke-linecap="round"/>' +
        '<circle class="ac-m-light" cx="60" cy="8" r="5.5" fill="#fac803"/>' +
        '<rect x="14" y="38" width="9" height="20" rx="4.5" fill="#a37ebb"/><rect x="97" y="38" width="9" height="20" rx="4.5" fill="#a37ebb"/>' +
        '<rect x="20" y="20" width="80" height="60" rx="27" fill="#fbf7ef" stroke="#e7ded2" stroke-width="1.5"/>' +
        '<rect x="30" y="33" width="60" height="34" rx="16" fill="#182033"/>' +
        '<g class="ac-m-eyes"><ellipse cx="47" cy="48" rx="5.2" ry="6.2" fill="#fac803"/><ellipse cx="73" cy="48" rx="5.2" ry="6.2" fill="#fac803"/>' +
          '<circle cx="49" cy="45.5" r="1.7" fill="#fff"/><circle cx="75" cy="45.5" r="1.7" fill="#fff"/></g>' +
        '<path d="M52 58q8 6 16 0" fill="none" stroke="#fac803" stroke-width="3" stroke-linecap="round"/>' +
        '<circle cx="34" cy="62" r="3.6" fill="#f08a8a" opacity=".55"/><circle cx="86" cy="62" r="3.6" fill="#f08a8a" opacity=".55"/>' +
      '</g>' +
      '<g class="ac-m-arm-r"><path d="M84 96L106 70" stroke="#a37ebb" stroke-width="11" stroke-linecap="round"/><circle cx="108" cy="66" r="8" fill="#fbf7ef"/></g>' +
    '</g></svg>';
  function avatar(size) { return '<span class="ac-ava' + (size ? ' ac-ava-' + size : '') + '">' + ROBOT + '</span>'; }
  var ICON_X = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  var ICON_RESET = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 12a8.5 8.5 0 1 0 2.5-6"/><path d="M3.5 4v4h4"/></svg>';
  var ICON_SEND = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6"/></svg>';

  /* ---------- the free answer engine ---------- */

  function lang(text) {
    if (/[઀-૿]/.test(text)) return 'gu';
    if (/[ऀ-ॿ]/.test(text)) return 'hi';
    return 'en';
  }
  function norm(text) {
    return ' ' + String(text).toLowerCase().replace(/[^\p{L}\p{M}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim() + ' ';
  }
  // Latin words match on word starts ("fee*" also matches "fees"); Indian scripts
  // match anywhere, because suffixes attach to the word.
  function has(t, word) {
    var star = word.slice(-1) === '*';
    var w = (star ? word.slice(0, -1) : word).toLowerCase();
    if (!/[a-z0-9]/.test(w)) return t.indexOf(w) !== -1;
    return t.indexOf(' ' + w + (star ? '' : ' ')) !== -1;
  }
  function score(t, list) {
    var n = 0;
    (list || []).forEach(function (w) { if (has(t, w)) n += 1; });
    return n;
  }
  // Returns { kind: 'topic'|'greeting'|'thanks'|'unknown', id?, text, next[] }.
  function answer(bank, question) {
    var t = norm(question), l = lang(question), best = null, bestScore = 0;
    Object.keys(bank.topics).forEach(function (id) {
      var tp = bank.topics[id];
      var s = 2 * score(t, tp.strong) + score(t, tp.words);
      if (s > bestScore) { best = id; bestScore = s; }
    });
    if (best && bestScore >= 2) {
      var tp = bank.topics[best];
      return { kind: 'topic', id: best, text: tp[l] || tp.en, next: tp.next || [] };
    }
    if (score(t, bank.thanks.words)) return { kind: 'thanks', text: bank.thanks[l] || bank.thanks.en, next: [] };
    if (best && bestScore === 1) {               // one weak hint: answer it, but offer other topics too
      var weak = bank.topics[best];
      return { kind: 'topic', id: best, text: weak[l] || weak.en, next: bank.starters.filter(function (x) { return x !== best; }).slice(0, 3) };
    }
    if (score(t, bank.greeting.words)) return { kind: 'greeting', text: bank.greeting[l] || bank.greeting.en, next: bank.starters };
    return { kind: 'unknown', text: bank.unknown[l] || bank.unknown.en, next: bank.starters };
  }
  window.__sahayMatch = answer;   // exposed for tests

  var bankPromise = null;
  function loadBank() {
    if (window.SAHAY_ANSWERS) return Promise.resolve(window.SAHAY_ANSWERS);
    if (!bankPromise) {
      bankPromise = new Promise(function (resolve, reject) {
        var s = document.createElement('script');
        s.src = 'assets/js/sahay-answers.js';
        s.onload = function () { window.SAHAY_ANSWERS ? resolve(window.SAHAY_ANSWERS) : reject(new Error('no answers')); };
        s.onerror = function () { bankPromise = null; reject(new Error('answers failed to load')); };
        document.head.appendChild(s);
      });
    }
    return bankPromise;
  }
  var aiPromise = null;
  function aiEnabled() {
    if (!aiPromise) {
      aiPromise = fetch('/api/public-config', { credentials: 'same-origin' })
        .then(function (r) { return r.ok ? r.json() : {}; })
        .then(function (c) { return Boolean(c && c.assistantAi); })
        .catch(function () { return false; });
    }
    return aiPromise;
  }

  /* ---------- formatting (escape first, then add bullets, bold and links) ---------- */

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function linkify(s) {
    return s
      .replace(/(https:\/\/[^\s<)]+[^\s<).,;:!?।])/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')
      .replace(/(^|[\s(])(\/[a-z0-9-]+\.html(?:#[a-z0-9-]+)?)/gi, '$1<a href="$2">$2</a>')
      .replace(/\+91[\s-]?99091[\s-]?15550/g, '<a href="tel:+919909115550">' + PHONE + '</a>');
  }
  function inline(s) { return linkify(s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')); }
  function format(text) {
    var out = [], list = null;
    esc(text).split(/\n/).forEach(function (line) {
      var t = line.trim();
      var item = /^[-*•]\s+(.*)$/.exec(t);
      if (item) { (list = list || []).push('<li>' + inline(item[1]) + '</li>'); return; }
      if (list) { out.push('<ul>' + list.join('') + '</ul>'); list = null; }
      if (t) out.push('<p>' + inline(t) + '</p>');
    });
    if (list) out.push('<ul>' + list.join('') + '</ul>');
    return out.join('');
  }

  /* ---------- the chat window ---------- */

  function load() { try { var v = JSON.parse(sessionStorage.getItem(STORE) || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; } }
  function save() { try { sessionStorage.setItem(STORE, JSON.stringify(history.slice(-20))); } catch (e) { /* private mode: memory only */ } }

  var history = load();   // [{ role: 'user'|'assistant', content, next? }]
  var busy = false;
  var root = document.createElement('div');
  root.className = 'ac-root';
  root.innerHTML =
    '<button class="ac-launch" type="button" aria-expanded="false" aria-controls="ac-panel" aria-label="Ask Sahay, the AARK helper">' + MASCOT + '<span class="ac-label">Ask Sahay</span></button>' +
    '<div class="ac-nudge" hidden><button class="ac-nudge-open" type="button">Hi, I\'m <strong>Sahay</strong>! Need help with admissions or fees?</button><button class="ac-nudge-x" type="button" aria-label="Dismiss">' + ICON_X + '</button></div>' +
    '<section class="ac-panel" id="ac-panel" role="dialog" aria-modal="false" aria-labelledby="ac-title">' +
      '<header class="ac-head">' + avatar('head') +
        '<div class="ac-title"><strong id="ac-title">Sahay</strong><span class="ac-status"><i aria-hidden="true"></i>Online · AARK\'s helper for parents</span></div>' +
        '<button class="ac-icon-btn" type="button" data-reset aria-label="Start a new chat">' + ICON_RESET + '</button>' +
        '<button class="ac-icon-btn" type="button" data-close aria-label="Close chat">' + ICON_X + '</button></header>' +
      '<div class="ac-log" role="log" aria-live="polite" aria-relevant="additions"></div>' +
      '<div class="ac-chips"></div>' +
      '<form class="ac-form"><label class="ac-sr" for="ac-input">Your question</label>' +
        '<textarea class="ac-input" id="ac-input" rows="1" maxlength="800" placeholder="Type your question…" autocomplete="off"></textarea>' +
        '<button class="ac-send" type="submit" aria-label="Send">' + ICON_SEND + '</button></form>' +
      '<p class="ac-foot">Answers from AARK\'s published information. Please confirm important details with the school.</p>' +
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
    if (role === 'bot') {
      var row = document.createElement('div');
      row.className = 'ac-row';
      row.innerHTML = avatar('msg');
      row.appendChild(el);
      log.appendChild(row);
    } else {
      log.appendChild(el);
    }
    log.scrollTop = log.scrollHeight;
    return el;
  }
  function showChips(ids) {
    chips.innerHTML = '';
    var bank = window.SAHAY_ANSWERS;
    if (!bank) return;
    (ids || []).forEach(function (id) {
      var tp = bank.topics[id];
      if (!tp) return;
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'ac-chip'; b.textContent = tp.chip;
      b.addEventListener('click', function () { ask(tp.chip, id); });
      chips.appendChild(b);
    });
    log.scrollTop = log.scrollHeight;   // the chips take room from the log: keep the newest answer in view
  }
  function render() {
    log.innerHTML = '';
    bubble('bot', format(WELCOME));
    history.forEach(function (m) { bubble(m.role === 'user' ? 'user' : 'bot', format(m.content)); });
    loadBank().then(function (bank) {
      var last = history[history.length - 1];
      showChips(last && last.next ? last.next : bank.starters);
    }).catch(function () { /* chips are optional */ });
  }

  function open() {
    root.classList.add('is-open'); launch.setAttribute('aria-expanded', 'true');
    if (!log.childNodes.length) render();
    setTimeout(function () { input.focus(); }, 50);
  }
  function close() { root.classList.remove('is-open'); launch.setAttribute('aria-expanded', 'false'); launch.focus(); }

  // Streams an AI answer into `reply`. Resolves with the text, rejects on failure.
  async function askAi(reply) {
    var res = await fetch('/api/chat', {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history.slice(-12).map(function (m) { return { role: m.role, content: m.content }; }) })
    });
    if (!res.ok || !res.body) throw new Error('ai unavailable');
    var reader = res.body.getReader(), dec = new TextDecoder(), text = '';
    for (;;) {
      var r = await reader.read();
      if (r.done) break;
      text += dec.decode(r.value, { stream: true });
      reply.innerHTML = format(text);
      log.scrollTop = log.scrollHeight;
    }
    text = (text + dec.decode()).trim();
    if (!text) throw new Error('empty');
    return text;
  }

  async function ask(text, topicId) {
    text = (text || '').trim();
    if (!text || busy) return;
    busy = true; send.disabled = true; chips.innerHTML = '';
    history.push({ role: 'user', content: text });
    bubble('user', format(text));
    input.value = ''; resize();
    var reply = bubble('bot', '<span class="ac-typing-label">Sahay is typing</span><span class="ac-typing" aria-hidden="true"><i></i><i></i><i></i></span>');
    var bank = null, result;
    try {
      bank = await loadBank();
      result = topicId && bank.topics[topicId]
        ? { kind: 'topic', text: bank.topics[topicId][lang(text)] || bank.topics[topicId].en, next: bank.topics[topicId].next || [] }
        : answer(bank, text);
      if (result.kind === 'unknown' && await aiEnabled()) {
        try {
          result = { kind: 'ai', text: await askAi(reply), next: [] };
        } catch (e) { /* fall back to the built-in "call the school" reply */ }
      }
    } catch (e) {
      result = { kind: 'unknown', text: 'Sorry, I can\'t answer right now. Please call the school on ' + PHONE + ' (office 9:00 AM – 12:00 PM).', next: [] };
    }
    await new Promise(function (r) { setTimeout(r, result.kind === 'ai' ? 0 : 350); });   // a beat, so the reply doesn't feel abrupt
    reply.innerHTML = format(result.text);
    log.scrollTop = log.scrollHeight;
    history.push({ role: 'assistant', content: result.text, next: result.next });
    save();
    showChips(result.next);
    busy = false; send.disabled = false; input.focus();
  }

  function resize() { input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, 120) + 'px'; }

  // A one-time greeting beside the button, a few seconds after the page loads.
  var nudge = root.querySelector('.ac-nudge');
  var NUDGE = 'aark_sahay_nudged';
  function seen() { try { return sessionStorage.getItem(NUDGE) === '1'; } catch (e) { return true; } }
  function hideNudge() { nudge.hidden = true; try { sessionStorage.setItem(NUDGE, '1'); } catch (e) { /* ignore */ } }
  if (!seen() && !history.length) {
    setTimeout(function () { if (!seen() && !root.classList.contains('is-open')) nudge.hidden = false; }, 4000);
  }
  root.querySelector('.ac-nudge-open').addEventListener('click', function () { hideNudge(); open(); });
  root.querySelector('.ac-nudge-x').addEventListener('click', hideNudge);

  launch.addEventListener('click', function () { hideNudge(); open(); });
  root.querySelector('[data-close]').addEventListener('click', close);
  root.querySelector('[data-reset]').addEventListener('click', function () { history = []; save(); render(); input.focus(); });
  form.addEventListener('submit', function (e) { e.preventDefault(); ask(input.value); });
  input.addEventListener('input', resize);
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); ask(input.value); } });
  root.addEventListener('keydown', function (e) { if (e.key === 'Escape' && root.classList.contains('is-open')) close(); });
  document.querySelectorAll('[data-open-chat]').forEach(function (el) { el.addEventListener('click', function (e) { e.preventDefault(); open(); }); });
})();
