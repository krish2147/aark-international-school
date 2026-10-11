// Admissions page: admin-managed fee rows and active admission schemes.
(function(){
  function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
  fetch('/api/content/fees').then(r=>r.json()).then(data=>{
    if(!data.ok||!data.items||!data.items.length) return;
    const table=document.getElementById('fee-table');
    if(!table) return;
    const headerRow=table.querySelector('tr');
    const rows=data.items.map(i=>`<tr><td>${esc(i.className)}</td><td>${esc(i.amount)}</td></tr>`).join('');
    table.innerHTML='';
    table.appendChild(headerRow);
    table.insertAdjacentHTML('beforeend', rows);
  }).catch(()=>{});
  fetch('/api/content/schemes').then(r=>r.json()).then(data=>{
    if(!data.ok||!data.items) return;
    const active=data.items.filter(i=>i.active);
    if(!active.length) return;
    const section=document.getElementById('schemes');
    const list=section.querySelector('.scheme-list');
    list.innerHTML=active.map(i=>`<div style="padding:16px;border:1px solid var(--line);border-radius:14px"><strong>${esc(i.title)}</strong><p style="margin:6px 0 0;color:var(--muted)">${esc(i.description)}</p></div>`).join('');
    section.hidden=false;
  }).catch(()=>{});
})();
