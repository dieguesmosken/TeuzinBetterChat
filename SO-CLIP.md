# 🎬 Clip do !so — overlay para OBS

Quando alguém da sua live digita `!so nomedocanal`, o overlay toca na tela **um clip aleatório** daquele canal, com o nome do streamer e o título do clip, e some sozinho. Tem som (pelo OBS), cor, borda, emoji e posição personalizáveis, e dá para abaixar o jogo/música enquanto o clip toca.

É gratuito, de código aberto (MIT) e roda dentro do OBS, numa fonte de **Navegador**. Não instala nada no PC.

> **Status: beta.** Veja [Limitações e avisos](#limitações-e-avisos) antes de usar numa live importante.

- **Configurador (comece por aqui):** <https://www.teuzin.com.br/TeuzinBetterChat/beta/so-clip-config.html>
- **Termos de uso:** <https://www.teuzin.com.br/TeuzinBetterChat/beta/termos.html> · **Privacidade:** <https://www.teuzin.com.br/TeuzinBetterChat/beta/privacidade.html>

---

## Índice

1. [Como funciona](#como-funciona)
2. [Começo rápido (5 minutos)](#começo-rápido-5-minutos)
3. [O configurador](#o-configurador)
4. [Link curto e código de configuração](#link-curto-e-código-de-configuração)
5. [Prévia sem clip real](#prévia-sem-clip-real)
6. [Abaixar o jogo/música quando o clip toca](#abaixar-o-jogomúsica-quando-o-clip-toca)
7. [Todas as opções da URL](#todas-as-opções-da-url)
8. [Seu próprio worker (opcional)](#seu-próprio-worker-opcional)
9. [Problemas comuns](#problemas-comuns)
10. [Privacidade e termos](#privacidade-e-termos)
11. [Limitações e avisos](#limitações-e-avisos)

---

## Como funciona

1. O overlay lê o **chat público** do seu canal (conexão anônima, só leitura) e espera o comando (`!so` por padrão) de um **moderador** (ou VIP/todos, você escolhe).
2. Ele usa o **seu login da Twitch** (autorizado uma vez, sem permissão de escrita) para buscar os clips do canal citado na API oficial.
3. Para o vídeo tocar **com som e sem o aviso de conteúdo maduro** do player embutido, ele pede o endereço do vídeo a um pequeno serviço (worker da Cloudflare). Veja [Limitações](#limitações-e-avisos).
4. O clip toca num cartão na tela e some quando acaba (ou ao chegar no limite de segundos).
5. Vários `!so` seguidos entram numa fila.

## Começo rápido (5 minutos)

1. Abra o [configurador](https://www.teuzin.com.br/TeuzinBetterChat/beta/so-clip-config.html) e escreva o **seu canal** da Twitch.
2. Escolha cor, borda, emoji etc. e clique em **Copiar URL** (ou em **Gerar link curto**).
3. No OBS: **Fontes → + → Navegador**. Cole a URL. Largura **960**, altura **540**. Marque **Controlar áudio via OBS** e confirme.
4. Clique com o botão direito na fonte → **Interagir** → **Entrar com a Twitch** e autorize. Isso é feito **uma vez**: o OBS lembra. A tela de autorização do app da Twitch sempre aparece (assim o login é explícito); no configurador, **Sair** apaga o login e também revoga o acesso na Twitch.
5. Arraste/redimensione a fonte para onde o clip deve aparecer. Ela fica invisível até alguém usar o comando.
6. Teste: um moderador digita `!so nomedeumcanal` no seu chat. Se preferir, antes use o botão **Ver prévia do cartão**.
7. (Recomendado) Configure o [compressor](#abaixar-o-jogomúsica-quando-o-clip-toca) para o jogo/música abaixarem enquanto o clip toca.

> O login da Twitch no OBS é **separado** do seu navegador comum. Faça o passo 4 dentro do OBS.

## O configurador

Em <https://www.teuzin.com.br/TeuzinBetterChat/beta/so-clip-config.html> você ajusta:

| Opção | O que faz |
|---|---|
| Canal | O **seu** canal (onde o chat é lido). |
| Comando | Padrão `!so`. Pode ser outro, como `!clip`. |
| Quem pode usar | Só moderadores (e você), moderadores + VIPs, ou todo mundo. |
| Cor de destaque, borda, cantos | Aparência do cartão. |
| Emoji | O emoji antes do nome (ou desligue). |
| Cor do nome / do título | Cor do nome do canal e do título do clip. |
| Mostrar nome / título | Liga ou desliga cada um. |
| Volume e duração máxima | Volume do clip (0–100%) e limite de segundos. |
| Endereço do worker | Deixe o padrão ou use o seu. |

Botões: **Copiar URL**, **Gerar link curto**, **Ver prévia do cartão** e **Testar no navegador** (toca um clip real de um canal que você escolher; no navegador comum o som pode vir mudo por regra do navegador, no OBS toca com som).

As suas escolhas ficam salvas **só no seu navegador**.

## Link curto e código de configuração

A URL completa fica longa. Há duas formas de encurtar:

**1. Código de configuração `?s=`** — todas as opções num texto só, separadas por vírgula, na ordem:

`canal, cor, borda, raio, volume, duração, nível, nome, título, comando, emoji, corNome, corTítulo`

Campo vazio = padrão; o que sobra no fim pode ser cortado. Exemplos:

```
so-clip.html?s=meucanal
so-clip.html?s=meucanal,5AD19A,4,10
so-clip.html?s=meucanal,,,,70,15,vip
```

(O emoji e o comando vão codificados, ex.: 🔥 = `%F0%9F%94%A5`. Prefira deixar o configurador gerar.)

**2. Link curto `?k=`** — o botão **Gerar link curto** guarda o código no worker e devolve algo como `so-clip.html?k=K1YkxB7c`.

- A **mesma configuração sempre gera o mesmo código** (nada de milhares de códigos repetidos).
- Mudou uma cor? Vira outro código. Os antigos continuam valendo.
- Só funciona no worker onde foi gerado (o padrão, ou o seu se ele tiver o armazenamento KV — veja [worker](#seu-próprio-worker-opcional)).
- O que fica guardado é só o **texto da configuração** (canal público, cores, opções). Nenhum login nem token.

## Prévia sem clip real

Para ver como o cartão ficará (tamanho, borda, emoji, cores, posição) sem esperar um `!so`:

- no configurador, clique em **Ver prévia do cartão**; ou
- acrescente `&previa=1` em qualquer URL do overlay (funciona com `?s=` e `?k=`).

A prévia usa um fundo de exemplo (“prévia — sem clip real”) e **não toca áudio**. Dá para usá-la no OBS para posicionar a fonte; depois **tire o `&previa=1`** e atualize o cache da fonte. Com `previa=t` o fundo fica transparente.

## Abaixar o jogo/música quando o clip toca

Para o público ouvir o clip, o resto do áudio precisa abaixar sozinho e voltar depois. No OBS isso é um **Compressor com sidechain** (o clip é o “gatilho”):

1. A fonte do overlay precisa ter **Controlar áudio via OBS** marcado (assim ela aparece no **Mixer de Áudio**).
2. No Mixer, na fonte que deve **abaixar** (jogo, música, “Áudio do desktop”), clique na engrenagem → **Filtros**.
3. **+ → Compressor** (nome sugerido: `Ducking clip`).
4. Em **Fonte de Sidechain/Ducking**, escolha a fonte do overlay.
5. Ponto de partida:

| Campo | Valor |
|---|---|
| Razão | `3:1` |
| Limiar | `-50 dB` |
| Ataque | `30 ms` |
| Liberação | `600 ms` |
| Ganho de saída | `0 dB` |

6. Repita nas outras fontes que devem abaixar. **Não** coloque o filtro na própria fonte do overlay.

**Ajuste fino** (teste com um `!so` real; a prévia não tem áudio):

- Não abaixa o bastante → limiar mais baixo (`-55 dB`) ou razão maior (`6:1`).
- Abaixa demais → limiar mais alto (`-40 dB`) ou razão menor (`2:1`).
- Volta rápido demais → liberação maior (`800–1000 ms`).
- O clip é baixinho e não dispara → aumente o volume do overlay ou baixe o limiar.
- Quer que o **microfone** também abaixe a música? Crie outro compressor na música com o microfone como sidechain. Os dois convivem.

## Todas as opções da URL

Se preferir montar à mão. Tudo é opcional além do canal.

| Parâmetro | Padrão | Descrição |
|---|---|---|
| `canal` | `teuzin0dev` | **Troque pelo seu** canal (onde o chat é lido). |
| `cmd` | `!so` | Comando que dispara o clip. |
| `nivel` | `mod` | `mod`, `vip` ou `todos`. |
| `max` | `20` | Duração máxima em segundos. |
| `vol` | `100` | Volume do clip, 0–100. |
| `cor` | `A970FF` | Cor da borda/destaque (hex, sem `#`). |
| `borda` | `3` | Espessura da borda em px. |
| `raio` | `18` | Cantos arredondados em px. |
| `emoji` | `💜` | Emoji antes do nome; `0` desliga. |
| `cn` | `FFFFFF` | Cor do nome do canal. |
| `ct` | `CDB6FF` | Cor do título do clip. |
| `nome` / `titulo` | ligado | `0` esconde o nome / o título. |
| `tam` | `100` | Largura do cartão em % da fonte. |
| `cx`, `cy` | `50`, `50` | Centro do cartão em % da fonte (padrão: centralizado). |
| `pos` | — | `esq`, `centro` ou `dir` (modo antigo, sem `cx`/`cy`). |
| `worker` | worker padrão | Endereço do seu worker. |
| `s` | — | Código de configuração (veja acima). |
| `k` | — | Link curto (veja acima). |
| `previa` | — | `1` mostra a prévia do cartão. |
| `teste` | — | `teste=nomedocanal` toca um clip desse canal (usa o login). |
| `debug` | — | Mostra mensagens de status na tela. |

## Seu próprio worker (opcional)

O worker padrão é gratuito, mas é **compartilhado**: se muita gente usar, o limite gratuito da Cloudflare pode acabar. Criar o seu leva uns 5 minutos, sem instalar nada:

👉 **[Guia: criar seu próprio worker](./so-clip-worker/README.md)** (pasta [`so-clip-worker/`](./so-clip-worker)).

O worker só aceita pedidos vindos do site do overlay (`ALLOWED_ORIGIN`). Se você hospedar o `so-clip.html` em outro endereço, ajuste essa variável. O **link curto** (`?k=`) precisa de um armazenamento KV ligado ao worker com o nome `CFG`; sem ele, use o código `?s=` (funciona em qualquer worker).

## Problemas comuns

| Sintoma | O que fazer |
|---|---|
| Nada aparece no `!so` | Veja se você fez **Entrar com a Twitch** pelo **Interagir** do OBS e se quem digitou é moderador. Teste com `&debug=1`. |
| Aparece “Falta autorizar o Twitch” | Faça o login (passo 4 do começo rápido). Vale uma vez. |
| Clip pequeno, sem som ou com aviso de conteúdo maduro | Está sem worker ou o worker falhou. Confira o endereço do worker na URL. |
| Mudei algo e não atualiza | Fonte → Propriedades → **Atualizar cache da página atual**. |
| A borda aparece cortada | Atualize o cache da fonte (versão antiga). |
| “Link curto inválido” | O link foi gerado em outro worker, ou a URL tem `?` em vez de `&` antes de outro parâmetro. |
| Prévia aparece mas o clip real não | Teste com `&teste=nomedeumcanal`. Se falhar, o worker pode estar fora do ar ou o canal não tem clips. |
| Canal sem clips | O overlay ignora e passa para o próximo. |
| O som do jogo não abaixa | Veja a seção do [compressor](#abaixar-o-jogomúsica-quando-o-clip-toca): o sidechain precisa ser a fonte do overlay, com “Controlar áudio via OBS”. |

## Privacidade e termos

- O login da Twitch fica **só no navegador do OBS** (`localStorage`) e serve para **buscar clips** (nenhuma permissão de escrita).
- O chat é lido de forma anônima e **não é gravado**.
- O worker recebe só o **código do clip** (e, no link curto, o **texto da configuração**) e não guarda mais nada.
- Detalhes completos: [Política de Privacidade](https://www.teuzin.com.br/TeuzinBetterChat/beta/privacidade.html) e [Termos de Uso](https://www.teuzin.com.br/TeuzinBetterChat/beta/termos.html).

## Limitações e avisos

- ⚠️ **Não é uma API oficial.** A API oficial da Twitch **não entrega o arquivo de vídeo** do clip. O worker usa o mesmo endereço interno que o site da Twitch usa para tocar clips. Isso pode **mudar ou parar de funcionar a qualquer momento** e **pode não estar de acordo com as regras da Twitch**; você usa por sua conta e risco. Se o worker falhar, o overlay tenta o player embutido da Twitch, que pode mostrar aviso de conteúdo maduro e ficar sem som.
- Os clips pertencem aos seus criadores e à Twitch. Você é responsável pelo que exibe na sua live.
- Projeto pessoal, **sem garantias**, sem afiliação com a Twitch. “Twitch” é marca de seus donos.
- Feedback e bugs: [Issues no GitHub](https://github.com/dieguesmosken/TeuzinBetterChat/issues) ou o [Discord](https://discord.gg/74MhK8Jgqs).

---

Feito por [teuzin0dev](https://www.twitch.tv/teuzin0dev) · Licença [MIT](./LICENSE).
