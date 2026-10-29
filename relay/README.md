# Relay do TikTok (experimental)

O TikTok não tem API oficial para ler o chat de uma live. Por isso o TikTok no TeuzinBetterChat precisa deste
pequeno programa, que roda **no seu computador** e usa uma biblioteca não oficial.

1. Instale o [Node.js](https://nodejs.org).
2. Nesta pasta: `npm install`
3. Com a live do TikTok aberta: `node tiktok-relay.js seu_usuario`
4. No link do chat, acrescente `&relay=ws://localhost:8787`

Avisos: pode quebrar quando o TikTok mudar algo, não foi testado ao vivo e o relay só escuta em `127.0.0.1`.
Dá para usar o mesmo relay para outras fontes: basta enviar JSON `{plat, id, login, nome, texto, avatar, badges, destaque}`.
