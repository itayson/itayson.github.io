# Validação física PSPULSE/TaySon — FW 12.02

Não atualize firmware, não altere offsets e não transfira patches de kernel do PSPULSE nesta rodada. `/webkit/` é a base de recuperação.

1. Confirme FW 12.02 e registre se GoldHEN já estava ativo. Faça cada tentativa partindo de um estado de inicialização conhecido. Não reinicie a chain de kernel em estado incerto.
2. Abra `https://itayson.github.io/webkit-preview/diagnostics.html` e registre release, família (Lapse), cache e último código de recuperação. Lembre-se de que "Stored build" não atesta cache íntegro.
3. Com rede, abra `/webkit-preview/`, aguarde instalação do cache e anote a última etapa; confira GoldHEN no próprio console.
4. Em uma inicialização limpa, retorne com rede desligada e confira se os arquivos cacheados realmente carregam. Na ausência de cache, a falha deve ser controlada.
5. Compare com `/webkit/` nas mesmas condições, sempre com o mesmo payload V9 e sem mudar mais de uma variável por rodada.

| Rodada | Host/release | Online/offline | Cache | Última etapa | GoldHEN ativo | Travou/reiniciou | Notas |
|---|---|---|---|---|---|---|---|
| A1 | /webkit/ | online | | | | | |
| B1 | /webkit-preview/ | online | | | | | |
| B2 | /webkit-preview/ | offline | | | | | |

A leitura do host, HTTP 200 ou mensagens de sucesso não confirmam execução de kernel nem do GoldHEN. FW 12.02 não valida 13.02, 13.04, 13.50 ou 13.52.