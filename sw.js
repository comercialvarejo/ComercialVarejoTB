// Service worker do painel Estoque Apucarana.
//
// Objetivo: deixar o site instalável (PWA) e ainda abrir (com o último
// dado visto) se a conexão cair no meio de um pedido/consulta - mas SEM
// nunca preferir uma versão antiga do estoque/preços/pedidos quando tem
// internet. Por isso as páginas HTML são "network-first" (tenta buscar a
// versão mais nova sempre; só usa o cache se a rede falhar de verdade).
// Só os ícones/manifest (que não mudam) ficam em cache-first.
//
// IMPORTANTE (correção de 25/09/2026): antes, QUALQUER resposta que
// chegasse era guardada no cache - inclusive uma página de erro. Se o
// GitHub Pages devolvesse 404 ou 500 num momento ruim (deploy no meio do
// caminho, arquivo renomeado), a página de erro entrava no lugar do painel
// e o aparelho passava a abrir a página de erro, inclusive sem internet.
// Agora só entra no cache resposta 200 que seja HTML de verdade.

const CACHE_VERSION = 'estoque-apucarana-v2';

const ARQUIVOS_ESTATICOS = [
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

// Só guardamos no cache o que realmente serve para abrir o painel depois.
// Sem isso, uma página de erro do GitHub viraria o painel no aparelho.
function respostaBoaParaGuardar(resp, esperaHtml) {
  if (!resp || !resp.ok || resp.type === 'opaque') return false;
  if (!esperaHtml) return true;
  const tipo = resp.headers.get('content-type') || '';
  return tipo.includes('text/html');
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) =>
      // um a um: se um arquivo falhar, a instalação não vai por água abaixo
      Promise.all(
        ARQUIVOS_ESTATICOS.map((u) =>
          cache.add(new Request(u, { cache: 'reload' })).catch(() => {})
        )
      )
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((nomes) =>
      Promise.all(
        nomes
          .filter((nome) => nome !== CACHE_VERSION)
          .map((nome) => caches.delete(nome))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  let url;
  try {
    url = new URL(req.url);
  } catch (e) {
    return;
  }
  if (url.origin !== self.location.origin) return;

  const ehPagina =
    req.mode === 'navigate' || req.headers.get('accept')?.includes('text/html');

  if (ehPagina) {
    // Network-first: sempre busca a versão mais nova do painel; só cai
    // pro cache (última versão vista) se estiver sem internet.
    event.respondWith(
      fetch(req)
        .then((resp) => {
          if (respostaBoaParaGuardar(resp, true)) {
            const copia = resp.clone();
            event.waitUntil(
              caches.open(CACHE_VERSION).then((cache) => cache.put(req, copia))
            );
          }
          return resp;
        })
        .catch(async () => {
          // sem internet: entrega a última versão boa que vimos desta página,
          // e se nunca abrimos esta página, pelo menos o painel de estoque
          const guardado = await caches.match(req, { ignoreSearch: true });
          return guardado || caches.match('./index.html', { ignoreSearch: true });
        })
    );
    return;
  }

  // Estático (ícone, manifest): cache-first, com atualização em segundo plano.
  event.respondWith(
    caches.match(req).then((cacheado) => {
      const buscaRede = fetch(req)
        .then((resp) => {
          if (respostaBoaParaGuardar(resp, false)) {
            const copia = resp.clone();
            event.waitUntil(
              caches.open(CACHE_VERSION).then((cache) => cache.put(req, copia))
            );
          }
          return resp;
        })
        .catch(() => cacheado);
      return cacheado || buscaRede;
    })
  );
});
