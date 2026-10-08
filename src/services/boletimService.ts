import { getSgp, postSgp } from "../core/servico/apiSgp";

export interface DadosFiltroBoletim {
  anoLetivo: string;
  modalidade: string;
  dreCodigo: string;
  ueCodigo: string;
  turmaCodigo: string;
  semestre: string | number;
  consideraHistorico: boolean;
  opcaoEstudanteId: string;
  quantidadeBoletimPorPagina: string;
  filtroEhValido: boolean;
  consideraInativo?: boolean;
}

export interface AlunoBoletim {
  codigo: string | number;
  numeroChamada: string | number;
  nome: string;
}

interface ListaAlunosResposta {
  items?: AlunoBoletim[];
  totalRegistros?: number;
}

export const buscarAlunos = async (filtro: DadosFiltroBoletim) => {
  const resposta = await getSgp<ListaAlunosResposta>(
    "v1/boletim/alunos?numeroPagina=1&numeroRegistros=10",
    { params: { ...filtro } },
  );
  return resposta.data?.items || [];
};

export const imprimirBoletim = async (
  dados: DadosFiltroBoletim & { alunosCodigo: string[] },
) => {
  try {
    const requisicao = await postSgp("v1/boletim/imprimir", dados);
    if (requisicao.data) return requisicao;
    return {};
  } catch {
    return { erro: true as const };
  }
};
