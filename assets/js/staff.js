// Staff page: replaces the published Principal / Counsellor cards with the admin-managed directory when it has entries.
(function(){
  function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
  fetch('/api/content/staff').then(r=>r.json()).then(data=>{
    if(!data.ok||!data.items||!data.items.length) return;
    const grid=document.querySelector('.staff-grid');
    const note=document.querySelector('.staff-more');
    if(!grid) return;
    if(note) note.remove();
    grid.innerHTML=data.items.map(item=>{
      const initial=(item.name||'?').trim().charAt(0).toUpperCase();
      const avatar=item.photoUrl
        ? `<img src="${esc(item.photoUrl)}" alt="${esc(item.name||'')}" style="width:86px;height:86px;border-radius:50%;object-fit:cover;margin:0 auto 16px;display:block">`
        : `<div class="staff-avatar">${esc(initial)}</div>`;
      return `<article class="staff-card">${avatar}<h3>${esc(item.name||'')}</h3><p class="role">${esc(item.role||'')}</p><p class="bio">${esc(item.bio||'')}</p></article>`;
    }).join('');
  }).catch(()=>{});
})();
