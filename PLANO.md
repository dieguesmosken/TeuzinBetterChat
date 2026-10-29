# Plano: TeuzinBetterChat com login Twitch e multichat

Branch de trabalho: `feat/multichat-auth`. A `main` continua com a versão atual (chat anônimo da Twitch).

## Objetivos
1. **Login com a Twitch (OAuth)** para o dono do canal.
2. **Multichat** unindo Twitch, YouTube, Kick e TikTok numa só tela, com o selo da plataforma em cada mensagem.

## O que cada plataforma permite

| Plataforma | Como ler o chat | Precisa de servidor? | Observação |
|---|---|---|---|
| Twitch | IRC por WebSocket (já funciona). Com login: token do usuário, dá para ler badges, bits, pontos do canal e enviar mensagens | Não | Login via OAuth *implicit flow* (só navegador), exige um Client ID registrado no console de desenvolvedor da Twitch |
| YouTube | YouTube Data API (`liveChatMessages.list`) por polling | Não, mas precisa de API key ou OAuth | Tem cota diária; o polling respeita o intervalo que a API devolve |
| Kick | WebSocket público da sala (Pusher) para leitura | Não | Não é API oficial estável; pode mudar. Existe API oficial com OAuth para outras funções |
| TikTok | Não existe API oficial de chat ao vivo | **Sim** | Só por bibliotecas não oficiais (ex.: tiktok-live-connector), que rodam em Node. Um site estático não consegue |

## Arquitetura proposta
- Cada plataforma vira um **adaptador** que emite mensagens no mesmo formato: `{plataforma, usuario, cor, badges, texto, emotes, avatar, ts}`.
- O `chat.html` só renderiza esse formato (filtros, avatares e emotes continuam iguais).
- Tudo que roda no navegador (Twitch, YouTube, Kick) continua funcionando no GitHub Pages.
- O TikTok entra por um **relay opcional** (pequeno servidor Node que o próprio streamer roda) que repassa as mensagens por WebSocket local. Se o relay não estiver ligado, o TikTok simplesmente não aparece.

## Parâmetros novos do link (rascunho)
`?twitch=canal&yt=VIDEO_ID&kick=canal&tiktok=@usuario&relay=ws://localhost:8787&token=...&plat=1`

## Segurança
- Tokens e chaves **nunca** vão para o repositório. Ficam no navegador de quem usa (localStorage) ou no link que a pessoa gera.
- O link do OBS com token deve ser tratado como senha.

## Etapas
1. Formato único de mensagem + refatorar o Twitch como adaptador (sem mudar o visual).
2. Login Twitch (OAuth) no configurador e leitura autenticada.
3. Adaptador Kick.
4. Adaptador YouTube.
5. Selos de plataforma + filtros por plataforma no configurador.
6. Relay opcional para TikTok.
7. Documentação e pré-lançamento `v2.0.0-beta.1`.

## Pendências para decidir
- Quem registra o Client ID da Twitch (o app do `teuzin0dev`, ou cada streamer cria o seu).
- Se o TikTok é prioridade, já que exige servidor.
