/* Caixas por pallet - painéis Estoque Terra Boa e Estoque Apucarana
   Mostra, em cada card, um selo "📦 N cx/pallet" embaixo do saldo em kg
   (passando o mouse, mostra também o peso aproximado do pallet).

   COMO ATUALIZAR: edite a lista abaixo (uma linha por produto) e salve no GitHub.
     "CÓDIGO DO PRODUTO": caixas_por_pallet,
   O código pode ser o do estoque (ex.: COMPRO000009) ou o Cód. Canção (ex.: 67983).
   Produto que não estiver na lista simplesmente não mostra o selo.
   Fonte: tabela de pallets (WhatsApp) de 26/10/2026. */
(function(){
  'use strict';
  var PALLET_CX = {
    /* Cebola */
    "COMPRO000009": 60,  /* Anéis de cebola 11 kg - 67983 */
    "COMPRO000074": 90,  /* Anéis de cebola 6,6 kg - 91373 */
    /* Batata */
    "COMPRO000069": 96,  /* Batata palito 1,1 kg - 91330 */
    "COMPRO000067": 96,  /* Batata palito 2 kg - 91328 */
    "COMPRO000068": 96,  /* Batata palito 400 g - 91329 */
    /* Bolinho */
    "COMPRO000097": 154, /* Bolinho de tilápia 300 g - 91413 */
    /* Galinha - cortes e miúdos */
    "COMPRO000086": 60,  /* Coxa e sobrecoxa c/ porção dorsal 18 kg - 91360 */
    "COMPRO000085": 60,  /* Filé de peito 18 kg - 91358 */
    "COMPRO000088": 65,  /* Pés 15 kg - 91362 */
    "COMPRO000090": 65,  /* Miúdos coração 18 kg - 91364 */
    "COMPRO000089": 65,  /* Miúdos moela 18 kg - 91363 */
    /* Empanados */
    "COMPRO000100": 100, /* Empanado de frango Fut Chicken 1 kg - 91410 */
    "COMPRO000099": 192, /* Empanado de frango Fut Chicken 300 g - 91409 */
    "COMPRO000066": 100, /* Empanado de frango 1 kg - 91327 */
    "COMPRO000065": 192, /* Empanado de frango 300 g - 91326 */
    "COMPRO000101": 192, /* Empanado de tilápia 400 g - 91411 */
    "COMPRO000102": 80,  /* Empanado de tilápia 1,5 kg - 91412 */
    "COMPRO000064": 100, /* Filezinho de frango empanado 1 kg - 91325 */
    "COMPRO000008": 100, /* Filezinho de frango empanado 700 g - 67772 */
    /* Lasanha */
    "COMPRO000094": 96,  /* Lasanha bolonhesa 600 g - 91415 */
    "COMPRO000096": 96,  /* Lasanha de frango 600 g - 91414 */
    "COMPRO000095": 96,  /* Lasanha quatro queijos 600 g - 91416 */
    /* Mandioca, pão de queijo, polenta */
    "COMPRO000003": 60,  /* Mandioca tolete 1 kg - 53245 */
    "COMPRO000081": 72,  /* Pão de queijo 300 g - 91375 */
    "COMPRO000082": 72,  /* Pão de queijo 800 g - 91374 */
    "COMPRO000059": 60,  /* Polenta palito 1 kg - 91268 */
    /* Copa do Mundo */
    "COMPRO000119": 154, /* Bolinho de frango Fut Chicken recheio cremoso 300 g - 91455 */
    "COMPRO000116": 90,  /* Sanduíche Fut Burguer picles - 91452 */
    "COMPRO000118": 90,  /* Sanduíche Fut Burguer maionese grill - 91454 */
    "COMPRO000117": 90,  /* Sanduíche Fut Burguer bacon - 91453 */
    "COMPRO000121": 100, /* Coxinha da asa empanada tradicional Fut Wings - 91450 */
    "COMPRO000123": 100, /* Coxinha da asa empanada apimentada Fut Wings - 91451 */
    "COMPRO000134": 100, /* Coxinha da asa empanada tradicional Fut Wings (novo código) */
    "COMPRO000135": 100  /* Coxinha da asa empanada apimentada Fut Wings (novo código) */
  };

  function $(s, r){ return (r||document).querySelector(s); }
  function fmt(n){ return n.toLocaleString('pt-BR', {maximumFractionDigits:1}); }

  var css = '\
  .pl-under{display:inline-flex;align-items:center;gap:6px;margin:6px 22px 0 0;padding:3px 10px;border-radius:20px;\
    background:var(--surface,#fff);border:1.5px solid var(--line,#cfc4b4);color:var(--ink,#241B15);\
    font-family:var(--mono,ui-monospace,monospace);font-size:11px;font-weight:800;line-height:1.3;white-space:nowrap}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  function cxPorPallet(card){
    var cd = $('.card-code', card), ca = $('.card-cancao', card);
    var cod = cd ? (cd.textContent.match(/^\s*([A-Z]+\d+)/) || [])[1] : '';
    var can = ca ? (ca.textContent.match(/(\d{3,})/) || [])[1] : '';
    var n = (cod && PALLET_CX[cod]) || (can && PALLET_CX[can]) || 0;
    var kgCx = 0;
    if(cd){ var m = cd.textContent.match(/Cx\s*([\d.,]+)\s*kg/i); if(m) kgCx = parseFloat(m[1].replace(/\./g,'').replace(',','.')); }
    return {n:n, kg: (n && kgCx) ? n*kgCx : 0};
  }

  function mk(p){
    var d = document.createElement('div'); d.className = 'pl-under';
    d.title = p.n + ' caixas por pallet' + (p.kg ? ' (aprox. ' + fmt(p.kg) + ' kg)' : '');
    d.textContent = '📦 ' + p.n + ' cx/pallet';
    return d;
  }

  function aplicar(){
    document.querySelectorAll('.card').forEach(function(card){
      if(card.querySelector('.pl-under')) return;
      var p = cxPorPallet(card); if(!p.n) return;
      var stock = $('.card-stock', card); if(!stock) return;
      stock.appendChild(mk(p));
    });
  }

  function init(){
    aplicar();
    var alvo = document.getElementById('content') || document.body, t = null;
    try{ new MutationObserver(function(){ clearTimeout(t); t = setTimeout(aplicar, 200); }).observe(alvo, {childList:true, subtree:true}); }catch(e){}
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
