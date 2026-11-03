/* Pedidos em Aberto - mostra a FILIAL de cada pedido (coluna "Lj Embarque" do ERP)
   e permite filtrar por filial. Ex.: 26 -> Filial 01026, 52 -> Filial 01052 (empresa 01 + loja com 3 dígitos).
   O código só lê o que já está no painel (DATA); não altera dados. */
(function(){
  'use strict';
  function cod(lj){            /* Lj Embarque 26 -> filial 01026 (empresa 01 + loja de 3 dígitos) */
    var d = String(lj == null ? '' : lj).replace(/\D/g,'');
    if(!d) return '';
    return d.length >= 5 ? d : '01' + d.padStart(3,'0');
  }
  function num(v){ var n = parseFloat(String(v||'0').replace(/\./g,'').replace(',','.')); return isNaN(n) ? 0 : n; }
  function brl(n){ return n.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}); }
  function esc(t){ return String(t==null?'':t).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }

  var css = '\
  .pf-chip{display:inline-flex;align-items:center;gap:5px;margin-top:6px;padding:3px 10px;border-radius:20px;font-size:11.5px;font-weight:800;letter-spacing:.2px;border:1.5px solid;line-height:1.3}\
  .pf-0{background:rgba(255,200,0,.16);border-color:#e0b400;color:#e0b400}\
  .pf-1{background:rgba(255,64,64,.16);border-color:#f04a3c;color:#f04a3c}\
  .pf-2{background:rgba(70,140,255,.16);border-color:#4a8cff;color:#4a8cff}\
  .pf-3{background:rgba(60,180,110,.16);border-color:#3cb46e;color:#3cb46e}\
  body.light .pf-0{color:#8a6a00}\
  body.light .pf-1{color:#b3231a}\
  body.light .pf-2{color:#1f56b8}\
  body.light .pf-3{color:#1a7a45}\
  .pf-bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:0 0 12px}\
  .pf-btn{cursor:pointer;padding:7px 12px;border-radius:10px;border:1.5px solid var(--line,#444);background:transparent;color:inherit;font:700 12.5px inherit}\
  .pf-btn small{display:block;font-weight:600;opacity:.8;font-size:10.5px}\
  .pf-btn.on{background:var(--orange,#f12613);border-color:var(--orange,#f12613);color:#fff}\
  .pf-btn.on small{opacity:.95}\
  .pf-lbl{font-size:12px;opacity:.75;margin-right:2px}\
  .pedido-card[data-pf-hide="1"]{display:none!important}\
  .pedido-body .item.pf-item b,.pedido-body .item.pf-item span{color:inherit}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var filtro = '', vendAtual = null, ordem = [];

  function pedidosAtuais(){
    try{ var v = DATA[vendedorAtualDetalhe]; return v ? v.pedidos : []; }catch(e){ return []; }
  }
  function classe(c){ var i = ordem.indexOf(c); return 'pf-' + (i < 0 ? 0 : i % 4); }

  function aplicarFiltro(){
    var ps = pedidosAtuais(), vis = 0;
    document.querySelectorAll('#pedidosContainer .pedido-card').forEach(function(card){
      var idx = parseInt(String(card.id).replace('ped_',''), 10), p = ps[idx];
      var oculto = !!(filtro && p && cod(p.lj_embarque) !== filtro);
      if(oculto) card.setAttribute('data-pf-hide','1'); else { card.removeAttribute('data-pf-hide'); vis++; }
    });
    document.querySelectorAll('.pf-btn').forEach(function(b){ b.classList.toggle('on', b.getAttribute('data-f') === filtro); });
  }

  function montaBarra(){
    var ps = pedidosAtuais(), cont = document.getElementById('pedidosContainer');
    var old = document.getElementById('pfBar'); if(old) old.remove();
    if(!cont || !ps.length) return;
    var grupos = {};
    ps.forEach(function(p){
      var c = cod(p.lj_embarque) || '—';
      (grupos[c] = grupos[c] || {n:0, v:0}); grupos[c].n++; grupos[c].v += num(p.vl_total_pedido);
    });
    ordem = Object.keys(grupos).sort();
    var bar = document.createElement('div'); bar.id = 'pfBar'; bar.className = 'pf-bar';
    var h = '<span class="pf-lbl">Filial:</span><button class="pf-btn" data-f="">Todas<small>' + ps.length + ' pedido' + (ps.length===1?'':'s') + '</small></button>';
    ordem.forEach(function(c){
      h += '<button class="pf-btn" data-f="' + esc(c) + '">' + esc(c) + '<small>' + grupos[c].n + ' pedido' + (grupos[c].n===1?'':'s') + ' · R$ ' + brl(grupos[c].v) + '</small></button>';
    });
    bar.innerHTML = h;
    cont.parentNode.insertBefore(bar, cont);
    bar.addEventListener('click', function(e){
      var b = e.target.closest('.pf-btn'); if(!b) return;
      filtro = b.getAttribute('data-f'); aplicarFiltro();
    });
  }

  function decorar(){
    var ps = pedidosAtuais();
    document.querySelectorAll('#pedidosContainer .pedido-card').forEach(function(card){
      if(card.querySelector('.pf-chip')) return;
      var idx = parseInt(String(card.id).replace('ped_',''), 10), p = ps[idx]; if(!p) return;
      var c = cod(p.lj_embarque); if(!c) return;
      var alvo = card.querySelector('.pedido-head .left');
      if(alvo){
        var chip = document.createElement('div'); chip.className = 'pf-chip ' + classe(c); chip.textContent = '🏬 Filial ' + c;
        alvo.appendChild(chip);
      }
      card.querySelectorAll('.info-grid .item').forEach(function(it){
        var b = it.querySelector('b'), s = it.querySelector('span');
        if(b && s && /lj\s*embarque/i.test(b.textContent)){ b.textContent = 'Filial'; s.textContent = c; it.classList.add('pf-item'); }
      });
    });
  }

  function onMudanca(){
    var v = (typeof vendedorAtualDetalhe !== 'undefined') ? vendedorAtualDetalhe : null;
    if(v !== vendAtual){ vendAtual = v; filtro = ''; montaBarra(); }
    else if(!document.getElementById('pfBar')) montaBarra();
    decorar(); aplicarFiltro();
  }

  function init(){
    var cont = document.getElementById('pedidosContainer'); if(!cont) return;
    var t = null;
    try{ new MutationObserver(function(){ clearTimeout(t); t = setTimeout(onMudanca, 50); }).observe(cont, {childList:true}); }catch(e){}
    onMudanca();
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
