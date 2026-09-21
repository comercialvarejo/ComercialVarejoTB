# Comercial-Varejo-Apucarana

Painel estático (GitHub Pages) do Comercial Varejo Apucarana: estoque,
tabela de preços, pedidos em aberto, e-mails padrão e acompanhamento de
vendedores. As três primeiras páginas são regeradas sozinhas pelo
GitHub Actions a partir do Google Sheets; as outras duas são páginas de
uso direto, que não dependem de planilha.

| Arquivo | O que é | Quem atualiza |
|---|---|---|
| `index.html` | Estoque (com validades e programação de cargas) | script, de hora em hora |
| `tabela-precos.html` | Tabela de preços | script, de hora em hora |
| `pedidos-em-aberto.html` | Pedidos em aberto por vendedor | script, de hora em hora |
| `emails-padrao.html` | Modelos de e-mail | à mão, editando `TEMPLATES` |
| `acompanhamento-vendedores.html` | Painel do vendedor (ele mesmo importa o Excel dele) | ninguém - roda no aparelho do vendedor |
| `scripts/atualizar_estoque.py` | O gerador de tudo que é automático | à mão |
| `apps_script_planilha.txt` | Código do Apps Script que fica na planilha e dispara o Actions | à mão, colado no editor do Google |

## Classificação automática de itens novos

Quando surge um código novo na planilha de estoque, o script tenta descobrir
sozinho em qual seção do painel ele deve entrar (Resfriados/Congelados/IQF/
Alimentos Preparados), nesta ordem:

1. **Palavras-chave** na descrição do produto (ex: "CONGELADO", "IQF",
   "EMPANADO"). Cobre a maioria dos casos, sem custo e sem depender de nada
   externo.
2. **IA (Claude)**, só quando as palavras-chave não bastam. Requer a secret
   `ANTHROPIC_API_KEY` configurada no repositório (Settings → Secrets and
   variables → Actions). Sem essa secret, essa etapa é simplesmente pulada.
3. **"Não Classificados"**: se nada acima resolver, o card ainda assim é
   criado, numa seção própria do painel - nunca é descartado silenciosamente.
   Basta mover manualmente pra seção certa quando der.

## Como o painel é atualizado

O script `scripts/atualizar_estoque.py` roda automaticamente todo hora via
GitHub Actions (`.github/workflows/atualizar-estoque.yml`), lê os dados
publicados no Google Sheets (CSV, endereço na secret `GSHEET_CSV_URL`) e
regenera o `index.html` (estoque), `tabela-precos.html` e
`pedidos-em-aberto.html` direto no repositório. Não existe backend/servidor
por trás do site - é tudo HTML estático gerado por esse script e publicado
pelo GitHub Pages.

## Trava de validação (evita dado ruim ir pro ar)

Antes de sobrescrever cada uma das três páginas, o script confere se o
resultado faz sentido perto do que já estava publicado:

- **Estoque**: se o número de cards cair demais em relação ao anterior
  (mais de 50% de queda, e só quando já existiam pelo menos 5 cards), a
  atualização daquela página é **bloqueada** - fica valendo a versão
  anterior, pra não sumir com o painel inteiro por causa de um erro na
  planilha.
- **Preços**: mesma lógica, comparando os preços atuais com os anteriores;
  um salto absurdo (mais de 50%) trava a atualização da tabela de preços.
- **Pedidos em aberto**: aqui a regra é mais frouxa **de propósito**. A
  quantidade de vendedores com pedido em aberto oscila muito por natureza
  do negócio (um dia de faturamento forte tira metade dos pedidos da
  planilha de uma vez), então uma queda grande **não bloqueia** a
  publicação: só deixa um aviso no log. Bloqueia mesmo só quando o
  resultado é implausível - planilha vazia (0 vendedores) ou sobrando
  menos de 3 vendedores vindo de uma base bem maior, o que tem cara de
  exportação cortada no meio.

Quando uma dessas travas aciona, o job do GitHub Actions termina com erro
(fica vermelho), mas as páginas que passaram na validação são commitadas
normalmente - só a página com problema fica intacta, esperando a planilha
ser corrigida.

## Forçar publicação (ignorar a trava numa rodada)

Se a trava de estoque ou preços acionar mas a queda for real, dá pra
publicar sem mexer em código: aba **Actions** → workflow **Atualizar
Estoque Apucarana** → botão **Run workflow** → marcar a caixinha
**"Forçar publicação mesmo com queda grande"** → confirmar. Isso vale só
pra aquela rodada; as rodadas automáticas (de hora em hora e as
disparadas pela planilha) sempre rodam com a trava ligada.

## Itens novos e correções manuais

Quando um código novo aparece no estoque, o card nasce com um selo
**"🆕 NOVO"**, que serve só de aviso: "entrou item novo, confere se o nome
e a seção estão certos". O selo **cai sozinho na atualização seguinte**, se
o produto continuar na planilha. Não existe botão de editar no card - toda
correção é feita no `scripts/atualizar_estoque.py` e vale pra todo mundo:

- `NOME_CANONICO` - nome de exibição fixo por código (o Protheus manda
  descrições enormes e às vezes muda o texto; aqui o nome fica estável).
- `COD_CANCAO_FIXO` - Cód. Canção por código de produto.
- Grupo/seção errada de um card que já existe: é só mover o bloco `<div
  class="card ...">` pro grupo certo dentro do `index.html`. O script
  atualiza o saldo onde o card estiver - ele nunca move card existente.
  Se o erro for de classificação (vai errar de novo com produto parecido),
  ajuste também as palavras-chave de `classificar_produto_novo`.

No **pedidos em aberto** não há selo nenhum: quem entra sem senha própria
nasce com `0000` e o log da rodada avisa quem está nessa situação. A senha
definitiva vai em `SENHAS_INICIAIS` (ou direto no `DATA` do HTML) - uma vez
definida, o script nunca mais mexe nela. Quem sai do quadro vai pra lista
`VENDEDORES_REMOVIDOS`: só apagar do HTML não resolve, porque o script
preserva os vendedores antigos pra não perder senha, então sem essa lista
a pessoa volta na rodada seguinte.

## Botão "🚚 programação" (programação de cargas)

Cada card do estoque pode mostrar um botão **"🚚 programação"** com as
cargas em trânsito/programadas daquele produto especificamente (data de
carregamento, status, NF, placa, pedido, Kg programado/faturado). Os dados
vêm de uma segunda planilha (a de programação de cargas, publicada como CSV
na secret opcional `GSHEET_PROGRAMACAO_CSV_URL`), cruzada com o estoque pela
coluna **Código Protheus** (o mesmo código que já aparece no card, ex:
`FRCSCANMI000011`). O botão só aparece nos produtos que realmente têm
alguma linha de programação - sem essa secret configurada, o painel
funciona normalmente, só sem esse botão.

## E-mails Padrão

A aba **"📧 Emails"** (`emails-padrao.html`) reúne modelos prontos de
e-mail que os vendedores usam no dia a dia (prioridade de cadastro,
bonificação, cadastro de forma de pagamento, baixa de título, troca de
produto/reclamação, abertura de ocorrência, programação de cargas). O
vendedor escolhe o modelo, preenche um formulário curto na própria página e
o e-mail já abre pronto no cliente de e-mail dele, com destinatários,
assunto, corpo e cópia (geralmente o supervisor) preenchidos - sem precisar
digitar nada manualmente. Pra adicionar um novo modelo, basta incluir um
objeto na lista `TEMPLATES` dentro do `<script>` de `emails-padrao.html`.

## Acompanhamento de vendedores

A aba **"📈 Vendedores"** (`acompanhamento-vendedores.html`) é diferente das
outras: **não depende do Google Sheets nem do script**. É uma página única,
com o leitor de Excel embutido, que roda inteira no aparelho do vendedor.
Cada vendedor importa o export do BI dele e vê a própria carteira: meta do
mês, positivação, mix, curva ABC, roteiro, simulador de pedido e
fechamento.

Pontos importantes de funcionamento:

- **Cada vendedor tem os dados dele, separados.** Tudo é guardado por nome
  de vendedor (`painel_v2_dados::<nome>`, `painel_v2_metas::<nome>`), então
  um vendedor importar o arquivo dele não afeta o painel de outro, mesmo no
  mesmo aparelho.
- **A meta é digitada uma vez por mês e não é tocada pelo arquivo diário.**
  O import atualiza faturamento/volume; a meta salva do mês só é
  sobrescrita se ainda não existir. Existe ainda a trava por senha do
  escritório, que congela as metas do mês.
- **A meta por categoria usa os 9 grupos fixos** definidos em `MG_PADRAO`
  (Tilápia, Isca de Tilápia, Batata, Bandeja, IQF, Vegetais, Pão de Queijo,
  Lasanhas, Empanados). Produto que não cai em nenhum deles fica em "Sem
  grupo de meta" e não entra na conta.
- **O nome do vendedor sai do próprio arquivo**, da linha "REPRESENTANTE".
  Se o export não trouxer um nome único (ex: filtro de exclusão listando
  vários nomes), a página avisa em vermelho em vez de adivinhar - senão
  dois vendedores acabariam gravando na mesma chave.
- **Preço não aparece na aba "O que oferecer"**, de propósito: a tabela de
  preços é passada aos vendedores por fora.

## PWA (instalável)

`index.html`, `tabela-precos.html`, `emails-padrao.html` e
`acompanhamento-vendedores.html` registram um
service worker (`sw.js`) e referenciam o `manifest.json`, permitindo
instalar o painel como app (ícone na tela, abre sem barra de navegador).
As páginas HTML são sempre buscadas da rede primeiro (nunca mostra
estoque/preço desatualizado só porque tem internet); o cache só entra em
ação se a conexão cair no meio de uma consulta - só ícones e manifest
ficam em cache-first. `pedidos-em-aberto.html` não registra service
worker (mas continua abrindo normalmente pelas abas).

**Atenção ao nome do arquivo**: o service worker precisa estar no
repositório como **`sw.js`** exatamente. Se ele for enviado com outro
nome (ex: `sw.txt`), o navegador toma 404 ao registrar e o painel deixa
de ser instalável - o site continua funcionando, mas sem o comportamento
de app.

Todas as páginas usam `viewport-fit=cover` no `<meta name="viewport">` e
somam `env(safe-area-inset-top)` no `padding` do cabeçalho. Isso é
obrigatório: sem o `viewport-fit=cover`, o `env()` vale sempre 0 e o
cabeçalho (com as abas de navegação) fica embaixo do relógio/bateria do
celular quando o painel abre como app instalado.

## Subindo num repositório novo

O site é estático, então o repositório novo só precisa receber os mesmos
arquivos - mas quatro coisas ficam **fora** do repositório e precisam ser
refeitas, senão o painel sobe e nunca mais se atualiza sozinho:

1. **GitHub Pages**: Settings → Pages → Source **Deploy from a branch**,
   branch `main`, pasta `/ (root)`. O endereço muda junto com o nome do
   repositório, então vale reenviar o link pra quem usa o painel no
   celular (quem tiver instalado como app vai precisar instalar de novo).
2. **Secrets** (Settings → Secrets and variables → **Actions**). Só a
   primeira é obrigatória; sem as outras o painel funciona, apenas sem a
   seção correspondente:

   | Secret | Para quê |
   |---|---|
   | `GSHEET_CSV_URL` | aba de estoque (obrigatória) |
   | `GSHEET_PRECOS_CSV_URL` | tabela de preços |
   | `GSHEET_PEDIDOS_CSV_URL` | pedidos em aberto |
   | `GSHEET_VALIDADES_CSV_URL` | botão "ver validades" |
   | `GSHEET_PROGRAMACAO_CSV_URL` | botão "🚚 programação" |
   | `ANTHROPIC_API_KEY` | classificar item novo por IA quando a palavra-chave não basta |

   São os endereços de **Publicar na Web → CSV** de cada aba (o mesmo
   link que já está em uso hoje - dá pra copiar do repositório antigo).
3. **Permissão de escrita do Actions**: Settings → Actions → General →
   Workflow permissions → **Read and write permissions**. Sem isso o
   script roda, gera o HTML e falha na hora de commitar.
4. **Apps Script da planilha** (`apps_script_planilha.txt`): a propriedade
   `GITHUB_REPO` do script aponta pro repositório antigo. Trocar para
   `usuario/repositorio-novo` no editor do Apps Script (Configurações do
   projeto → Propriedades do script). Se o token do GitHub também for
   novo, atualizar `GITHUB_TOKEN` junto. Sem isso, editar a planilha
   continua disparando a atualização **no repositório velho**.

Depois de subir, dá pra testar tudo de uma vez pela aba **Actions** →
**Atualizar Estoque Apucarana** → **Run workflow**: se o log terminar com
as linhas `OK - ... códigos de estoque`, `OK - ... produtos de preço` e
`OK - ... vendedores`, as secrets estão certas.
