# 🐺 TeuzinBetterChat 1.0

Widget de chat da Twitch **leve, sem login e sem token**, feito para a *Fonte de navegador* do OBS. Um único arquivo HTML, sem instalação e sem dependências.

![Chat em modo demo](docs/chat-demo.png)

## Recursos

- Lê o chat direto da Twitch por leitura anônima (IRC via WebSocket). Não precisa de conta, token nem Client-ID.
- **Selos oficiais** (broadcaster, mod, VIP, sub, founder, **Lead Moderator**, etc.) pelas APIs públicas da Twitch, com plano B pela IVR.
- Emotes da Twitch e também **7TV, BTTV e FFZ** (globais e do canal).
- **Foto de perfil** de quem fala (opcional).
- Anúncios, subs, resubs e outros avisos do canal (USERNOTICE).
- Mensagem apagada, timeout e ban removem a mensagem da tela.
- Esconde bots e comandos `!` (configurável), destaca primeira mensagem.
- Mensagens somem sozinhas depois de N segundos.
- **Configurador visual** que gera o link pronto para colar no OBS.

![Configurador](docs/configurador.png)

## Como usar (online, pelo GitHub Pages) — recomendado

Com o GitHub Pages ligado, o configurador já entrega um **link da internet** pronto para o OBS, sem precisar de arquivo no PC:

1. Abra `https://SEU-USUARIO.github.io/TeuzinBetterChat/` (o `index.html` leva ao configurador).
2. Ajuste as opções e clique em **Copiar link**.
3. No OBS: **Fontes → + → Navegador**, **desmarque** "Arquivo local" e cole o link na URL.

Para ligar o Pages: *Settings → Pages → Deploy from a branch → `main` / `(root)`*.

## Como usar (offline, arquivos locais)

1. Baixe esta pasta (ou clone o repositório) e deixe `chat.html` e `config-chat.html` juntos.
2. Abra `config-chat.html` no navegador, escolha o canal e as opções e clique em **Copiar link**.
3. No OBS: **Fontes → + → Navegador**.
   - **Desmarque** "Arquivo local" e cole o link copiado na URL.
   - Largura e altura à sua escolha (ex.: 480 × 900), e marque "Atualizar navegador quando a cena ficar ativa".
4. Para testar sem estar ao vivo, use `demo=1` no link.

Se preferir apontar para o arquivo, marque "Arquivo local" e escolha `chat.html`; os parâmetros vão depois do `?` na URL.

## Parâmetros da URL

| Parâmetro | Padrão | O que faz |
|---|---|---|
| `channel` | `teuzin0dev` | Canal da Twitch |
| `size` | `20` | Tamanho da letra (px) |
| `max` | `25` | Máximo de mensagens na tela |
| `fade` | `45` | Some depois de N segundos (`0` = nunca) |
| `emote` | `1.5` | Tamanho dos emotes |
| `hide` | lista de bots | Contas escondidas, separadas por vírgula. `hide=` vazio mostra todos os bots |
| `cmds` | `0` | `1` mostra comandos que começam com `!` |
| `ext` | `1` | `0` desliga emotes 7TV/BTTV/FFZ |
| `avatar` | `0` | `1` mostra a foto de perfil |
| `debug` | `0` | `1` mostra o nome técnico de cada selo |
| `demo` | `0` | `1` usa mensagens de teste, sem conectar |

Exemplo:

```
chat.html?channel=seucanal&size=24&max=20&fade=60&avatar=1
```

## Dúvidas comuns

- **Selos ou emotes não aparecem:** atualize o cache da fonte no OBS e use `debug=1` para ver quais selos foram encontrados.
- **Respostas de bots não aparecem:** use `hide=` (vazio) e, para comandos, `cmds=1`.
- **Fotos de perfil:** vêm de serviços públicos (unavatar, com plano B pela IVR). Quem não tiver foto aparece com a inicial do nome.

## Privacidade

O widget só **lê** o chat público. Nada é enviado ao canal e nenhuma credencial é guardada. As APIs usadas são todas públicas (Twitch badges, IVR, 7TV, BTTV, FFZ, unavatar).

## Licença

[MIT](LICENSE). Feito com 💜 pela matilha do Teyo.
