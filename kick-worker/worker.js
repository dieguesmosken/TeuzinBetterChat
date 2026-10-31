// Cloudflare Worker: guarda o SEGREDO do app da Kick e faz a troca de token do login (OAuth + PKCE).
// Tambem repassa algumas chamadas da API da Kick, para o navegador nao esbarrar em CORS.
//
// Segredos (NUNCA no codigo; configure com `wrangler secret put`):
//   KICK_CLIENT_ID, KICK_CLIENT_SECRET
//   YT_CLIENT_ID, YT_CLIENT_SECRET   (app do Google/YouTube; rotas /yt/*)
// Variavel (wrangler.toml):
//   ALLOWED_ORIGIN = "https://www.teuzin.com.br"   (so esta origem pode usar o worker)

const TOKEN_URL = 'https://id.kick.com/oauth/token';
const REVOKE_URL = 'https://id.kick.com/oauth/revoke';
const API = 'https://api.kick.com/public/v1/';
const GOOGLE_TOKEN = 'https://oauth2.googleapis.com/token';
const GOOGLE_REVOKE = 'https://oauth2.googleapis.com/revoke';
// Clips do Twitch: o link de video direto nao existe na API oficial (Helix). Esta rota usa o mesmo
// endpoint interno que o site do Twitch usa para tocar clips. NAO e API oficial: pode mudar ou quebrar sem aviso.
const TW_GQL = 'https://gql.twitch.tv/gql';
const TW_WEB_CID = 'kimne78kx3ncx6brgo4mv6wki5h1ko';
const TW_CLIP_HASH = '36b89d2507fce29e5ca551df756d27c1cfe079e2609642b4390aa4c35796eb11';

// so estas rotas da API podem ser repassadas (metodo + caminho)
const ROTAS = [
  ['GET', /^users$/], ['GET', /^channels$/],
  ['POST', /^chat$/], ['DELETE', /^chat\/[A-Za-z0-9_-]+$/],
  ['POST', /^moderation\/bans$/], ['DELETE', /^moderation\/bans$/]
];

function cors(env, req) {
  const origem = req.headers.get('Origin') || '';
  const ok = origem && origem === (env.ALLOWED_ORIGIN || '');
  return {
    ok,
    h: {
      'Access-Control-Allow-Origin': ok ? origem : 'null',
      'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Max-Age': '86400', 'Vary': 'Origin'
    }
  };
}
const json = (obj, status, h) => new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', ...h } });

async function trocar(env, corpo) {
  const r = await fetch(TOKEN_URL, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(corpo) });
  const t = await r.text();
  return new Response(t, { status: r.status, headers: { 'Content-Type': 'application/json' } });
}

export default {
  async fetch(req, env) {
    const c = cors(env, req);
    if (req.method === 'OPTIONS') return new Response(null, { status: c.ok ? 204 : 403, headers: c.h });
    if (!c.ok) return json({ erro: 'origem nao permitida' }, 403, c.h);
    const url = new URL(req.url);
    try {
      if (req.method === 'POST' && url.pathname === '/token') {
        const b = await req.json();
        if (!b.code || !b.code_verifier || !b.redirect_uri) return json({ erro: 'faltam campos' }, 400, c.h);
        const r = await trocar(env, { grant_type: 'authorization_code', client_id: env.KICK_CLIENT_ID, client_secret: env.KICK_CLIENT_SECRET,
          redirect_uri: b.redirect_uri, code_verifier: b.code_verifier, code: b.code });
        return new Response(r.body, { status: r.status, headers: { 'Content-Type': 'application/json', ...c.h } });
      }
      if (req.method === 'POST' && url.pathname === '/refresh') {
        const b = await req.json();
        if (!b.refresh_token) return json({ erro: 'falta refresh_token' }, 400, c.h);
        const r = await trocar(env, { grant_type: 'refresh_token', client_id: env.KICK_CLIENT_ID, client_secret: env.KICK_CLIENT_SECRET, refresh_token: b.refresh_token });
        return new Response(r.body, { status: r.status, headers: { 'Content-Type': 'application/json', ...c.h } });
      }
      if (req.method === 'POST' && url.pathname === '/revoke') {
        const b = await req.json();
        if (!b.token) return json({ erro: 'falta token' }, 400, c.h);
        const r = await fetch(REVOKE_URL + '?token=' + encodeURIComponent(b.token) + '&token_hint_type=' + encodeURIComponent(b.hint || 'access_token'), { method: 'POST' });
        return json({ ok: r.ok }, r.ok ? 200 : 502, c.h);
      }
      // ---- YouTube / Google (so a troca de token precisa do segredo; a API do YouTube e chamada direto do navegador) ----
      if (req.method === 'POST' && url.pathname === '/yt/token') {
        const b = await req.json();
        if (!b.code || !b.redirect_uri) return json({ erro: 'faltam campos' }, 400, c.h);
        const corpo = { grant_type: 'authorization_code', client_id: env.YT_CLIENT_ID, client_secret: env.YT_CLIENT_SECRET, redirect_uri: b.redirect_uri, code: b.code };
        if (b.code_verifier) corpo.code_verifier = b.code_verifier;
        const r = await fetch(GOOGLE_TOKEN, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(corpo) });
        return new Response(await r.text(), { status: r.status, headers: { 'Content-Type': 'application/json', ...c.h } });
      }
      if (req.method === 'POST' && url.pathname === '/yt/refresh') {
        const b = await req.json();
        if (!b.refresh_token) return json({ erro: 'falta refresh_token' }, 400, c.h);
        const r = await fetch(GOOGLE_TOKEN, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ grant_type: 'refresh_token', client_id: env.YT_CLIENT_ID, client_secret: env.YT_CLIENT_SECRET, refresh_token: b.refresh_token }) });
        return new Response(await r.text(), { status: r.status, headers: { 'Content-Type': 'application/json', ...c.h } });
      }
      if (req.method === 'POST' && url.pathname === '/yt/revoke') {
        const b = await req.json();
        if (!b.token) return json({ erro: 'falta token' }, 400, c.h);
        const r = await fetch(GOOGLE_REVOKE, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ token: b.token }) });
        return json({ ok: r.ok }, r.ok ? 200 : 502, c.h);
      }
      // ---- Twitch: URL de video direto de um clip (usada so pelo overlay so-clip.html) ----
      if (req.method === 'GET' && url.pathname.startsWith('/clip/')) {
        const slug = url.pathname.slice(6);
        if (!/^[A-Za-z0-9_-]{5,120}$/.test(slug)) return json({ erro: 'slug invalido' }, 400, c.h);
        const r = await fetch(TW_GQL, { method: 'POST', headers: { 'Client-Id': TW_WEB_CID, 'Content-Type': 'application/json' },
          body: JSON.stringify([{ operationName: 'VideoAccessToken_Clip', variables: { platform: 'web', slug },
            extensions: { persistedQuery: { version: 1, sha256Hash: TW_CLIP_HASH } } }]) });
        if (!r.ok) return json({ erro: 'twitch ' + r.status }, 502, c.h);
        const d = (await r.json())[0]?.data?.clip;
        const tok = d?.playbackAccessToken;
        const qs = (d?.videoQualities || []).slice().sort((a, b) => (+b.quality || 0) - (+a.quality || 0));
        const q = qs.find(x => +x.quality <= 1080) || qs[0];
        if (!tok || !q) return json({ erro: 'clip sem video' }, 404, c.h);
        return new Response(JSON.stringify({ url: q.sourceURL + '?sig=' + tok.signature + '&token=' + encodeURIComponent(tok.value), quality: q.quality }),
          { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...c.h } });
      }
      if (url.pathname.startsWith('/api/')) {
        const caminho = url.pathname.slice(5);
        if (!ROTAS.some(([m, re]) => m === req.method && re.test(caminho))) return json({ erro: 'rota nao permitida' }, 403, c.h);
        const auth = req.headers.get('Authorization') || '';
        if (!/^Bearer \S+$/.test(auth)) return json({ erro: 'sem token' }, 401, c.h);
        const init = { method: req.method, headers: { Authorization: auth, 'Content-Type': 'application/json' } };
        if (req.method !== 'GET') init.body = await req.text();
        const r = await fetch(API + caminho + url.search, init);
        return new Response(await r.text(), { status: r.status, headers: { 'Content-Type': r.headers.get('Content-Type') || 'application/json', ...c.h } });
      }
      return json({ erro: 'nao encontrado' }, 404, c.h);
    } catch (e) { return json({ erro: 'falha interna' }, 500, c.h); }
  }
};
