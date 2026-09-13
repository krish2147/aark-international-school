const stageData={
  early:{image:'https://theaarkinternational.com/wp-content/uploads/2024/06/Student-Life.jpg',kicker:'EARLY YEARS',title:'A strong start for a bright future.',body:'At this stage, the focus is on helping children feel secure in school, participate, communicate, explore through activity and build the foundations for later learning.',points:['Social confidence','Curiosity & play','Early learning habits','Growing independence']},
  primary:{image:'https://theaarkinternational.com/wp-content/uploads/2024/07/Campus31.jpg',kicker:'PRIMARY YEARS · GRADES 1–5',title:'Strong foundations children can use for themselves.',body:'Primary years gradually move children from guided learning towards stronger understanding, communication, problem solving and the confidence to explain their thinking.',points:['Core foundations','Communication','Collaboration','Growing independence']},
  middle:{image:'https://theaarkinternational.com/wp-content/uploads/2024/07/Campus32.jpg',kicker:'MIDDLE SCHOOL · GRADES 6–8',title:'A stage for connecting ideas and discovering interests.',body:'Middle school bridges children towards greater independence, deeper reasoning, better organisation and the confidence to explore where their interests are developing.',points:['Connecting ideas','Independent habits','Collaboration','Exploring interests']},
  secondary:{image:'https://theaarkinternational.com/wp-content/uploads/2024/07/Campus4.jpg',kicker:'SECONDARY SCHOOL · GRADES 9–10',title:'Deeper learning. Greater responsibility.',body:'Secondary school can place greater emphasis on disciplined learning, problem solving, reflection and taking ownership of preparation and progress within the CBSE journey.',points:['Deeper understanding','Responsibility','Problem solving','Reflection']},
  senior:{image:'https://theaarkinternational.com/wp-content/uploads/2024/07/Campus5.jpg',kicker:'SENIOR SECONDARY · GRADES 11–12',title:'Preparing thoughtfully for what comes after school.',body:'This section intentionally avoids listing streams or subjects until AARK confirms the current Grade 11–12 offering. The focus remains independence, responsibility and readiness for next steps.',points:['Independent thinking','Decision-making','Responsibility','Next-step readiness']}
};
const growthData=[
  'A child begins by feeling safe enough to participate, explore, communicate and build confidence in the rhythm of school.',
  'Foundational skills become more connected as children learn to explain ideas, work with others and take greater ownership of simple tasks.',
  'Students can begin linking concepts, managing more responsibility and discovering where their interests and strengths are developing.',
  'Learning demands deeper understanding, organisation and independent thinking while students prepare for important academic milestones.',
  'The school journey should culminate in greater independence, responsibility and readiness to make informed choices about what comes next.'
];

const menuButton=document.querySelector('.menu-toggle');
const mobileMenu=document.querySelector('#mobile-menu');
menuButton?.addEventListener('click',()=>{
  const open=menuButton.getAttribute('aria-expanded')==='true';
  menuButton.setAttribute('aria-expanded',String(!open));
  mobileMenu.hidden=open;
  menuButton.setAttribute('aria-label',open?'Open menu':'Close menu');
});
mobileMenu?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{mobileMenu.hidden=true;menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','Open menu')}));

const journeyPanel=document.querySelector('#journey-panel');
const journeyLayout=document.querySelector('.journey-layout');
const journeyTabs=document.querySelector('.journey-tabs');

function renderJourney(tab){
  document.querySelectorAll('.journey-tab').forEach(t=>{t.classList.remove('active');t.setAttribute('aria-selected','false')});
  tab.classList.add('active');tab.setAttribute('aria-selected','true');
  const d=stageData[tab.dataset.stage];
  journeyPanel.innerHTML=`<div class="journey-stage-copy"><p class="panel-kicker">${d.kicker}</p><h3>${d.title}</h3><p>${d.body}</p><div class="panel-points">${d.points.map(p=>`<span>${p}</span>`).join('')}</div></div><div class="journey-stage-image"><img src="${d.image}" alt="AARK school life" loading="lazy"></div>`;
  positionJourneyPanel();
}
function positionJourneyPanel(){
  const active=document.querySelector('.journey-tab.active');
  if(!active || !journeyPanel || !journeyLayout || !journeyTabs) return;
  if(window.matchMedia('(max-width: 640px)').matches){
    active.insertAdjacentElement('afterend',journeyPanel);
  }else{
    journeyLayout.appendChild(journeyPanel);
  }
}
document.querySelectorAll('.journey-tab').forEach(tab=>tab.addEventListener('click',()=>renderJourney(tab)));
window.addEventListener('resize',positionJourneyPanel,{passive:true});
positionJourneyPanel();

const growthFill=document.querySelector('#growth-fill');
const growthDetail=document.querySelector('#growth-detail');
document.querySelectorAll('.growth-step').forEach((step,i)=>step.addEventListener('click',()=>{
  document.querySelectorAll('.growth-step').forEach(s=>s.classList.remove('active'));step.classList.add('active');
  growthFill.style.width=`${i/(growthData.length-1)*100}%`;growthDetail.textContent=growthData[i];
}));

const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target)}}),{threshold:.12});
document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));

const enquiry=document.querySelector('#enquiry');
enquiry?.addEventListener('submit',e=>{
  e.preventDefault();
  if(!enquiry.reportValidity()) return;
  const fd=new FormData(enquiry);
  const subject=encodeURIComponent(`${fd.get('intent')} — ${fd.get('grade')}`);
  const body=encodeURIComponent(`Parent / Guardian: ${fd.get('parentName')}\nMobile: ${fd.get('phone')}\nEmail: ${fd.get('email')}\nGrade / Stage: ${fd.get('grade')}\nRequest: ${fd.get('intent')}\n\nSent from the AARK website demo enquiry form.`);
  window.location.href=`mailto:admissions@theaarkinternational.com?subject=${subject}&body=${body}`;
});


const resourceModal=document.querySelector('#resource-modal');
document.querySelectorAll('.resource-popup-open').forEach(btn=>btn.addEventListener('click',()=>resourceModal?.showModal()));
document.querySelector('.modal-close')?.addEventListener('click',()=>resourceModal?.close());
resourceModal?.addEventListener('click',e=>{if(e.target===resourceModal) resourceModal.close()});


// Replacement v3 grouped navigation
const dropButtons=document.querySelectorAll('.nav-drop-button');
dropButtons.forEach(btn=>{
  btn.addEventListener('click',e=>{
    e.preventDefault();
    const wrap=btn.closest('.nav-dropdown');
    const open=wrap.classList.toggle('menu-open');
    btn.setAttribute('aria-expanded',String(open));
    document.querySelectorAll('.nav-dropdown').forEach(other=>{if(other!==wrap){other.classList.remove('menu-open');other.querySelector('.nav-drop-button')?.setAttribute('aria-expanded','false')}});
  });
});
document.addEventListener('click',e=>{if(!e.target.closest('.nav-dropdown')) document.querySelectorAll('.nav-dropdown').forEach(d=>{d.classList.remove('menu-open');d.querySelector('.nav-drop-button')?.setAttribute('aria-expanded','false')})});


// Add a subtle elevated state once the sticky navigation starts following the page.
const siteHeader = document.querySelector('.site-header');
function updateStickyHeader(){
  if(!siteHeader) return;
  siteHeader.classList.toggle('is-scrolled', window.scrollY > 12);
}
window.addEventListener('scroll', updateStickyHeader, {passive:true});
updateStickyHeader();

console.info('AARK website build v7 - unified navigation loaded');

const fixedHeader = document.querySelector('.site-header');
function syncHeaderState(){
  if(!fixedHeader) return;
  fixedHeader.classList.toggle('is-scrolled', window.scrollY > 8);
}
window.addEventListener('scroll', syncHeaderState, {passive:true});
syncHeaderState();


// v10Header: shadow state for the sticky white navigation only.
const v10Header=document.querySelector('.site-header');
function v10HeaderState(){ if(v10Header) v10Header.classList.toggle('is-scrolled', window.scrollY>40); }
window.addEventListener('scroll',v10HeaderState,{passive:true});
v10HeaderState();


// v11 robust navigation follower.
// Purple information bar scrolls away. White navigation locks to viewport after it reaches the top.
(function(){
  const header = document.querySelector('.site-header');
  if(!header) return;

  let spacer = document.querySelector('.nav-spacer');
  if(!spacer){
    spacer = document.createElement('div');
    spacer.className = 'nav-spacer';
    header.insertAdjacentElement('afterend', spacer);
  }

  let triggerY = 0;

  function measure(){
    // Temporarily release it to measure its real document position.
    const wasFollowing = header.classList.contains('nav-following');
    if(wasFollowing){
      header.classList.remove('nav-following');
      spacer.classList.remove('active');
    }

    const rect = header.getBoundingClientRect();
    triggerY = rect.top + window.scrollY;
    const h = header.offsetHeight;
    spacer.style.height = h + 'px';
    document.documentElement.style.setProperty('--nav-current-h', h + 'px');

    if(wasFollowing) update();
  }

  function update(){
    const shouldFollow = window.scrollY >= triggerY;
    if(shouldFollow){
      const h = header.offsetHeight;
      spacer.style.height = h + 'px';
      spacer.classList.add('active');
      header.classList.add('nav-following');
      document.documentElement.style.setProperty('--nav-current-h', h + 'px');
    }else{
      header.classList.remove('nav-following');
      spacer.classList.remove('active');
    }
  }

  // Initial measure after layout/fonts/images settle.
  window.addEventListener('load', ()=>{ measure(); update(); });
  window.addEventListener('resize', ()=>{ measure(); update(); }, {passive:true});
  window.addEventListener('scroll', update, {passive:true});
  setTimeout(()=>{ measure(); update(); }, 50);
})();

// v13 — visually identify the page/section the visitor is currently on.
(function(){
  const file=(location.pathname.split('/').pop()||'index.html').toLowerCase();
  const nav=document.querySelector('.site-header');
  if(!nav) return;
  const mark=(selector)=>{
    nav.querySelectorAll(selector).forEach(el=>{
      el.classList.add('active');
      if(el.tagName==='A') el.setAttribute('aria-current','page');
    });
  };
  if(file==='admissions.html') mark('a[href*="admissions.html"], .nav-drop-button[data-menu="admissions"]');
  else if(file==='careers.html') mark('a[href*="careers.html"]');
  else if(['disclosures.html','circulars.html','policies.html'].includes(file)) mark('.nav-drop-button[data-menu="resources"], a[href*="'+file+'"]');
  else if(file==='campus-detail.html') mark('.nav-drop-button[data-menu="campus"]');
})();
