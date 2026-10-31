# Auditoria jurídica e de privacidade: TeuzinBetterChat 2.0 beta

Data: 30/10/2026. Levantamento técnico feito sobre o código (não substitui revisão de advogado).

## Fluxo de dados
| Componente | Dados que passam | Guarda? |
|---|---|---|
| Navegador (chat.html, painel, configurador) | tokens Twitch/Kick/Google, configurações, mensagens do chat | tokens e configs no `localStorage`; mensagens só em memória |
| Cloudflare Worker (`kick-worker`) | código OAuth, tokens, pedidos de enviar/apagar/moderar (Kick), troca/renovação/revogação (Kick e Google) | não (sem log no código) |
| Render (`relay`) | chat público da Kick (e TikTok, opcional) | não (só logs de status; sem texto das mensagens) |
| Terceiros chamados pelo navegador | IP; nomes de usuário (fotos) | conforme cada serviço |

## Achados e o que foi feito
| # | Risco | Gravidade | Situação |
|---|---|---|---|
| 1 | Não havia política de privacidade nem termos; o README dizia "nenhuma credencial é guardada" (desatualizado na 2.0) | Alta (exigência do Google/YouTube, LGPD art. 9º e 6º, VI) | **Corrigido**: `privacidade.html`, `termos.html`, README e links no painel/configurador |
| 2 | Google/YouTube: exige política com menção às APIs do YouTube, link à política do Google, revogação, contato, texto de Uso Limitado, e Termos do YouTube nos seus termos | Alta (verificação do app e conformidade) | **Atendido nas páginas**. Falta informar a URL da política na tela de consentimento OAuth |
| 3 | Tokens em texto puro no `localStorage` (risco em computador compartilhado ou XSS) | Média | Mitigação: botão Sair revoga; avisos nas páginas. Sugestão: adicionar CSP nas páginas |
| 4 | Link do OBS pode conter token Twitch e chave da API do YouTube | Média | Já exibia aviso; reforçado na política. Sugestão: nunca ligar por padrão (já é desligado) |
| 5 | Nomes de usuário de quem escreve vão para unavatar/IVR/DecAPI (fotos) | Baixa/Média (dado pessoal de terceiros) | Recurso desligado por padrão; descrito na política |
| 6 | Google Fonts no configurador envia o IP ao Google | Baixa | Descrito. Sugestão: hospedar a fonte localmente |
| 7 | TikTok via biblioteca não oficial pode violar os termos do TikTok | Média (risco à conta do usuário) | Descrito como experimental e por conta e risco nos Termos |
| 8 | Transferência internacional (GitHub, Cloudflare, Render, Google, plataformas) | Baixa | Informada (LGPD art. 33) |
| 9 | Dados de terceiros no chat (apelidos, mensagens) | Baixa | Só exibidos, não gravados; responsabilidade do streamer descrita |
| 10 | Menores | Baixa | Cláusula de idade mínima; sem coleta deliberada |
| 11 | App Google em modo "Teste": tokens expiram em 7 dias e só testadores entram | Operacional | Para uso geral, publicar o app (verificação do Google exige a política publicada) |
| 12 | Contato para titular de dados | Baixa | **Corrigido**: suporte@teuzin.com.br nas páginas (a caixa precisa existir e ser monitorada) |
| 13 | Licenças e marcas: nomes/logos de plataformas, emotes de terceiros | Baixa | Aviso de não afiliação nas páginas |

## Pendências recomendadas
1. Publicar as páginas na `main` e informar as URLs na tela de consentimento OAuth do Google (política, termos, página inicial).
2. Garantir que suporte@teuzin.com.br receba e-mails (ex.: encaminhamento do Cloudflare Email Routing).
3. Revisão por advogado antes de distribuição ampla ou qualquer monetização.
4. CSP nas páginas e fonte hospedada localmente (endurecimento).
5. Ler os termos de desenvolvedor da Twitch e da Kick antes de divulgar o app a outros streamers (cada streamer pode usar o próprio Client ID).
