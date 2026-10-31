# Criar o seu próprio worker para o overlay "Clip do !so"

O overlay [`so-clip.html`](../beta/so-clip.html) toca um clip aleatório do canal que recebeu o `!so`. Para tocar o clip como vídeo normal (com som e sem o aviso de conteúdo maduro do player embutido do Twitch), ele precisa de um **worker**: um pequeno serviço gratuito da Cloudflare que descobre o link do vídeo do clip.

Você pode usar o worker de outra pessoa (o padrão do [configurador](../beta/so-clip-config.html)) ou criar o **seu**, em uns 5 minutos, sem instalar nada. Fazer o seu é melhor: o limite gratuito é só seu e nada depende de terceiros.

> ⚠️ **Aviso importante.** O link de vídeo de um clip **não existe na API oficial do Twitch**. Este worker usa o mesmo endereço interno que o site do Twitch usa para tocar clips. Isso **não é uma API oficial**: pode mudar ou parar de funcionar sem aviso, e você usa por sua conta e risco. Se parar, o overlay continua tocando pelo player embutido do Twitch (alguns canais mostram um aviso de conteúdo maduro e não tocam).

## O que você precisa

- Uma conta gratuita na [Cloudflare](https://dash.cloudflare.com/sign-up) (não precisa de cartão).
- O arquivo [`worker.js`](./worker.js) desta pasta.

## Passo a passo (pelo painel, sem instalar nada)

1. Entre em <https://dash.cloudflare.com> → menu **Workers & Pages** (ou "Compute" → Workers & Pages).
2. Clique em **Create** → **Create Worker**. Dê um nome, por exemplo `meu-so-clip`, e clique em **Deploy** (ele sobe com um "Hello World" de exemplo).
3. Depois de publicado, clique em **Edit code**.
4. No editor, apague **todo** o código de exemplo (clique no código, `Ctrl+A`, `Delete`).
5. Abra o [`worker.js`](./worker.js) aqui no GitHub, clique em **Copy raw file** (ícone de copiar), volte ao editor e cole com `Ctrl+V`.
6. Clique em **Deploy** (canto superior direito).
7. Volte para a página do worker e copie o endereço dele. Fica assim:
   `https://meu-so-clip.SEU-USUARIO.workers.dev`

Se você abrir esse endereço direto no navegador, vai ver `{"erro":"origem nao permitida"}`. Isso é **esperado**: o worker só responde para o site do overlay, não para qualquer pessoa digitando o endereço.

## Usar o seu worker no overlay

1. Abra o [configurador](../beta/so-clip-config.html).
2. No último campo, **Endereço do worker**, cole o endereço do seu worker.
3. Copie a URL gerada e use na fonte de navegador do OBS (veja os passos na própria página).

Se você montar a URL à mão, é só acrescentar `&worker=https://meu-so-clip.SEU-USUARIO.workers.dev` no final.

## Se você hospedar o overlay em outro lugar

O worker só aceita pedidos vindos do site configurado. Por padrão é `https://www.teuzin.com.br`, onde o overlay publicado roda. Se você copiar o `so-clip.html` para outro site (por exemplo, `https://seunome.github.io`):

1. No painel do worker: **Settings** → **Variables and Secrets** → **Add**.
2. Tipo **Text**, nome `ALLOWED_ORIGIN`, valor `https://seunome.github.io` (sem barra no final).
3. **Deploy**.

## Conferir se está funcionando

1. Com o overlay aberto em uma aba normal do navegador, entre com a Twitch e use `?teste=nomedeumcanal` no fim da URL (o botão **Testar no navegador** do configurador faz isso).
2. Um clip deve tocar com som.
3. Se não tocar, abra o console do navegador (`F12`) e olhe os erros. Os mais comuns:

| Sintoma | Causa provável |
|---|---|
| `origem nao permitida` | O site do overlay não é o definido em `ALLOWED_ORIGIN`. |
| `clip sem video` | O clip foi apagado, ou o Twitch mudou o endereço interno. |
| `twitch 4xx/5xx` | O Twitch recusou o pedido. Tente de novo; se persistir, o endereço interno mudou. |
| O clip toca mas mostra aviso de conteúdo maduro | O overlay caiu no player embutido: confira se o endereço do worker está certo na URL. |

## Limites e custos

O plano gratuito da Cloudflare permite 100 mil pedidos por dia. Cada `!so` faz **um** pedido ao worker. O worker **não grava nada**: recebe só o código do clip e devolve o link.

## Se preferir usar a linha de comando

Com o [Node.js](https://nodejs.org) instalado, dentro desta pasta:

```bash
npx wrangler login
npx wrangler deploy
```

O arquivo [`wrangler.toml`](./wrangler.toml) já está pronto (mude o `name` e o `ALLOWED_ORIGIN` se precisar).

## Para quem quer entender o código

O [`worker.js`](./worker.js) tem poucas linhas e comentários. Em resumo: confere a origem, valida o código do clip, faz **um** pedido ao endereço interno do Twitch, escolhe a melhor qualidade até 1080p e devolve o link do vídeo.
