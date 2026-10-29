import { TEXTO_DUVIDAS } from '@/lib/match-solucoes';

export type DuvidaFrequente = {
  pergunta: string;
  resposta: string;
};

/** Respostas curtas do Pulsenff. O que não está aqui segue para a Gerência de IA. */
export const DUVIDAS_FREQUENTES: DuvidaFrequente[] = [
  {
    pergunta: 'O que é o Pulso?',
    resposta:
      'É a plataforma do projeto de IA e Automação da Senff. Reúne o manifesto, a metodologia, o acompanhamento do portfólio, as iniciativas, a comunidade e a frequência dos encontros semanais.',
  },
  {
    pergunta: 'Como eu acesso?',
    resposta:
      'Só por convite. Não há cadastro público. O link do convite cria a sua conta; depois a entrada é com e-mail e senha.',
  },
  {
    pergunta: 'Como cadastro uma iniciativa?',
    resposta:
      'Em Iniciativas, use Cadastrar iniciativa e descreva o problema antes da solução. O perfil Leitor só acompanha. Para cadastrar, o papel precisa ser pelo menos Participante.',
  },
  {
    pergunta: 'Quem pode editar uma iniciativa?',
    resposta:
      'Você edita as iniciativas das quais é proprietário. Perfis Gerencial e Administrador editam qualquer uma.',
  },
  {
    pergunta: 'O que o match faz?',
    resposta:
      'Você descreve um problema e o Pulsenff compara com as iniciativas já cadastradas. Se houver parecida, ele mostra. Se não houver, o caminho é cadastrar a solução e apresentar na próxima reunião.',
  },
  {
    pergunta: 'Como funciona a reunião?',
    resposta:
      'É um encontro semanal de cerca de 1 hora. A presença se confirma em Frequências. Iniciativa sem atualização há mais de 14 dias aparece em alerta no acompanhamento.',
  },
  {
    pergunta: 'O que é a aba Lei do Bem?',
    resposta:
      'É a pré-análise de enquadramento na Lei 11.196/2005. A aba fica com os perfis Gerencial e Administrador. A triagem não substitui a validação técnica, fiscal e contábil, e não bloqueia a iniciativa.',
  },
  {
    pergunta: 'E se a minha dúvida não estiver aqui?',
    resposta: TEXTO_DUVIDAS,
  },
];
