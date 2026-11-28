// Gallery page: photos added in the admin (Gallery tab, or "Add photos" in edit
// mode) appear first, newest first, ahead of the school's own photos.
(function(){
  function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
  const grid=document.querySelector('.gallery-grid');
  if(!grid) return;
  function render(items){
    grid.querySelectorAll('[data-admin-photo]').forEach(n=>n.remove());
    const html=items.filter(i=>i.photoUrl).slice().reverse().map(item=>{
      const cap=item.caption||[item.event,item.date].filter(Boolean).join(' · ');
      return `<figure class="gallery-item" data-admin-photo="${esc(item.id)}"><img src="${esc(item.photoUrl)}" alt="${esc(item.caption||item.event||'AARK school photo')}" loading="lazy" decoding="async">${cap?`<figcaption>${esc(cap)}</figcaption>`:''}</figure>`;
    }).join('');
    grid.insertAdjacentHTML('afterbegin',html);
  }
  function load(fresh){
    return fetch('/api/content/gallery'+(fresh?'?fresh=1':''),{credentials:'same-origin',cache:fresh?'no-store':'default'})
      .then(r=>r.json()).then(data=>{ if(data.ok&&Array.isArray(data.items)) render(data.items); }).catch(()=>{});
  }
  load(new URLSearchParams(location.search).has('edit'));
  window.AARKGallery={reload:()=>load(true)};
})();

// "Coming up": each event drops off the list the day after it happens, and the
// list hides itself once every event has passed.
(function(){
  const box=document.querySelector('.gallery-upcoming');
  if(!box) return;
  const d=new Date();
  const today=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  const items=[...box.querySelectorAll('li[data-date]')];
  items.forEach(li=>{ if(li.dataset.date<today) li.remove(); });
  if(items.length&&!box.querySelector('li')) box.hidden=true;
})();
