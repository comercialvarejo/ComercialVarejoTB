/* Tabela de Preços - botão para copiar o código do produto (o mesmo código que o Estoque copia,
   ex.: FRCSCANMI000052). Aparece na linha de detalhe de cada produto, depois que a tabela
   associa o item ao Estoque. Não altera preços nem dados. */
(function(){
  'use strict';
  var CLIP = String.fromCodePoint(128203), OK = String.fromCodePoint(9989);

  var css = '\
  .pc-desc{display:block;margin-top:2px;font-size:10.5px;font-weight:500;color:var(--ink-3,#8B8078);line-height:1.3;letter-spacing:.1px}\
  .name.priority-name .pc-desc{color:var(--green-dk,#14683a);opacity:.8}\
  body.dark .pc-desc{color:#A99C8C}\
  body.dark .name.priority-name .pc-desc{color:#9FE6B8}\
  .name.pc-ok[data-est]::after{display:none!important}\
  .pc-copy{display:inline-flex;align-items:center;justify-content:center;margin-left:6px;width:22px;height:22px;border-radius:6px;\
    border:1px solid var(--line,#ddd);background:var(--white,#fff);color:var(--ink-3,#8B8078);font-size:11px;cursor:pointer;vertical-align:middle;padding:0;line-height:1}\
  .pc-copy:hover{border-color:var(--red,#c4261a);color:var(--red,#c4261a)}\
  .pc-copy:active{transform:scale(.9)}\
  @media print{.pc-copy{display:none!important}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  function fallbackCopy(t){
    var ta = document.createElement('textarea'); ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try{ document.execCommand('copy'); }catch(e){}
    document.body.removeChild(ta);
  }
  function copiar(code, btn){
    var feito = function(){ btn.textContent = OK; setTimeout(function(){ btn.textContent = CLIP; }, 1200); };
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(code).then(feito).catch(function(){ fallbackCopy(code); feito(); });
    } else { fallbackCopy(code); feito(); }
  }

  function aplicar(){
    document.querySelectorAll('.name[data-est]').forEach(function(nm){
      var est = nm.getAttribute('data-est') || '';
      var partes = est.split(' · ');
      var code = (partes[1] || '').trim();
      if(!/^[A-Z]+\d+$/.test(code)) return;
      var antigo = nm.querySelector('.pc-desc');
      if(antigo && antigo.getAttribute('data-src') === est) return;      /* já está certo */
      if(antigo) antigo.remove();
      var d = document.createElement('span'); d.className = 'pc-desc'; d.setAttribute('data-src', est);
      d.appendChild(document.createTextNode(est));
      var b = document.createElement('button'); b.type = 'button'; b.className = 'pc-copy'; b.title = 'Copiar código ' + code; b.textContent = CLIP;
      b.addEventListener('click', function(ev){ ev.stopPropagation(); ev.preventDefault(); copiar(code, b); });
      d.appendChild(b); nm.appendChild(d); nm.classList.add('pc-ok');
    });
  }

  function init(){
    aplicar();
    var t = null;
    try{
      new MutationObserver(function(){ clearTimeout(t); t = setTimeout(aplicar, 80); })
        .observe(document.body, {attributes:true, attributeFilter:['data-est'], subtree:true});
    }catch(e){}
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
