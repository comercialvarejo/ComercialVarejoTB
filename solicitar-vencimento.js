/* Solicitação de data de vencimento - painel Estoque Apucarana
   Botão + janela: o vendedor escolhe os itens (puxados do próprio painel), informa a
   quantidade de caixas e a data de vencimento desejada de cada um, o nº do pedido no
   ERP e o seu nome. Os itens aparecem agrupados como no painel (Resfriados > Bandeja...). O pedido é gravado na planilha de solicitações
   (planilha externa, via Apps Script - ver apps_script_solicitacoes.txt) e, se configurado, avisa por e-mail. */
(function(){
  'use strict';
  /* Cole aqui o endereço do Apps Script publicado como "App da Web" (termina em /exec) */
  var URL_SOLICITACAO = 'https://script.google.com/macros/s/AKfycbz-13dmSzsHE2cDG6DQOPikDZtrY7hOoR4euH1SGHHpx3NB2Ve6-lo1j-jkVizfmF66og/exec';
  var FILIAL = 'Apucarana';

  function $(s, r){ return (r||document).querySelector(s); }
  function esc(t){ return String(t==null?'':t).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function norm(t){ return String(t||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase(); }
  function lsGet(k){ try{ return localStorage.getItem(k)||''; }catch(e){ return ''; } }
  function lsSet(k,v){ try{ localStorage.setItem(k,v); }catch(e){} }

  var css = '\
  .sv-hrow{position:relative;z-index:2;display:flex;gap:14px;align-items:center;flex-wrap:wrap}\
  .sv-hrow .search-wrap{flex:1 1 320px;max-width:760px;min-width:0}\
  .sv-btn{flex:0 0 auto;height:56px;padding:0 22px;border-radius:16px;border:1px solid rgba(255,255,255,.55);background:rgba(255,255,255,.96);color:#9a1b0b;font:700 15px var(--body,system-ui,sans-serif);cursor:pointer;box-shadow:0 10px 26px rgba(86,8,3,.28);white-space:nowrap}\
  .sv-btn:hover{background:#fff;transform:translateY(-1px)}\
  @media(max-width:700px){.sv-btn{width:100%}}\
  .sv-gh{position:sticky;top:0;z-index:1;padding:6px 10px;background:var(--surface-raised,#f4ede0);color:var(--ink-soft,#56493e);font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;border-bottom:1px solid var(--line-soft,#ece3d3)}\
  .sv-it .dt{display:none;width:150px}\
  .sv-it.sel .dt{display:block}\
  .sv-it .dt input{padding:6px 8px!important}\
  .sv-it .dt small,.sv-it .cx small{display:block;font:600 10px inherit;color:var(--muted,#92836f);margin-bottom:2px}\
  @media(max-width:520px){.sv-it{flex-wrap:wrap}.sv-it .dt{width:auto;flex:1}}\
  .sv-ov{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:99999;display:none;align-items:flex-start;justify-content:center;overflow:auto;padding:24px 12px}\
  .sv-ov.on{display:flex}\
  .sv-box{width:100%;max-width:640px;background:var(--surface,#fff);color:var(--ink,#1c1611);border:1px solid var(--line,#e3d8c6);border-radius:16px;box-shadow:0 24px 60px rgba(0,0,0,.35);font-family:var(--body,system-ui,sans-serif)}\
  .sv-hd{display:flex;align-items:center;justify-content:space-between;padding:16px 18px;border-bottom:1px solid var(--line,#e3d8c6)}\
  .sv-hd h2{margin:0;font-size:17px}\
  .sv-x{border:0;background:none;color:inherit;font-size:22px;cursor:pointer;line-height:1}\
  .sv-bd{padding:16px 18px}\
  .sv-f{margin-bottom:12px}\
  .sv-f label{display:block;font-size:12px;font-weight:700;margin-bottom:4px;color:var(--ink-soft,#56493e)}\
  .sv-f input[type=text],.sv-f input[type=date],.sv-f input[type=number],.sv-f input[type=search]{width:100%;box-sizing:border-box;padding:10px 12px;border-radius:10px;border:1px solid var(--line,#e3d8c6);background:var(--surface-raised,#fff);color:inherit;font-size:14px;font-family:inherit}\
  .sv-row2{display:grid;grid-template-columns:1fr 1fr;gap:10px}\
  @media(max-width:520px){.sv-row2{grid-template-columns:1fr}}\
  .sv-list{max-height:340px;overflow:auto;border:1px solid var(--line,#e3d8c6);border-radius:10px;margin-top:6px}\
  .sv-it{display:flex;align-items:center;gap:10px;padding:8px 10px;border-bottom:1px solid var(--line-soft,#ece3d3);font-size:13px}\
  .sv-it:last-child{border-bottom:0}\
  .sv-it.sel{background:var(--green-soft,#e3f3ea)}\
  .sv-it .nm{flex:1;min-width:0}\
  .sv-it .nm b{display:block}\
  .sv-it .nm small{color:var(--muted,#92836f);font-family:var(--mono,monospace);font-size:11px}\
  .sv-it .cx{width:78px;display:none}\
  .sv-it.sel .cx{display:block}\
  .sv-it .cx input{padding:6px 8px!important;text-align:center}\
  .sv-sum{font-size:12px;color:var(--muted,#92836f);margin-top:6px}\
  .sv-err{color:var(--red-status,#9c322c);font-size:13px;font-weight:600;margin:8px 0 0}\
  .sv-ft{display:flex;gap:10px;justify-content:flex-end;padding:14px 18px;border-top:1px solid var(--line,#e3d8c6)}\
  .sv-b{padding:10px 18px;border-radius:10px;border:1px solid var(--line,#e3d8c6);background:var(--surface-raised,#fff);color:inherit;font:600 14px inherit;cursor:pointer}\
  .sv-b.p{background:var(--brand,#8f0e28);border-color:var(--brand,#8f0e28);color:#fff}\
  .sv-b[disabled]{opacity:.6;cursor:wait}\
  .sv-ok{text-align:center;padding:10px 0}.sv-ok .big{font-size:40px}\
  .sv-ok pre{text-align:left;white-space:pre-wrap;background:var(--surface-raised,#fff);border:1px solid var(--line,#e3d8c6);border-radius:10px;padding:10px;font-size:12px}\
  @media print{.sv-btn,.sv-ov{display:none!important}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var gOrd = {}, gN = 0;
  function limpaTit(t){ return String(t||'').replace(/[^\p{L}\p{N}\s\-\/&.]/gu,'').replace(/\s+/g,' ').trim(); }
  function capit(t){ return t.toLowerCase().replace(/(^|\s|\/)(\p{L})/gu,function(m,a,b){ return a+b.toUpperCase(); }); }
  function grupoDe(card){
    var sec = card.closest('.section'), tit = sec ? $('.section-label', sec) : null;
    var sTxt = capit(limpaTit(tit ? tit.textContent : '')) || 'Outros';
    var cont = card.closest('.cards'), gl = cont ? cont.previousElementSibling : null;
    while(gl && !(gl.classList && gl.classList.contains('group-label'))){ gl = gl.previousElementSibling; if(gl && gl.classList && gl.classList.contains('cards')) { gl = null; break; } }
    var gTxt = gl ? capit(limpaTit(gl.textContent)) : '';
    var nome = (gTxt && norm(sTxt).indexOf(norm(gTxt)) < 0) ? sTxt+' › '+gTxt : sTxt;
    if(!(nome in gOrd)) gOrd[nome] = gN++;
    return {nome:nome, o:gOrd[nome]};
  }

  /* itens disponíveis, lidos do próprio painel (sempre os da filial desta página) */
  function lerItens(){
    var out = [];
    document.querySelectorAll('.card[data-status="available"]').forEach(function(c){
      var nm = $('.card-name', c), cd = $('.card-code', c), kg = $('.stock-kg', c);
      if(!nm || !cd) return;
      var m = cd.textContent.match(/^\s*([A-Z]+\d+)\s*·?\s*(?:Cx\s*([\d.,]+)\s*kg)?/);
      if(!m) return;
      out.push({codigo:m[1], nome:nm.textContent.trim(), peso:m[2]||'', kg:kg?kg.textContent.trim():'', grupo:grupoDe(c), ord:out.length});
    });
    /* mantém a ordem dos grupos como no painel; dentro do grupo, ordem alfabética */
    out.sort(function(a,b){
      if(a.grupo.o !== b.grupo.o) return a.grupo.o - b.grupo.o;
      return a.nome.localeCompare(b.nome,'pt-BR',{numeric:true,sensitivity:'base'});
    });
    return out;
  }

  var ov, itens = [], sel = {};

  function hojeISO(){ var d=new Date(); d.setMinutes(d.getMinutes()-d.getTimezoneOffset()); return d.toISOString().slice(0,10); }
  function fmtData(iso){ var p=iso.split('-'); return p[2]+'/'+p[1]+'/'+p[0]; }

  function montaLista(filtro){
    var q = norm(filtro), h = '', ult = null;
    itens.forEach(function(it){
      if(q && norm(it.nome+' '+it.codigo+' '+it.grupo.nome).indexOf(q) < 0) return;
      if(it.grupo.nome !== ult){ ult = it.grupo.nome; h += '<div class="sv-gh">'+esc(ult)+'</div>'; }
      var s = sel[it.codigo];
      h += '<div class="sv-it'+(s?' sel':'')+'" data-c="'+esc(it.codigo)+'">'+
        '<input type="checkbox" '+(s?'checked':'')+' aria-label="Selecionar '+esc(it.nome)+'">'+
        '<div class="nm"><b>'+esc(it.nome)+'</b><small>'+esc(it.codigo)+(it.peso?' · Cx '+esc(it.peso)+' kg':'')+(it.kg?' · disp. '+esc(it.kg):'')+'</small></div>'+
        '<div class="cx"><small>Caixas</small><input type="number" min="1" step="1" inputmode="numeric" placeholder="CX" value="'+(s?esc(s.cx):'')+'" aria-label="Caixas de '+esc(it.nome)+'"></div>'+
        '<div class="dt"><small>Vencimento</small><input type="date" min="'+hojeISO()+'" value="'+(s?esc(s.data||''):'')+'" aria-label="Vencimento de '+esc(it.nome)+'"></div></div>';
    });
    $('.sv-list', ov).innerHTML = h || '<div class="sv-it">Nenhum item encontrado.</div>';
    resumo();
  }
  function resumo(){
    var n = Object.keys(sel).length;
    $('.sv-sum', ov).textContent = n ? (n+' item'+(n===1?'':'ns')+' selecionado'+(n===1?'':'s')) : 'Marque um ou mais itens e informe as caixas e o vencimento de cada um.';
  }

  function abrir(){
    itens = lerItens(); sel = {};
    ov.querySelector('.sv-form').style.display = ''; ov.querySelector('.sv-done').style.display = 'none';
    $('.sv-err', ov).textContent = '';
    $('#sv-vend', ov).value = lsGet('sv-vendedor'); $('#sv-ped', ov).value = ''; $('#sv-busca', ov).value = '';
    $('.sv-send', ov).disabled = false; $('.sv-send', ov).textContent = 'Enviar solicitação';
    montaLista('');
    ov.classList.add('on'); document.body.style.overflow = 'hidden';
  }
  function fechar(){ ov.classList.remove('on'); document.body.style.overflow = ''; }

  function enviar(){
    var err = $('.sv-err', ov); err.textContent = '';
    var vend = $('#sv-vend', ov).value.trim(), ped = $('#sv-ped', ov).value.trim();
    var cods = Object.keys(sel), porCodTmp = {}; itens.forEach(function(it){ porCodTmp[it.codigo] = it; });
    if(!vend){ err.textContent = 'Informe o nome do vendedor.'; return; }
    if(!ped){ err.textContent = 'Informe o número do pedido no ERP.'; return; }
    if(!cods.length){ err.textContent = 'Selecione pelo menos um item.'; return; }
    for(var i=0;i<cods.length;i++){
      var cx = parseInt(sel[cods[i]].cx,10);
      var nmIt = (porCodTmp[cods[i]]||{}).nome || cods[i];
      if(!(cx>0)){ err.textContent = 'Informe a quantidade de caixas (maior que zero) de: '+nmIt+'.'; return; }
      var dt = sel[cods[i]].data;
      if(!dt){ err.textContent = 'Informe a data de vencimento desejada de: '+nmIt+'.'; return; }
      if(dt < hojeISO()){ err.textContent = 'A data de vencimento não pode ser anterior a hoje ('+nmIt+').'; return; }
    }
    if(/COLE_AQUI/.test(URL_SOLICITACAO)){ err.textContent = 'Envio ainda não configurado (endereço do Apps Script pendente). Avise o administrador do painel.'; return; }

    var id = 'SV' + Date.now().toString(36).toUpperCase();
    var porCod = {}; itens.forEach(function(it){ porCod[it.codigo] = it; });
    var lista = cods.map(function(c){ return {codigo:c, produto:porCod[c]?porCod[c].nome:c, grupo:porCod[c]?porCod[c].grupo.nome:'', cx:parseInt(sel[c].cx,10), vencimento:fmtData(sel[c].data)}; });
    var payload = {id:id, filial:FILIAL, vendedor:vend, pedido:ped, itens:lista, origem:location.href.split('#')[0]};
    lsSet('sv-vendedor', vend);

    var btn = $('.sv-send', ov); btn.disabled = true; btn.textContent = 'Enviando...';
    var texto = ['Solicitação de data de vencimento - '+FILIAL, 'Protocolo: '+id, 'Vendedor: '+vend, 'Pedido ERP: '+ped, '']
      .concat(lista.map(function(l){ return '- '+l.produto+' ('+l.codigo+'): '+l.cx+' CX, vencimento '+l.vencimento; })).join('\n');
    fetch(URL_SOLICITACAO, {method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'}, body:JSON.stringify(payload)})
      .then(function(r){ return r.json(); })
      .then(function(j){
        if(!j || !j.ok) throw new Error((j && j.erro) || 'resposta inválida');
        ov.querySelector('.sv-form').style.display = 'none';
        var d = ov.querySelector('.sv-done'); d.style.display = '';
        d.querySelector('pre').textContent = texto;
        d.dataset.txt = texto;
      })
      .catch(function(e){
        btn.disabled = false; btn.textContent = 'Enviar solicitação';
        err.textContent = 'Não foi possível confirmar o envio ('+(e && e.message ? e.message : 'erro')+'). Verifique a conexão e tente novamente. Se o erro persistir, avise o administrador antes de reenviar.';
      });
  }

  function montaModal(){
    ov = document.createElement('div'); ov.className = 'sv-ov'; ov.setAttribute('role','dialog'); ov.setAttribute('aria-modal','true');
    ov.innerHTML = '<div class="sv-box">\
      <div class="sv-hd"><h2>📅 Solicitar data de vencimento</h2><button class="sv-x" aria-label="Fechar">×</button></div>\
      <div class="sv-form"><div class="sv-bd">\
        <div class="sv-row2">\
          <div class="sv-f"><label for="sv-vend">Nome do vendedor</label><input type="text" id="sv-vend" autocomplete="name" maxlength="80"></div>\
          <div class="sv-f"><label for="sv-ped">Nº do pedido (ERP)</label><input type="text" id="sv-ped" inputmode="numeric" maxlength="30"></div>\
        </div>\
        <div class="sv-f"><label for="sv-busca">Produtos (do estoque Apucarana)</label><input type="search" id="sv-busca" placeholder="Buscar por nome ou código...">\
          <div class="sv-list"></div><div class="sv-sum"></div></div>\
        <div class="sv-err" role="alert"></div>\
      </div>\
      <div class="sv-ft"><button class="sv-b sv-cancel">Cancelar</button><button class="sv-b p sv-send">Enviar solicitação</button></div></div>\
      <div class="sv-done" style="display:none"><div class="sv-bd sv-ok"><div class="big">✅</div><h3>Solicitação enviada</h3><pre></pre></div>\
      <div class="sv-ft"><button class="sv-b sv-copy">Copiar resumo</button><button class="sv-b p sv-close">Fechar</button></div></div></div>';
    document.body.appendChild(ov);
    ov.addEventListener('click', function(e){ if(e.target===ov) fechar(); });
    $('.sv-x', ov).onclick = fechar; $('.sv-cancel', ov).onclick = fechar; $('.sv-close', ov).onclick = fechar;
    $('.sv-send', ov).onclick = enviar;
    $('.sv-copy', ov).onclick = function(){
      var t = $('.sv-done', ov).dataset.txt || '';
      try{ navigator.clipboard.writeText(t); this.textContent = 'Copiado!'; }catch(e){}
    };
    $('#sv-busca', ov).addEventListener('input', function(){ montaLista(this.value); });
    var lista = $('.sv-list', ov);
    lista.addEventListener('change', function(e){
      var row = e.target.closest('.sv-it'); if(!row) return; var c = row.getAttribute('data-c');
      if(e.target.type === 'checkbox'){
        if(e.target.checked){ sel[c] = {cx:'', data:''}; } else { delete sel[c]; }
        row.classList.toggle('sel', e.target.checked); resumo();
        if(e.target.checked){ var i = row.querySelector('.cx input'); if(i) i.focus(); }
      }
    });
    lista.addEventListener('input', function(e){
      var row = e.target.closest('.sv-it'); if(!row) return;
      var c = row.getAttribute('data-c'); if(!sel[c]) return;
      if(e.target.type === 'number') sel[c].cx = e.target.value;
      else if(e.target.type === 'date') sel[c].data = e.target.value;
    });
    document.addEventListener('keydown', function(e){ if(e.key==='Escape' && ov.classList.contains('on')) fechar(); });
  }

  function init(){
    if($('.sv-btn')) return;
    montaModal();
    var b = document.createElement('button'); b.className = 'sv-btn'; b.type = 'button';
    b.textContent = '📅 Solicitar data de vencimento'; b.onclick = abrir;
    var busca = $('header .search-wrap') || $('.search-wrap');
    if(busca && busca.parentNode){
      var row = document.createElement('div'); row.className = 'sv-hrow';
      busca.parentNode.insertBefore(row, busca); row.appendChild(busca); row.appendChild(b);
    } else { var barra = $('.report-btn-wrap'); if(barra && barra.parentNode) barra.parentNode.insertBefore(b, barra); else document.body.insertBefore(b, document.body.firstChild); }
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
