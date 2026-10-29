# Login da Kick: worker com o segredo do app

A Kick não deixa trocar o código de login por token sem o **segredo do aplicativo**, e esse segredo não pode ficar numa página.
Este pequeno worker (Cloudflare, plano grátis) guarda o segredo e faz a troca. Ele também repassa só estas chamadas da API da Kick:
`users`, `channels`, enviar chat, apagar mensagem e banir/timeout. Ele só aceita pedidos vindos da sua origem (`ALLOWED_ORIGIN`).

## Passo a passo
1. **App da Kick:** em kick.com → Configurações → Desenvolvedor, crie um aplicativo. Na URL de redirecionamento coloque o endereço do painel:
   `https://www.teuzin.com.br/TeuzinBetterChat/painel.html` (ou `/beta/painel.html` para testar). Anote o **Client ID** e o **Client Secret**.
2. **Cloudflare:** crie uma conta grátis em cloudflare.com.
3. **Publicar o worker** (precisa do Node.js), nesta pasta:
   ```
   npx wrangler login
   npx wrangler secret put KICK_CLIENT_ID
   npx wrangler secret put KICK_CLIENT_SECRET
   npx wrangler deploy
   ```
   Cole o Client ID e o Client Secret quando o `wrangler` pedir. **Nunca** coloque o segredo em arquivo, no GitHub ou numa conversa.
4. O `deploy` mostra o endereço do worker (`https://teuzinbetterchat-kick.SEU-USUARIO.workers.dev`). Cole esse endereço e o Client ID no `painel.html`.

## Segurança
- O segredo fica só nos "secrets" do Cloudflare.
- Os tokens de login ficam apenas no navegador de quem entrou.
- Se o segredo vazar, gere outro no painel de desenvolvedor da Kick e rode `wrangler secret put KICK_CLIENT_SECRET` de novo.
