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
