export const OPCAO_TODOS = "-99";
export const OPCAO_TODOS_ESTUDANTES = "0";
export const OPCAO_SELECIONAR_ALUNOS = "1";

export const ANO_INICIO_BOLETIM_TEMPO_REAL = 2026;

export const usaBoletimTempoReal = (anoLetivo?: string | number) =>
  Number(anoLetivo) >= ANO_INICIO_BOLETIM_TEMPO_REAL;

export const Modalidade = {
  INFANTIL: 1,
  EJA: 3,
  MEDIO: 6,
  CELP: 10,
} as const;

export const ehEjaOuCelp = (modalidadeId?: string) =>
  Number(modalidadeId) === Modalidade.EJA ||
  Number(modalidadeId) === Modalidade.CELP;
