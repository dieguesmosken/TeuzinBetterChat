// Worker minimo para o overlay "Clip do !so" (so-clip.html): devolve o link de VIDEO de um clip do Twitch.
//
// ATENCAO: o link de video direto nao existe na API oficial do Twitch (Helix). Este worker usa o mesmo
// endereco interno que o site do Twitch usa para tocar clips. Nao e API oficial: pode mudar ou parar sem aviso.
//
// Variavel (opcional): ALLOWED_ORIGIN = site que pode usar o worker.
//   Padrao: https://www.teuzin.com.br (onde o overlay publicado roda). Se voce hospeda o so-clip.html em
//   outro lugar, defina ALLOWED_ORIGIN com o endereco desse site (sem barra no final).

const TW_GQL = 'https://gql.twitch.tv/gql';
const TW_WEB_CID = 'kimne78kx3ncx6brgo4mv6wki5h1ko';
const TW_CLIP_HASH = '36b89d2507fce29e5ca551df756d27c1cfe079e2609642b4390aa4c35796eb11';

const json = (obj, status, h) => new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...h } });

export default {
  async fetch(req, env) {
    const permitida = env.ALLOWED_ORIGIN || 'https://www.teuzin.com.br';
    const origem = req.headers.get('Origin') || '';
    const ok = origem === permitida;
    const h = { 'Access-Control-Allow-Origin': ok ? origem : 'null', 'Access-Control-Allow-Methods': 'GET,OPTIONS', 'Access-Control-Max-Age': '86400', 'Vary': 'Origin' };
    if (req.method === 'OPTIONS') return new Response(null, { status: ok ? 204 : 403, headers: h });
    if (!ok) return json({ erro: 'origem nao permitida' }, 403, h);

    const url = new URL(req.url);
    if (req.method !== 'GET' || !url.pathname.startsWith('/clip/')) return json({ erro: 'nao encontrado' }, 404, h);
    const slug = url.pathname.slice(6);
    if (!/^[A-Za-z0-9_-]{5,120}$/.test(slug)) return json({ erro: 'slug invalido' }, 400, h);

    try {
      const r = await fetch(TW_GQL, {
        method: 'POST',
        headers: { 'Client-Id': TW_WEB_CID, 'Content-Type': 'application/json' },
        body: JSON.stringify([{ operationName: 'VideoAccessToken_Clip', variables: { platform: 'web', slug },
          extensions: { persistedQuery: { version: 1, sha256Hash: TW_CLIP_HASH } } }])
      });
      if (!r.ok) return json({ erro: 'twitch ' + r.status }, 502, h);
      const d = (await r.json())[0]?.data?.clip;
      const tok = d?.playbackAccessToken;
      const qs = (d?.videoQualities || []).slice().sort((a, b) => (+b.quality || 0) - (+a.quality || 0));
      const q = qs.find(x => +x.quality <= 1080) || qs[0];
      if (!tok || !q) return json({ erro: 'clip sem video' }, 404, h);
      return json({ url: q.sourceURL + '?sig=' + tok.signature + '&token=' + encodeURIComponent(tok.value), quality: q.quality }, 200, h);
    } catch (e) { return json({ erro: 'falha interna' }, 500, h); }
  }
};
