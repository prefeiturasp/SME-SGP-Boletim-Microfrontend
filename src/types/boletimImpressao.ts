export interface PeriodoImpressao {
  nota: string;
  frequencia: string;
}

export interface ComponenteImpressao {
  nome: string;
  periodos: PeriodoImpressao[];
  eh_regencia: boolean;
  primeira_linha_regencia?: boolean;
  linhas_regencia?: number;
}

export interface GrupoImpressao {
  componentes: ComponenteImpressao[];
}

export interface DadosAlunoImpressao {
  ano_letivo: number;
  dre_nome: string;
  ue_nome: string;
  aluno_codigo: number;
  turma_relatorio: string;
  ciclo: string;
}

export interface BoletimImpressao {
  dados: DadosAlunoImpressao;
  nome_aluno: string;
  periodos: number[];
  usa_conceito: boolean;
  exibe_legenda: boolean;
  grupos: GrupoImpressao[];
  frequencia_global: string;
  parecer_conclusivo: string;
  recomendacoes_aluno: string;
  recomendacoes_familia: string;
  exibe_recomendacoes: boolean;
}

export interface LinhaImpressao {
  boletins: BoletimImpressao[];
}

export interface PaginaImpressao {
  linhas: LinhaImpressao[];
}

export interface ContextoImpressaoBoletim {
  paginas: PaginaImpressao[];
  boletins_por_pagina: 1 | 2 | 6;
  dados_atualizados_em: string | null;
  data_impressao: string;
  total_paginas: number;
}

export type MensagemWorkerEntrada = {
  tipo: "gerar";
  contexto: ContextoImpressaoBoletim;
};

export type MensagemWorkerSaida =
  | { tipo: "progresso"; valor: number }
  | { tipo: "concluido"; arquivo: ArrayBuffer }
  | { tipo: "erro"; mensagem: string };
