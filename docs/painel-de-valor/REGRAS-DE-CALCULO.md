# Regras de cálculo

Todas as funções recebem a lista de iniciativas já normalizada e devolvem números. Nada é arredondado antes da exibição. Os valores entre parênteses são os de 06/10/2026 e servem de teste.

## Conjuntos
- `total` = todas as iniciativas consideradas pelo Pulso (241).
- `concluidas` = `stage = 'concluido'` (171).
- `ativas` = `stage` em `em_desenvolvimento`, `em_teste`, `ideia` (69).
- `com_horas` = `hours_saved_month` não nulo. **Zero é valor informado; nulo é "não informado".**
- `novas` = `is_legacy_import = false` (25).

## Horas
| Indicador | Fórmula | Valor |
|---|---|---|
| Horas devolvidas por mês | soma de `hours_saved_month` das concluídas | 2.420,2 |
| Horas do portfólio por mês | soma de `hours_saved_month` de todas | 3.049,2 |
| Horas a capturar por mês | portfólio − devolvidas | 629,0 |
| % do potencial capturado | devolvidas ÷ portfólio | 79% |
| Horas devolvidas por ano | devolvidas × 12 | 29.042 |
| Pessoas equivalentes | devolvidas ÷ `horas_mes_por_pessoa` (168) | ≈ 14 |

Observação: o total do portfólio inclui a iniciativa cancelada (20 h), como o Pulso mostra hoje. Manter igual ao Pulso; se o Pulso mudar, este cálculo acompanha.

## Simulador
`valor_mes = devolvidas × custo_hora`, `valor_ano = valor_mes × 12`, `a_capturar_ano = horas_a_capturar × custo_hora × 12`.
Com R$ 50: R$ 121.010 por mês, R$ 1.452.120 por ano, R$ 377.400 a capturar.
Exibir em "R$ 1,45 mi" a partir de 1 milhão e "R$ 121 mil" abaixo.

## Portfólio
| Indicador | Fórmula | Valor |
|---|---|---|
| % concluídas | concluídas ÷ total | 71% |
| % usam IA | `uses_ai` ÷ total | 59% (141) |
| % usam n8n | `uses_n8n` ÷ total | 37% (89) |
| % com horas informadas | com_horas ÷ total | 40% (96) |
| Concluídas com horas | concluídas ∩ com_horas | 64 (37%) |
| Concluídas sem horas | concluídas − as de cima | 107 |
| Concentração | soma das 5 maiores concluídas ÷ devolvidas | 58% (1.396 h) |
| Novas concluídas | novas ∩ concluídas | 11, com 425,5 h |

Horas por tema e por diretoria: somar só as concluídas; mostrar ao lado "(n com horas de m concluídas)". Ordenar por horas, depois por quantidade.

## Direcionamento
Contagens sobre os JSON:
- Prioridades em curso = `etapa > 0` (5 de 7). Concluída = `etapa = 5` (0).
- Resultados: atendido, parcial e não, por `situacao` (1, 5 e 3 de 9).
- Régua: entregas por etapa; em produção = `etapa >= 4` (5 de 16); com resultado medido = `etapa = 5` (0).

## Percentuais
Arredondar para inteiro na exibição, exceto Lei do Bem, que usa uma casa decimal. Se o denominador for zero, mostrar "—".
