// Gallery page: replaces the placeholder cards with admin-managed photos when any exist.
(function(){
  function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
  fetch('/api/content/gallery').then(r=>r.json()).then(data=>{
    if(!data.ok||!data.items||!data.items.length) return;
    const grid=document.querySelector('.gallery-grid');
    const note=document.querySelector('.placeholder-note');
    if(!grid) return;
    if(note) note.remove();
    grid.innerHTML=data.items.map((item,i)=>{
      const cls=i===0?'gallery-item gallery-large':'gallery-item';
      const cap=[item.event,item.date].filter(Boolean).join(' · ');
      return `<figure class="${cls}"><img src="${esc(item.photoUrl||'')}" alt="${esc(item.event||'AARK event photo')}" loading="lazy">${cap?`<figcaption>${esc(cap)}</figcaption>`:''}</figure>`;
    }).join('');
  }).catch(()=>{});
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
