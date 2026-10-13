# TaySon PSPULSE — preview3 (13/10/2026)

Escopo estrito: mensagens de diagnóstico, versão/cache da preview, documentação e testes. Nenhum arquivo em `webkit/`, offsets, primitives, patches ou payloads é alterado.

**Mudanças:** indicador `verified` apresentado como habilitação do roteador, não prova física; firmware 13.xx marcado "experimental · manual"; firmwares legados como "auto-run configurado"; cache mostra somente build registrado; status de rede informa apenas o valor comunicado pelo browser. O cabeçalho não sugere suporte contínuo a todos os firmwares até 13.52.

Build `20261013-preview3` com URLs sincronizadas em páginas e manifestos para atualização do AppCache.

**Validação estática:** `node --test webkit-preview/tests/*.test.cjs` e `node webkit-preview/tools/refresh-cache-hashes.cjs --check`. Os testes de Node não certificam sucesso físico do exploit. Revisar o PR e testar em PS4 12.02 antes de promover para `/webkit/`; 13.xx requer hardware separado.