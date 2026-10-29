// Relay do TikTok para o TeuzinBetterChat (EXPERIMENTAL, nao testado ao vivo).
// O TikTok nao tem API oficial de chat; este script usa a biblioteca nao oficial tiktok-live-connector
// e repassa as mensagens por WebSocket local para o chat.html (parametro &relay=ws://localhost:8787).
//
// Uso:   cd relay && npm install && node tiktok-relay.js seu_usuario_do_tiktok
const { WebSocketServer } = require('ws');
const lib = require('tiktok-live-connector');

const usuario = (process.argv[2] || process.env.TIKTOK_USER || '').replace(/^@/, '');
const porta = parseInt(process.env.PORT || '8787', 10);
if (!usuario) { console.error('Uso: node tiktok-relay.js seu_usuario_do_tiktok'); process.exit(1); }

// escuta so neste computador (127.0.0.1)
const wss = new WebSocketServer({ host: '127.0.0.1', port: porta });
const enviar = obj => { const s = JSON.stringify(obj); wss.clients.forEach(c => { if (c.readyState === 1) c.send(s); }); };
console.log(`Relay ouvindo em ws://localhost:${porta}`);

const Conn = lib.TikTokLiveConnection || lib.WebcastPushConnection;
function ligar() {
  const live = new Conn(usuario);
  live.connect().then(() => console.log('Conectado na live de @' + usuario))
    .catch(e => { console.error('Falha ao conectar (a live esta aberta?):', e && e.message || e); setTimeout(ligar, 15000); });
  live.on('chat', d => enviar({
    plat: 'tiktok', id: String(d.msgId || ''), login: d.uniqueId, nome: d.nickname || d.uniqueId,
    texto: d.comment, avatar: d.profilePictureUrl || '',
    badges: d.isModerator ? 'moderator/1' : (d.isSubscriber ? 'subscriber/1' : '')
  }));
  live.on('gift', d => { if (d.giftType === 1 && !d.repeatEnd) return; enviar({
    plat: 'tiktok', login: d.uniqueId, nome: d.nickname || d.uniqueId, texto: `🎁 enviou ${d.repeatCount || 1}x ${d.giftName || 'presente'}`, destaque: true, avatar: d.profilePictureUrl || '' }); });
  live.on('disconnected', () => { console.log('Desconectado; tentando de novo…'); setTimeout(ligar, 10000); });
}
ligar();
