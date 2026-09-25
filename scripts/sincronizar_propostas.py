#!/usr/bin/env python3
"""
Sincroniza a aba "Propostas" do painel Estoque Apucarana.

O painel Propostas & Retorno mora no seu próprio repositório:
    https://github.com/comercialvarejo/Painel-Propostas-Retorno

Este script pega a versão mais nova do index.html de lá, cola a barra de abas
do Estoque no topo e grava o resultado aqui como propostas-retorno.html.

Assim o painel continua tendo UM lugar só para ser editado (o repositório
Painel-Propostas-Retorno), e a aba dentro do Estoque se atualiza sozinha.

NUNCA mexa no propostas-retorno.html na mão: a próxima rodada apaga a edição.
Mexa no repositório Painel-Propostas-Retorno.

Rodar na mão (a partir da raiz do repositório):
    python3 scripts/sincronizar_propostas.py
"""

import os
import re
import sys
import urllib.request

FONTE = os.environ.get(
    "PROPOSTAS_URL",
    "https://raw.githubusercontent.com/comercialvarejo/Painel-Propostas-Retorno/main/index.html",
)
DESTINO = "propostas-retorno.html"

# Se a página baixada não tiver TODAS estas marcas, alguma coisa está errada
# (repositório renomeado, branch trocada, GitHub devolvendo página de erro).
# Nesse caso o script para e não escreve nada — é melhor a aba continuar
# mostrando a versão de ontem do que virar uma página de erro.
MARCAS_OBRIGATORIAS = [
    "Propostas &amp; Retorno",
    "firebase",
    "firestore",
    "<body",
]
TAMANHO_MINIMO = 20000  # bytes; o painel tem ~80 KB

BARRA = """
<!-- ======================================================================
     Barra de abas do painel Estoque Apucarana.
     Colada automaticamente por scripts/sincronizar_propostas.py.
     Não edite aqui: edite o script.
     ====================================================================== -->
<style>
.cv-tabbar{background:#8f0e28;padding:10px 16px calc(10px + env(safe-area-inset-bottom,0px));
  padding-top:calc(10px + env(safe-area-inset-top,0px))}
.cv-tabbar-in{max-width:1240px;margin:0 auto;display:flex;gap:6px;overflow-x:auto;
  -webkit-overflow-scrolling:touch;scrollbar-width:none}
.cv-tabbar-in::-webkit-scrollbar{display:none}
.cv-tabbar a{display:inline-flex;align-items:center;gap:5px;flex:0 0 auto;
  padding:6px 13px;border-radius:20px;text-decoration:none;white-space:nowrap;
  font-family:"Barlow",system-ui,-apple-system,"Segoe UI",sans-serif;
  font-size:12px;font-weight:600;color:rgba(255,255,255,.78);
  background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);
  transition:background .15s}
.cv-tabbar a.active{background:#fff;color:#8f0e28;border-color:#fff}
.cv-tabbar a:not(.active):hover{background:rgba(255,255,255,.2)}
.cv-tabbar a:not(.active):active{background:rgba(255,255,255,.26)}
.cv-tabbar a:focus-visible{outline:2px solid #fff;outline-offset:2px}
</style>
<nav class="cv-tabbar" aria-label="Painéis">
  <div class="cv-tabbar-in">
    <a href="./index.html">\U0001F4E6 Estoque</a>
    <a href="./tabela-precos.html">\U0001F4B0 Preços</a>
    <a href="./pedidos-em-aberto.html">\U0001F4CB Pedidos</a>
    <a href="./propostas-retorno.html" class="active" aria-current="page">\U0001F91D Propostas</a>
    <a href="./acompanhamento-vendedores.html">\U0001F4C8 Vendedores</a>
    <a href="./emails-padrao.html">\U0001F4E7 Emails</a>
  </div>
</nav>
<script>
/* No celular a faixa de abas rola na horizontal. Sem isto a aba ativa
   (a 4a) nasce cortada na borda direita e parece que nao existe. */
(function(){
  var barra = document.querySelector('.cv-tabbar-in');
  var ativa = barra && barra.querySelector('a.active');
  if (!barra || !ativa) return;
  var sobra = ativa.offsetLeft + ativa.offsetWidth - barra.clientWidth;
  if (sobra > 0) barra.scrollLeft = sobra + 16;
})();
</script>
"""


def baixar(url):
    req = urllib.request.Request(url, headers={"User-Agent": "sincronizar-propostas"})
    with urllib.request.urlopen(req, timeout=60) as r:
        if r.status != 200:
            raise RuntimeError(f"o servidor respondeu {r.status}")
        return r.read().decode("utf-8")


def conferir(html):
    """Confere se o que baixamos é mesmo o painel, e não uma página de erro."""
    problemas = []
    if len(html) < TAMANHO_MINIMO:
        problemas.append(f"arquivo pequeno demais ({len(html)} bytes)")
    for marca in MARCAS_OBRIGATORIAS:
        if marca not in html:
            problemas.append(f'não encontrei "{marca}" na página')
    return problemas


def colar_barra(html):
    """Coloca a barra logo depois do <body>, antes do cabeçalho do painel."""
    m = re.search(r"<body[^>]*>", html, re.I)
    if not m:
        raise RuntimeError("não achei a tag <body> na página baixada")
    corte = m.end()
    return html[:corte] + BARRA + html[corte:]


def ajustar_titulo(html):
    """Deixa claro na aba do navegador que é o painel do Estoque."""
    return re.sub(
        r"<title>.*?</title>",
        "<title>Propostas &amp; Retorno – Comercial Varejo</title>",
        html,
        count=1,
        flags=re.S | re.I,
    )


def main():
    print(f"Baixando {FONTE}")
    try:
        bruto = baixar(FONTE)
    except Exception as e:
        print(f"❌ Não consegui baixar o painel de Propostas: {e}")
        print("   O propostas-retorno.html atual foi mantido como está.")
        return 1

    problemas = conferir(bruto)
    if problemas:
        print("❌ O que baixei não parece ser o painel de Propostas:")
        for p in problemas:
            print(f"   - {p}")
        print("   O propostas-retorno.html atual foi mantido como está.")
        return 1

    novo = ajustar_titulo(colar_barra(bruto))

    if os.path.exists(DESTINO):
        with open(DESTINO, encoding="utf-8") as f:
            if f.read() == novo:
                print("✅ Nada mudou no painel de Propostas. Nenhum commit necessário.")
                return 0

    with open(DESTINO, "w", encoding="utf-8") as f:
        f.write(novo)
    print(f"✅ {DESTINO} atualizado ({len(novo)} bytes).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
