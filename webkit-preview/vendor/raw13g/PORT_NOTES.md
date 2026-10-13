# TaySon preview — estado dos componentes em 2026-10-13

Este arquivo documenta o conjunto atualmente entregue. As notas anteriores de troca de `payload2.bin` não descreviam mais esta integração.

## Origem

- raw13g: `9ba2f0719591d6900d91aba6cc5291f8fff97e6d`.
- WhiteShadow8500: `719b2b0e4150c0b6be220029ffc0bd79f14da764`.
- A licença do código raw13g permanece em `LICENSE`. Ela não atribui automaticamente a mesma licença aos payloads e componentes externos.
- A análise de PSPULSE `6f90169ab301a2b7c9dbdaf2ff7ee6b35ae208a3` orientou a revisão de cache e tentativas. Não foi importada sua cadeia completa nem seus patches de kernel.

## Arquivos atuais

`ps4_offsets.js` seleciona `goldhen.bin` para 13.02, 13.04, 13.50 e 13.52. O binário tem 293.120 bytes e SHA-256 `df3f27c1b35bc7c40e3a08caab948930914dc7d0301a73b68945cf6ffe40ea12`. É idêntico ao candidato encontrado no PSPULSE; isso não estabelece autenticidade de release oficial nem funcionamento físico. `hen.bin` é mantido como artefato de pesquisa, não como payload selecionado pelas quatro rotas.

Os patches `1302.bin`, `1350.bin` e `1352.bin` continuam com os bytes da preview anterior, 314 bytes cada. Não foram substituídos pelos arquivos de 632 bytes do PSPULSE. A produção `/webkit/` mantém seu payload anterior.

## Tentativas e cache

`reload-budget.js` limita as recargas automáticas de falhas detectadas na fase de leitura a quatro por caminho/firmware. `retry=0` desativa; valores de 1 a 4 reduzem o teto; valores maiores não o ampliam. O contador deve ser escrito e lido corretamente em sessionStorage antes de agendar a recarga. Contadores inválidos, armazenamento indisponível e falhas de persistência impedem a recarga. O ponto de uso continua restrito às duas falhas benignas anteriores à escrita de kernel já usadas pela base.

`jb.js` e `mem.js` continuam importando exatamente `core.js?v=10`. O helper novo está no manifesto. Hashes são regenerados com `node webkit-preview/tools/refresh-cache-hashes.cjs`; são comentários de auditoria/invalidação, não verificação SRI feita pelo browser.

## Validação necessária

Testes automatizados cobrem a política de recarga, cache e roteamento, sem executar o exploit. O comportamento de kernel, payload, suspensão e estabilidade exige teste em cada firmware alvo. Não há validação física nova nesta atualização. Mensagens antigas `fw_status` são anotações herdadas e não relatórios de teste desta preview.
