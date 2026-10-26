import axios from "axios";
import type { AxiosResponse } from "axios";
import { OPCAO_SELECIONAR_ALUNOS, OPCAO_TODOS } from "../core/constantes";
import { getBoletimApiUrl } from "../config";
import { getBoletim } from "../core/servico/apiBoletim";
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

export interface ResultadoPdfBoletim {
  arquivo?: Blob;
  nomeArquivo?: string;
  mensagem?: string;
  erro?: boolean;
  cancelado?: boolean;
}

export const montarParametrosPdf = (
  filtro: DadosFiltroBoletim,
  alunosCodigo: string[],
) => {
  const parametros: Record<string, unknown> = {
    ano_letivo: Number(filtro.anoLetivo),
    dre_codigo: filtro.dreCodigo,
    ue_codigo: filtro.ueCodigo,
    modalidade: Number(filtro.modalidade),
    semestre: Number(filtro.semestre) || 0,
    considera_inativo: Boolean(filtro.consideraInativo),
  };

  const quantidade = Number(filtro.quantidadeBoletimPorPagina);
  if (Number.isInteger(quantidade) && quantidade > 0) {
    parametros.boletins_por_pagina = quantidade;
  }

  if (filtro.turmaCodigo && filtro.turmaCodigo !== OPCAO_TODOS) {
    parametros.turma_codigo = filtro.turmaCodigo;
  }

  if (filtro.opcaoEstudanteId === OPCAO_SELECIONAR_ALUNOS) {
    const codigos = alunosCodigo
      .map((codigo) => Number(codigo))
      .filter((codigo) => Number.isInteger(codigo) && codigo >= 1);
    if (codigos.length) parametros.alunos_codigo = codigos;
  }

  return parametros;
};

export interface UltimaAtualizacaoResposta {
  ultimaAtualizacao?: string | null;
}

const FUSO_HORARIO = /(?:Z|[+-]\d{2}:?\d{2})$/i;

const normalizarInstante = (valor: string) => {
  const texto = valor.trim().replace(" ", "T").replace(/(\.\d{3})\d+/, "$1");
  if (!texto) return "";
  if (FUSO_HORARIO.test(texto)) return texto;
  return `${texto}-03:00`;
};

export const formatarDataConsolidacao = (valor?: string | null) => {
  if (!valor) return "";
  const data = new Date(normalizarInstante(valor));
  if (Number.isNaN(data.getTime())) return "";

  const formatar = (opcoes: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      ...opcoes,
    }).format(data);

  const dia = formatar({ day: "2-digit", month: "2-digit", year: "numeric" });
  const hora = formatar({
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  return `${dia} - ${hora}`;
};

export const obterUltimaAtualizacao = async (
  filtro: DadosFiltroBoletim,
  alunosCodigo: string[],
  signal?: AbortSignal,
) => {
  if (!getBoletimApiUrl()) return "";

  try {
    const resposta = await getBoletim<UltimaAtualizacaoResposta>(
      "api/boletim/ultima-atualizacao/",
      {
        params: montarParametrosPdf(filtro, alunosCodigo),
        headers: { Accept: "application/json" },
        signal,
      },
    );
    return formatarDataConsolidacao(resposta.data?.ultimaAtualizacao);
  } catch {
    return "";
  }
};

const nomeArquivoPadrao = (anoLetivo?: string) =>
  `boletim-escolar-${anoLetivo || "2026"}.pdf`;

const lerCabecalho = (headers: AxiosResponse["headers"] | undefined, nome: string) => {
  if (!headers) return "";
  if (typeof headers.get === "function") {
    const valor = headers.get(nome);
    if (typeof valor === "string") return valor;
  }
  const registro = headers as unknown as Record<string, unknown>;
  const valor = registro[nome] ?? registro[nome.toLowerCase()];
  return typeof valor === "string" ? valor : "";
};

const nomeDoArquivo = (contentDisposition: string, anoLetivo?: string) => {
  const utf = /filename\*=UTF-8''([^;]+)/i.exec(contentDisposition);
  if (utf?.[1]) {
    try {
      return decodeURIComponent(utf[1]);
    } catch {
      return utf[1];
    }
  }
  const simples = /filename="?([^";]+)"?/i.exec(contentDisposition);
  return simples?.[1] || nomeArquivoPadrao(anoLetivo);
};

const textoDoBlob = (data: Blob) => {
  if (typeof data.text === "function") return data.text();

  return new Promise<string>((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve(String(leitor.result || ""));
    leitor.onerror = () => reject(leitor.error);
    leitor.readAsText(data);
  });
};

const mensagemDoCorpo = async (data: unknown) => {
  if (!data) return "";
  if (typeof data === "string") return data;

  let texto = "";
  if (data instanceof Blob) {
    texto = await textoDoBlob(data);
  } else {
    texto = JSON.stringify(data);
  }
  if (!texto) return "";

  try {
    const json = JSON.parse(texto) as {
      mensagens?: string[];
      detail?: string;
      message?: string;
    };
    if (json.mensagens?.length) return json.mensagens.join("\n");
    if (json.detail) return json.detail;
    if (json.message) return json.message;
  } catch {
    return data instanceof Blob ? texto : "";
  }

  return "";
};

export const gerarPdfBoletim = async (
  filtro: DadosFiltroBoletim,
  alunosCodigo: string[],
  signal?: AbortSignal,
): Promise<ResultadoPdfBoletim> => {
  if (!getBoletimApiUrl()) {
    return {
      erro: true,
      mensagem: "A URL da API de boletim não foi configurada.",
    };
  }

  try {
    const resposta = await getBoletim<Blob>("api/boletim/pdf/", {
      params: montarParametrosPdf(filtro, alunosCodigo),
      responseType: "blob",
      signal,
      headers: { Accept: "application/pdf" },
    });

    const mensagemCabecalho = lerCabecalho(resposta.headers, "x-mensagem");
    const arquivoVazio = resposta.data instanceof Blob && resposta.data.size === 0;
    if (resposta.status === 204 || arquivoVazio) {
      return {
        erro: true,
        mensagem: mensagemCabecalho || "Nenhum aluno encontrado.",
      };
    }

    const tipo = lerCabecalho(resposta.headers, "content-type");
    if (tipo.includes("application/json")) {
      return {
        erro: true,
        mensagem:
          (await mensagemDoCorpo(resposta.data)) ||
          mensagemCabecalho ||
          "Não foi possível gerar o boletim.",
      };
    }

    return {
      arquivo: resposta.data,
      nomeArquivo: nomeDoArquivo(
        lerCabecalho(resposta.headers, "content-disposition"),
        filtro.anoLetivo,
      ),
    };
  } catch (falha) {
    if (axios.isCancel(falha) || (axios.isAxiosError(falha) && falha.code === "ERR_CANCELED")) {
      return { cancelado: true };
    }

    let mensagem = "";
    try {
      mensagem = axios.isAxiosError(falha)
        ? await mensagemDoCorpo(falha.response?.data)
        : "";
    } catch {
      mensagem = "";
    }
    const cabecalho = axios.isAxiosError(falha)
      ? lerCabecalho(falha.response?.headers, "x-mensagem")
      : "";

    return {
      erro: true,
      mensagem: mensagem || cabecalho || "Não foi possível gerar o boletim.",
    };
  }
};
