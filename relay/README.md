# Relay local (Kick e TikTok)

Roda **no seu computador** e leva o chat para o `chat.html` e para o `painel.html`.

**Por que o Kick precisa disso:** em 13/10/2026 o Kick desligou o Pusher e passou o chat para outro sistema
(Centrifugo) que recusa navegadores vindos de outros sites. Um programa local não tem essa limitação.
O TikTok não tem API oficial e usa uma biblioteca não oficial (experimental).

1. Instale o [Node.js](https://nodejs.org).
2. Nesta pasta: `npm install`
3. Rode: `node relay.js --kick seucanal` (aceita o nome do canal ou o número da sala)
   e, se quiser o TikTok junto: `node relay.js --kick seucanal --tiktok seu_usuario`
4. No link do chat acrescente `&relay=ws://localhost:8787`. No painel, o campo "Relay local" já vem com esse endereço.

O relay só escuta em `127.0.0.1`. Pode quebrar quando Kick/TikTok mudarem algo (os dois são não oficiais).
Dá para usar o mesmo relay para outras fontes: basta enviar JSON `{plat, id, login, nome, texto, avatar, badges, destaque}`.
