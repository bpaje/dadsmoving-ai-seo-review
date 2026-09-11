(function(){
  const key='dadsmoving-ai-seo-notes';
  const apply=(show)=>{document.body.classList.toggle('ai-review-notes-off',!show);document.querySelectorAll('[data-ai-notes-toggle]').forEach(i=>{i.checked=show;i.setAttribute('aria-checked',String(show));});};
  let show=true;try{show=localStorage.getItem(key)!=='off';}catch{}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>apply(show));else apply(show);
  document.addEventListener('change',(event)=>{if(!event.target.matches('[data-ai-notes-toggle]'))return;show=event.target.checked;try{localStorage.setItem(key,show?'on':'off');}catch{}apply(show);});
})();
