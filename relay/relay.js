// Relay local do TeuzinBetterChat: leva o chat do KICK e do TIKTOK para o chat.html e para o painel.
//
// Por que existe: em 13/10/2026 o Kick desligou o Pusher e passou o chat para outro sistema (Centrifugo)
// que recusa navegadores vindos de outros sites. Um programa no seu computador nao tem essa limitacao.
// O TikTok nao tem API oficial; usa a biblioteca nao oficial tiktok-live-connector (EXPERIMENTAL).
//
// Uso:   cd relay && npm install
//        node relay.js --kick id_da_sala_ou_nome_do_canal
//        node relay.js --kick teuzin0dev --tiktok seu_usuario
// No chat.html use &relay=ws://localhost:8787 ; no painel preencha "Relay" com o mesmo endereco.
const { WebSocketServer } = require('ws');

const arg = n => { const i = process.argv.indexOf('--' + n); return i > 0 ? (process.argv[i + 1] || '') : ''; };
const usuario = (arg('tiktok') || process.env.TIKTOK_USER || '').replace(/^@/, '');
const kick = (arg('kick') || process.env.KICK_SALA || '').trim();
const porta = parseInt(process.env.PORT || '8787', 10);
if (!usuario && !kick) { console.error('Uso: node relay.js --kick sala_ou_canal [--tiktok usuario]'); process.exit(1); }

// Local: escuta so neste computador (127.0.0.1). Na nuvem (Render): defina HOST=0.0.0.0 (ja vem pelo render.yaml).
// ALLOWED_ORIGINS (opcional): sites autorizados a conectar, separados por virgula. Vazio = qualquer um.
const http = require('http');
const host = process.env.HOST || '127.0.0.1';
const origensOk = (process.env.ALLOWED_ORIGINS || '').split(',').map(x => x.trim()).filter(Boolean);
const servidor = http.createServer((req, res) => { res.writeHead(200, { 'content-type': 'text/plain' }); res.end('TeuzinBetterChat relay ok'); });
const wss = new WebSocketServer({ server: servidor, verifyClient: ({ origin }) => !origensOk.length || !origin || origensOk.includes(origin) });
servidor.listen(porta, host);
const enviar = obj => { const s = JSON.stringify(obj); wss.clients.forEach(c => { if (c.readyState === 1) c.send(s); }); };
console.log(`Relay ouvindo em ${host}:${porta}`);

function ligarTikTok() {
  const lib = require('tiktok-live-connector');
  const Conn = lib.TikTokLiveConnection || lib.WebcastPushConnection;
  ligar(Conn);
}
function ligar(Conn) {
  const live = new Conn(usuario);
  live.connect().then(() => console.log('Conectado na live de @' + usuario))
    .catch(e => { console.error('Falha ao conectar (a live esta aberta?):', e && e.message || e); setTimeout(() => ligar(Conn), 15000); });
  live.on('chat', d => enviar({
    plat: 'tiktok', id: String(d.msgId || ''), login: d.uniqueId, nome: d.nickname || d.uniqueId,
    texto: d.comment, avatar: d.profilePictureUrl || '',
    badges: d.isModerator ? 'moderator/1' : (d.isSubscriber ? 'subscriber/1' : '')
  }));
  live.on('gift', d => { if (d.giftType === 1 && !d.repeatEnd) return; enviar({
    plat: 'tiktok', login: d.uniqueId, nome: d.nickname || d.uniqueId, texto: `🎁 enviou ${d.repeatCount || 1}x ${d.giftName || 'presente'}`, destaque: true, avatar: d.profilePictureUrl || '' }); });
  live.on('disconnected', () => { console.log('Desconectado; tentando de novo…'); setTimeout(() => ligar(Conn), 10000); });
}
if (usuario) ligarTikTok();

// ---------- Kick (Centrifugo) ----------
// Fluxo observado no site da Kick (nao documentado oficialmente, pode mudar):
//   1) POST web.kick.com/api/v1/realtime/connection            -> endereco do WebSocket
//   2) POST web.kick.com/api/v1/realtime/auth/connection       -> token de visitante (~45 min)
//   3) WebSocket + {connect:{token}} + {subscribe:{channel:'chatrooms.<sala>.v2'}}
// Sem cabecalho Origin (um navegador sempre manda o do site e e recusado).
const WS = require('ws');
const UA = 'Mozilla/5.0 (TeuzinBetterChat relay)';
async function postJson(url, corpo) {
  const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json', 'user-agent': UA, origin: 'https://kick.com', referer: 'https://kick.com/' }, body: JSON.stringify(corpo || {}) });
  const txt = await r.text();
  if (!r.ok) throw new Error(url + ' -> HTTP ' + r.status + ' ' + txt.slice(0, 200));
  try { return JSON.parse(txt); } catch (e) { throw new Error(url + ' -> resposta nao e JSON: ' + txt.slice(0, 120)); }
}
// procura um valor em qualquer nivel da resposta (o formato nao e documentado)
function procura(o, teste, prof = 0) {
  if (o == null || prof > 6) return '';
  if (typeof o === 'string') return teste(o) ? o : '';
  if (typeof o !== 'object') return '';
  for (const k of Object.keys(o)) { const r = typeof o[k] === 'string' ? (teste(o[k], k) ? o[k] : '') : procura(o[k], teste, prof + 1); if (r) return r; }
  return '';
}
async function salaDoKick(entrada) {
  if (/^\d+$/.test(entrada)) return entrada;
  const r = await fetch('https://kick.com/api/v2/channels/' + encodeURIComponent(entrada), { headers: { 'user-agent': UA, accept: 'application/json' } });
  if (!r.ok) throw new Error('nao achei o canal ' + entrada + ' (HTTP ' + r.status + '); use o numero da sala');
  const j = await r.json(); return String(j.chatroom && j.chatroom.id);
}
const achar = (o, nomes) => { for (const n of nomes) if (o && typeof o[n] === 'string') return o[n]; return ''; };
const BADGES_KICK = ['broadcaster', 'moderator', 'vip', 'og', 'founder', 'subscriber', 'verified'];

function tratarKick(ev, dado) {
  if (ev === 'App\\Events\\ChatMessageEvent') {
    const s = dado.sender || {}, idn = s.identity || {}, texto = String(dado.content || '');
    const partes = []; const re = /\[emote:(\d+):([^\]]+)\]/g; let ult = 0, mm;
    while ((mm = re.exec(texto))) {
      if (mm.index > ult) partes.push({ v: texto.slice(ult, mm.index) });
      partes.push({ e: 'https://files.kick.com/emotes/' + mm[1] + '/fullsize', a: mm[2] });
      ult = re.lastIndex;
    }
    if (ult < texto.length) partes.push({ v: texto.slice(ult) });
    enviar({ plat: 'kick', id: String(dado.id || ''), uid: s.id, login: String(s.slug || s.username || '').toLowerCase(), nome: s.username || s.slug,
      cor: idn.color || '', texto, partes, badges: (idn.badges || []).map(b => b.type).filter(t => BADGES_KICK.includes(t)).map(t => t + '/1').join(',') });
  } else if (ev === 'App\\Events\\MessageDeletedEvent') {
    const id = dado.message && dado.message.id || dado.id; if (id) enviar({ apagar: String(id) });
  }
}

let tentativas = 0;
async function ligarKick(sala) {
  let ws, renova;
  try {
    const clientId = require('crypto').randomUUID();
    const variantes = [
      { client: { type: 'web', id: clientId }, accepted_providers: [{ provider: 'centrifugo' }] },
      { client: { type: 'web', id: clientId }, accepted_providers: [{ provider: 'centrifugo' }, { provider: 'pusher' }] },
      { client_id: clientId, accepted_providers: [{ provider: 'centrifugo' }] },
      { client: { type: 'web', id: clientId }, accepted_providers: ['centrifugo'] }
    ];
    // O passo de "descritor" da Kick recusa o pedido (HTTP 400) e nao e documentado; tentamos, mas nao dependemos dele.
    let desc = null;
    for (const v of variantes) { try { desc = await postJson('https://web.kick.com/api/v1/realtime/connection', v); break; } catch (e) { /* segue */ } }
    if (desc) console.log('Kick: descritor recebido:', JSON.stringify(desc).slice(0, 300));
    const conhecidos = ['wss://realtime.us-east-1.platform.kick.com/connection/websocket', 'wss://realtime.us-west-2.platform.kick.com/connection/websocket'];
    const url = procura(desc, v => /^wss?:\/\//.test(v)) || conhecidos[tentativas % conhecidos.length];
    const pegaToken = async () => {
      let ultimo;
      for (const corpo of [{ client_id: clientId }, { client: { type: 'web', id: clientId } }]) {
        try { const a = await postJson('https://web.kick.com/api/v1/realtime/auth/connection', corpo);
          if (process.env.DEBUG) console.log('auth:', JSON.stringify(a).slice(0, 80) + '…');
          const t = procura(a, (v, k) => (k === 'token' || k === 'jwt') || /^eyJ/.test(v)); if (t) return t; } catch (e) { ultimo = e; }
      }
      throw ultimo || new Error('a Kick nao devolveu token');
    };
    const token = await pegaToken();
    ws = new WS(url);   // sem Origin
    let id = 0, vivo = Date.now();
    ws.on('open', () => { ws.send(JSON.stringify({ connect: { token, name: 'js' }, id: ++id })); });
    ws.on('message', buf => {
      vivo = Date.now();
      for (const linha of String(buf).split('\n')) {
        if (!linha.trim()) continue;
        if (linha.trim() === '{}') { ws.send('{}'); continue; }   // ping -> pong
        let m; try { m = JSON.parse(linha); } catch (e) { continue; }
        if (m.connect) { console.log('Kick: conectado; entrando na sala ' + sala); ws.send(JSON.stringify({ subscribe: { channel: 'chatrooms.' + sala + '.v2' }, id: ++id })); tentativas = 0; }
        else if (m.subscribe) console.log('Kick: ouvindo a sala ' + sala + ' ✓');
        else if (m.error) console.error('Kick: erro', JSON.stringify(m.error));
        else if (m.push && m.push.pub && m.push.pub.data) {
          const d = m.push.pub.data; let dado = d.data; try { if (typeof dado === 'string') dado = JSON.parse(dado); } catch (e) { continue; }
          tratarKick(d.event, dado || {});
        }
      }
    });
    // renova o token antes de vencer (45 min)
    renova = setInterval(async () => { try { const t = await pegaToken(); if (t && ws.readyState === 1) ws.send(JSON.stringify({ refresh: { token: t }, id: ++id })); } catch (e) { console.error('Kick: falha ao renovar token', e.message); } }, 40 * 60 * 1000);
    const vigia = setInterval(() => { if (Date.now() - vivo > 60000) ws.terminate(); }, 15000);
    ws.on('close', c => { clearInterval(renova); clearInterval(vigia); console.log('Kick: desconectado (' + c + '); tentando de novo…'); setTimeout(() => ligarKick(sala), Math.min(30000, 3000 * ++tentativas)); });
    ws.on('error', e => console.error('Kick: erro de conexao', e.message));
  } catch (e) {
    console.error('Kick: falha ao conectar:', e.message); setTimeout(() => ligarKick(sala), Math.min(60000, 5000 * ++tentativas));
  }
}
if (kick) salaDoKick(kick).then(ligarKick).catch(e => console.error('Kick:', e.message));
