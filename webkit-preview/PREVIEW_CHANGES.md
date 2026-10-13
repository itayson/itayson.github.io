# Preview 20261013-preview2 — cache e controles de tentativa

## Resultado

Correções limitadas a `webkit-preview/`. Produção `/webkit/`, offsets, primitivas, patches e todos os binários permanecem intactos.

- Alinhamento de URLs versionadas de configuração/router/cache em páginas e manifestos. As páginas de execução direta também entram no cache de sua família.
- Novos identificadores de build para invalidar corretamente caches anteriores da preview.
- Regeneração dos hashes do manifesto raw13g, com ferramenta `--check` para prevenir divergências futuras.
- Política própria de recarga limitada a quatro tentativas na fase de leitura de 13.xx, com persistência confirmada, namespace por caminho/firmware e bloqueio de agendamento duplicado.
- Router interrompe instalação/ativação automática se não conseguir persistir os contadores ou o estado do cache.
- Lapse e Poops mantêm logs locais; POST de diagnóstico só ocorre com `telemetry=1`, com timeout de 2 segundos. A preview 13.xx continua sem POST de logs.
- Documentação atualizada para separar rota habilitada de validação física. O campo legado `verified` é habilitação do roteador, não certificação de hardware.

## Limites deliberados desta rodada

A limpeza de referências em `core.js` proposta pelo PSPULSE não foi incorporada. O caminho `failed()` também é alcançado por estados recusados pelo retry seguro; mudar descarte e timing sem validar esses estados e sem teste físico seria uma mudança diferente de endurecer contadores.

Não foram transportadas as guardas de root/recarregamento do payload nem os patches de kernel de 632 bytes. Os imports de core permanecem uniformes. Firmware 11.52 não foi habilitado. A lista experimental 13.xx permanece 13.02, 13.04, 13.50 e 13.52, com início manual.

## Verificação

```sh
node --test webkit-preview/tests/*.test.cjs
node webkit-preview/tools/refresh-cache-hashes.cjs --check
```

Os testes simulam os cenários de storage negado, escrita perdida, contador corrompido, limite atingido e opt-in de telemetria. Também verificam recursos/cache e identidade dos imports. Não executam WebKit vulnerável nem rotinas de kernel.

Para validar no console 12.02: comparar a preview com a base usando o mesmo payload; testar cache inicial, reabertura offline e erro de cache, registrando a última etapa e o resultado GoldHEN. Isso não valida 13.xx. A rota 13.xx exige teste em um console com firmware correspondente antes de promoção à produção.

## Referência da análise

PSPULSE: https://github.com/psx8/psx8.github.io/tree/6f90169ab301a2b7c9dbdaf2ff7ee6b35ae208a3

Base TaySon: `14603a028643c77f50d44ca32bab61d6acb40d2b`.
