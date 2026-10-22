import assert from 'node:assert/strict';
import {
  auditoriaPessoa,
  complexidadeEntrega,
  corteMeses,
  dataEntrega,
  datasDoPeriodo,
  excluidaDoRanking,
  indiceColaboracao,
  kpisDoScorecard,
  montarRankings,
  nomeRanking,
  normalizarFerramenta,
  partesColaboracao,
  partesComplexidade,
  scoreEspecialista,
  volumeHabilidades,
  RANKING_TOP,
  type PessoaRanking,
  type PresencaEncontro,
  type PresencaRanking,
  type ProjetoRanking,
} from './ranking';
import { diaISO } from './format';
import type { Stage } from './types';

let falhas = 0;
function caso(nome: string, fn: () => void) {
  try {
    fn();
    console.log(`ok  ${nome}`);
  } catch (err) {
    falhas += 1;
    console.error(`FAIL ${nome}`);
    console.error(err);
  }
}

const AGORA = new Date('2026-10-21T15:00:00.000Z');

function pessoa(parcial: Partial<PessoaRanking> & { id: string; full_name: string }): PessoaRanking {
  return {
    nickname: null,
    avatar_url: null,
    experience_level: null,
    languages: [],
    automations: [],
    available: false,
    bio: null,
    contact: null,
    area_name: 'Produto',
    ...parcial,
  };
}

function projeto(parcial: Partial<ProjetoRanking> & { id: string; owner_id: string; stage: Stage }): ProjetoRanking {
  return {
    concluded_at: null,
    last_activity_at: '2026-10-01T12:00:00.000Z',
    is_legacy_import: false,
    tool_tags: [],
    hours_saved_month: null,
    uses_ai: false,
    uses_n8n: false,
    uses_ai_generativa: false,
    score_final: null,
    dev_hours: null,
    ...parcial,
    title: parcial.title ?? `Iniciativa ${parcial.id}`,
  };
}

caso('nomeRanking prefere o nome completo e cai no apelido', () => {
  assert.equal(nomeRanking({ full_name: ' Ana Silva ', nickname: 'Ana' }), 'Ana Silva');
  assert.equal(nomeRanking({ full_name: '  ', nickname: 'Ana' }), 'Ana');
  assert.equal(nomeRanking({ full_name: null, nickname: null }), 'Sem nome');
});

caso('corteMeses recua 3 meses civis no fuso de São Paulo', () => {
  const corte = corteMeses(AGORA, 3);
  assert.equal(diaISO(corte.toISOString()), '2026-07-21');
  // 02:00 UTC de 22/10 ainda é 21/10 em São Paulo — a janela não anda um dia.
  const madrugadaUtc = new Date('2026-10-22T02:00:00.000Z');
  assert.equal(diaISO(corteMeses(madrugadaUtc, 3).toISOString()), '2026-07-21');
  // 31/03 → 31/12; 31/05 → 28/02 (ano não bissexto).
  assert.equal(diaISO(corteMeses(new Date('2026-03-31T15:00:00.000Z'), 3).toISOString()), '2025-12-31');
  assert.equal(diaISO(corteMeses(new Date('2026-05-31T15:00:00.000Z'), 3).toISOString()), '2026-02-28');
});

caso('normalizarFerramenta ignora caixa e acento', () => {
  assert.equal(normalizarFerramenta(' N8N '), 'n8n');
  assert.equal(normalizarFerramenta('Python'), normalizarFerramenta('python'));
  assert.equal(normalizarFerramenta('Automação'), 'automacao');
});

caso('dataEntrega ignora legado sem concluded_at e aceita showcase recente', () => {
  assert.equal(
    dataEntrega(projeto({
      id: '1', owner_id: 'a', stage: 'concluido',
      is_legacy_import: true, concluded_at: null,
    })),
    null,
  );
  const showcase = dataEntrega(projeto({
    id: '2', owner_id: 'a', stage: 'showcase',
    last_activity_at: '2026-09-01T00:00:00.000Z',
  }));
  assert.ok(showcase);
  assert.equal(showcase?.toISOString().slice(0, 10), '2026-09-01');
  assert.equal(
    dataEntrega(projeto({ id: '3', owner_id: 'a', stage: 'em_desenvolvimento' })),
    null,
  );
});

caso('volume conta só entregas na janela e corta no top 10', () => {
  const pessoas: PessoaRanking[] = [];
  const projetos: ProjetoRanking[] = [];
  for (let i = 1; i <= 12; i++) {
    const id = `p${i}`;
    pessoas.push(pessoa({ id, full_name: `Pessoa ${String(i).padStart(2, '0')}` }));
    for (let k = 0; k < i; k++) {
      projetos.push(projeto({
        id: `${id}-${k}`,
        owner_id: id,
        stage: k % 2 === 0 ? 'concluido' : 'showcase',
        concluded_at: '2026-08-10T00:00:00.000Z',
        hours_saved_month: 10,
      }));
    }
  }
  // Fora da janela e legado sem data não entram.
  pessoas.push(pessoa({ id: 'legado', full_name: 'Legado' }));
  projetos.push(projeto({
    id: 'leg-1', owner_id: 'legado', stage: 'concluido',
    is_legacy_import: true, concluded_at: null,
    last_activity_at: '2026-09-01T00:00:00.000Z',
  }));
  pessoas.push(pessoa({ id: 'antiga', full_name: 'Antiga' }));
  projetos.push(projeto({
    id: 'ant-1', owner_id: 'antiga', stage: 'concluido',
    concluded_at: '2026-04-01T00:00:00.000Z',
  }));

  const r = montarRankings(pessoas, projetos, [], AGORA);
  assert.equal(r.entregas.length, RANKING_TOP);
  assert.equal(r.entregas[0].nome, 'Pessoa 12');
  assert.equal(r.entregas[0].valor, 12);
  assert.ok(r.entregas[0].detalhe.includes('12 entregas'));
  assert.equal(r.entregas[9].nome, 'Pessoa 03');
  assert.ok(!r.entregas.some((p) => p.nome === 'Pessoa 02'));
  assert.ok(!r.entregas.some((p) => p.id === 'legado' || p.id === 'antiga'));
  assert.equal(r.entregasNaJanela, true);
  assert.equal(r.corteDesde, '2026-07-21');
  assert.equal(r.corteAte, '2026-10-21');
});

caso('volume cai para o histórico quando a janela de 3 meses está vazia', () => {
  const r = montarRankings(
    [
      pessoa({ id: 'legado', full_name: 'Legado' }),
      pessoa({ id: 'ana', full_name: 'Ana' }),
    ],
    [
      projeto({
        id: 'leg-1', owner_id: 'legado', stage: 'concluido',
        is_legacy_import: true, concluded_at: null,
        hours_saved_month: 40,
      }),
      projeto({
        id: 'leg-2', owner_id: 'legado', stage: 'showcase',
        is_legacy_import: true, concluded_at: null,
      }),
      projeto({
        id: 'ant-1', owner_id: 'ana', stage: 'concluido',
        concluded_at: '2026-01-01T00:00:00.000Z',
        hours_saved_month: 10,
      }),
    ],
    [],
    AGORA,
  );
  assert.equal(r.entregasNaJanela, false);
  assert.equal(r.entregas[0].id, 'legado');
  assert.equal(r.entregas[0].valor, 2);
  assert.equal(r.entregas[1].id, 'ana');
  assert.equal(r.entregas[1].valor, 1);
  assert.ok(r.especialistas[0].id === 'legado');
  assert.ok(r.especialistas[0].detalhe.includes('complexidade'));
});

caso('entrega na virada UTC entra pelo dia civil de São Paulo', () => {
  const r = montarRankings(
    [pessoa({ id: 'ana', full_name: 'Ana' })],
    [projeto({
      id: 'limite', owner_id: 'ana', stage: 'concluido',
      // 21/07 02:00 UTC = 20/07 23:00 em São Paulo — fora da janela 21/07–21/10.
      concluded_at: '2026-07-21T02:00:00.000Z',
    })],
    [],
    AGORA,
  );
  assert.equal(r.entregasNaJanela, false);
  assert.equal(r.entregas[0].id, 'ana');
  assert.equal(r.entregas[0].valor, 1);
});

caso('especialistas somam volume de habilidades e complexidade das entregas', () => {
  const pessoas = [
    pessoa({
      id: 'carla', full_name: 'Carla',
      automations: ['n8n', 'Power Automate'],
      languages: ['Python'],
    }),
    pessoa({
      id: 'diego', full_name: 'Diego',
      automations: ['ferramenta-rara'],
    }),
    pessoa({
      id: 'eva', full_name: 'Eva',
      languages: ['SQL'],
      automations: ['n8n'],
    }),
    pessoa({ id: 'zero', full_name: 'Zero' }),
  ];
  const projetos = [
    projeto({
      id: 't', owner_id: 'carla', stage: 'concluido',
      concluded_at: '2026-08-10T00:00:00.000Z',
      tool_tags: ['n8n', 'Python'],
      uses_ai: true, uses_n8n: true, hours_saved_month: 20,
    }),
  ];
  const r = montarRankings(pessoas, projetos, [], AGORA);
  assert.equal(volumeHabilidades(pessoas[0]), 3);
  assert.ok(complexidadeEntrega(projetos[0]) > 4);
  assert.equal(r.especialistas[0].id, 'carla');
  assert.equal(
    r.especialistas[0].valor,
    scoreEspecialista(3, complexidadeEntrega(projetos[0])),
  );
  const eva = r.especialistas.find((p) => p.id === 'eva');
  const diego = r.especialistas.find((p) => p.id === 'diego');
  assert.ok(eva && diego);
  assert.equal(eva.valor, scoreEspecialista(2, 0));
  assert.equal(diego.valor, scoreEspecialista(1, 0));
  assert.ok(r.especialistas[0].valor > eva.valor);
  assert.ok(eva.valor > diego.valor);
  assert.ok(!r.especialistas.some((p) => p.id === 'zero'));
  assert.ok(r.especialistas[0].detalhe.includes('3 habilidades'));
  assert.ok(r.especialistas[0].detalhe.includes('complexidade'));
});

caso('entrega com IA e n8n é mais complexa que entrega simples', () => {
  const simples = complexidadeEntrega(projeto({
    id: 's', owner_id: 'a', stage: 'concluido',
  }));
  const complexa = complexidadeEntrega(projeto({
    id: 'c', owner_id: 'a', stage: 'concluido',
    uses_ai: true, uses_ai_generativa: true, uses_n8n: true,
    tool_tags: ['n8n', 'Python', 'Power BI'],
    hours_saved_month: 40, dev_hours: 80, score_final: 4.2,
  }));
  assert.ok(complexa > simples);
});

caso('volumeHabilidades conta linguagens e automações sem repetir', () => {
  assert.equal(volumeHabilidades(pessoa({
    id: 'a', full_name: 'Ana',
    languages: ['Python', 'SQL'],
    automations: ['Python', 'Power BI', ''],
  })), 3);
});

caso('Everton Dzikovicz e Maria Clara Morais não aparecem em nenhum ranking', () => {
  assert.equal(excluidaDoRanking({ full_name: 'Everton Dzikovicz', nickname: null }), true);
  assert.equal(excluidaDoRanking({ full_name: 'Maria Clara Morais', nickname: 'Maria' }), true);
  assert.equal(excluidaDoRanking({ full_name: ' Éverton  Dzikovicz ', nickname: null }), true);
  assert.equal(excluidaDoRanking({ full_name: 'Ana Silva', nickname: 'Maria Clara Morais' }), true);
  assert.equal(excluidaDoRanking({ full_name: 'Maria Santos', nickname: 'Maria' }), false);
  const r = montarRankings(
    [
      pessoa({
        id: 'everton', full_name: 'Everton Dzikovicz',
        automations: ['n8n', 'Python', 'SQL', 'Power BI'],
        available: true, bio: 'x', contact: 'e@senff',
      }),
      pessoa({
        id: 'maria', full_name: 'Maria Clara Morais',
        languages: ['Python', 'SQL'], automations: ['n8n'],
        available: true, bio: 'x', contact: 'm@senff',
      }),
      pessoa({ id: 'ana', full_name: 'Ana Silva', automations: ['n8n'], available: true }),
    ],
    [
      projeto({
        id: 'e1', owner_id: 'everton', stage: 'concluido',
        concluded_at: '2026-08-10T00:00:00.000Z',
        uses_ai: true, hours_saved_month: 80,
      }),
      projeto({
        id: 'm1', owner_id: 'maria', stage: 'showcase',
        concluded_at: '2026-09-10T00:00:00.000Z',
        uses_n8n: true,
      }),
      projeto({
        id: 'a1', owner_id: 'ana', stage: 'concluido',
        concluded_at: '2026-08-10T00:00:00.000Z',
      }),
    ],
    [{ user_id: 'everton', presentes_3m: 8, convites_3m: 8 }],
    AGORA,
  );
  for (const lista of [r.entregas, r.especialistas, r.colaboradores]) {
    assert.ok(!lista.some((p) => p.id === 'everton' || p.id === 'maria'));
  }
  assert.ok(r.entregas.some((p) => p.id === 'ana'));
});

caso('índice de colaboração soma presença, disponibilidade, ativas e perfil', () => {
  assert.equal(indiceColaboracao({
    presentes3m: 0, convites3m: 0, available: false,
    iniciativasAtivas: 0, ferramentas: 0, temBio: false, temContato: false,
  }), 0);
  assert.equal(indiceColaboracao({
    presentes3m: 8, convites3m: 8, available: true,
    iniciativasAtivas: 3, ferramentas: 4, temBio: true, temContato: true,
  }), 100);
  const meio = indiceColaboracao({
    presentes3m: 4, convites3m: 8, available: true,
    iniciativasAtivas: 1, ferramentas: 2, temBio: false, temContato: false,
  });
  assert.equal(meio, 20 + 20 + 7 + 6);
});

caso('top colaboradores usa o índice e empata pelo nome', () => {
  const pessoas = [
    pessoa({
      id: 'ana', full_name: 'Ana', available: true,
      automations: ['n8n', 'bitrix'], bio: 'Ajudo no desbloqueio.', contact: 'ana@senff',
    }),
    pessoa({
      id: 'bruno', full_name: 'Bruno', available: true,
      automations: ['n8n', 'bitrix'], bio: 'Ajudo no desbloqueio.', contact: 'bruno@senff',
    }),
    pessoa({ id: 'clara', full_name: 'Clara', available: false, automations: ['n8n'] }),
  ];
  const projetos = [
    projeto({ id: 'a1', owner_id: 'ana', stage: 'em_desenvolvimento' }),
    projeto({ id: 'b1', owner_id: 'bruno', stage: 'em_teste' }),
  ];
  const presencas: PresencaRanking[] = [
    { user_id: 'ana', presentes_3m: 6, convites_3m: 8 },
    { user_id: 'bruno', presentes_3m: 6, convites_3m: 8 },
  ];
  const r = montarRankings(pessoas, projetos, presencas, AGORA);
  assert.equal(r.colaboradores[0].id, 'ana');
  assert.equal(r.colaboradores[1].id, 'bruno');
  assert.equal(r.colaboradores[0].valor, r.colaboradores[1].valor);
  assert.ok(r.colaboradores[0].detalhe.includes('disponível'));
  assert.ok(r.colaboradores.find((p) => p.id === 'clara')!.valor < r.colaboradores[0].valor);
});

caso('projeto sem dono cadastrado no hub não entra no ranking', () => {
  const r = montarRankings(
    [pessoa({ id: 'ana', full_name: 'Ana' })],
    [projeto({
      id: 'x', owner_id: 'fantasma', stage: 'concluido',
      concluded_at: '2026-09-01T00:00:00.000Z',
    })],
    [],
    AGORA,
  );
  assert.equal(r.entregas.length, 0);
});

caso('período explícito recorta entregas e presença sem cair no histórico', () => {
  const pessoas = [
    pessoa({ id: 'ana', full_name: 'Ana', available: true }),
    pessoa({ id: 'bruno', full_name: 'Bruno' }),
  ];
  const projetos = [
    projeto({
      id: 'a-ago', owner_id: 'ana', stage: 'concluido',
      concluded_at: '2026-08-10T12:00:00.000Z',
    }),
    projeto({
      id: 'b-set', owner_id: 'bruno', stage: 'concluido',
      concluded_at: '2026-09-10T12:00:00.000Z',
    }),
  ];
  const presencas: PresencaEncontro[] = [
    { user_id: 'ana', scheduled_at: '2026-08-15T12:00:00.000Z', status: 'present' },
    { user_id: 'ana', scheduled_at: '2026-08-22T12:00:00.000Z', status: 'pending' },
    { user_id: 'bruno', scheduled_at: '2026-09-12T12:00:00.000Z', status: 'present' },
  ];
  const soAgosto = montarRankings(
    pessoas, projetos, presencas,
    datasDoPeriodo('2026-08-01', '2026-08-31', AGORA),
    { fallbackHistorico: false },
  );
  assert.equal(soAgosto.entregasNaJanela, true);
  assert.equal(soAgosto.entregas.length, 1);
  assert.equal(soAgosto.entregas[0].id, 'ana');
  assert.equal(soAgosto.corteDesde, '2026-08-01');
  assert.equal(soAgosto.corteAte, '2026-08-31');
  const ana = soAgosto.colaboradores.find((p) => p.id === 'ana');
  assert.ok(ana);
  assert.equal(ana!.valor, indiceColaboracao({
    presentes3m: 1, convites3m: 2, available: true,
    iniciativasAtivas: 0, ferramentas: 0, temBio: false, temContato: false,
  }));
  assert.ok(!soAgosto.colaboradores.some((p) => p.id === 'bruno' && p.valor >= ana!.valor));

  const soOutubro = montarRankings(
    pessoas, projetos, presencas,
    datasDoPeriodo('2026-10-01', '2026-10-21', AGORA),
    { fallbackHistorico: false },
  );
  assert.equal(soOutubro.entregasNaJanela, false);
  assert.equal(soOutubro.entregas.length, 0);
});

caso('kpisDoScorecard soma entregas e aponta os campeões', () => {
  const r = montarRankings(
    [
      pessoa({ id: 'ana', full_name: 'Ana', available: true, automations: ['n8n'] }),
      pessoa({ id: 'bruno', full_name: 'Bruno' }),
    ],
    [
      projeto({
        id: 'a1', owner_id: 'ana', stage: 'concluido',
        concluded_at: '2026-08-10T00:00:00.000Z',
      }),
      projeto({
        id: 'a2', owner_id: 'ana', stage: 'showcase',
        concluded_at: '2026-09-10T00:00:00.000Z',
      }),
    ],
    [],
    AGORA,
  );
  const k = kpisDoScorecard(r);
  assert.equal(k.entregasNoPeriodo, 2);
  assert.equal(k.campeaoEntregas?.id, 'ana');
  assert.equal(k.campeaoEspecialista?.id, 'ana');
});

caso('auditoriaPessoa lista entregas, habilidades e partes da pontuação', () => {
  const pessoas = [
    pessoa({
      id: 'ana', full_name: 'Ana Silva',
      languages: ['Python'], automations: ['n8n', 'Python'],
      available: true, bio: 'Ajudo no hub', contact: 'ana@senff',
      area_name: 'Fraudes',
    }),
  ];
  const projetos = [
    projeto({
      id: 'bot', owner_id: 'ana', stage: 'concluido',
      title: 'Bot de fraude',
      concluded_at: '2026-08-10T00:00:00.000Z',
      uses_ai: true, uses_n8n: true, hours_saved_month: 20,
    }),
    projeto({
      id: 'ativa', owner_id: 'ana', stage: 'em_desenvolvimento',
      title: 'Painel em curso',
    }),
  ];
  const a = auditoriaPessoa(
    'ana', pessoas, projetos,
    [{ user_id: 'ana', presentes_3m: 4, convites_3m: 8 }],
    AGORA,
  );
  assert.ok(a);
  assert.equal(a!.nome, 'Ana Silva');
  assert.equal(a!.volumeHabilidades, 2);
  assert.deepEqual(a!.linguagens, ['Python']);
  assert.deepEqual(a!.automacoes, ['n8n']);
  assert.equal(a!.entregasQtd, 1);
  assert.equal(a!.entregas[0].title, 'Bot de fraude');
  assert.equal(a!.entregas[0].complexidade.total, complexidadeEntrega(projetos[0]));
  assert.equal(a!.entregas[0].noPeriodo, true);
  assert.equal(a!.ativas.length, 1);
  assert.equal(a!.scoreEspecialista, scoreEspecialista(2, a!.complexidadeTotal));
  const partes = partesColaboracao({
    presentes3m: 4, convites3m: 8, available: true,
    iniciativasAtivas: 1, ferramentas: 2, temBio: true, temContato: true,
  });
  assert.equal(a!.colaboracao.indice, partes.indice);
  assert.equal(a!.colaboracao.presenca + a!.colaboracao.disponibilidade + a!.colaboracao.ativas + a!.colaboracao.perfil, partes.indice);
  assert.equal(partesComplexidade(projetos[0]).total, complexidadeEntrega(projetos[0]));
});

caso('auditoriaPessoa não devolve excluídos nem ids inexistentes', () => {
  const pessoas = [
    pessoa({ id: 'everton', full_name: 'Everton Dzikovicz', automations: ['n8n'] }),
    pessoa({ id: 'ana', full_name: 'Ana' }),
  ];
  assert.equal(auditoriaPessoa('everton', pessoas, [], [], AGORA), null);
  assert.equal(auditoriaPessoa('fantasma', pessoas, [], [], AGORA), null);
});

if (falhas) {
  console.error(`\n${falhas} caso(s) falharam`);
  process.exit(1);
}
console.log('\ntodos os casos passaram');
