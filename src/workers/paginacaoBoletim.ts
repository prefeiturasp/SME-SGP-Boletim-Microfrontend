import type { BoletimImpressao, GrupoImpressao } from "../types/boletimImpressao";

export interface PaginaBoletimRenderizacao extends BoletimImpressao {
  exibe_tabela: boolean;
  exibe_assinaturas: boolean;
}

interface PaginaComContador {
  boletim: PaginaBoletimRenderizacao;
  contador: number;
}

const CONTADOR_INICIAL = 8;
const LIMITE_LINHAS = 49;
const CARACTERES_RECOMENDACAO = 120;

const pesoParecerConclusivo = (valor: string) =>
  valor ? 1 + Math.ceil(valor.length / CARACTERES_RECOMENDACAO) * 0.7 : 0;

const pesoComponente = (nome: string, possuiNotaFinal: boolean) => {
  const limiteCaracteres = possuiNotaFinal ? 48 : 54;
  if (nome.length < limiteCaracteres) return 0.7;
  return possuiNotaFinal ? 1.4 : 1.8;
};

const paginaBase = (
  boletim: BoletimImpressao,
  grupos: GrupoImpressao[],
  exibeTabela: boolean,
): PaginaBoletimRenderizacao => ({
  ...boletim,
  grupos,
  exibe_legenda: false,
  parecer_conclusivo: "",
  recomendacoes_aluno: "",
  recomendacoes_familia: "",
  exibe_recomendacoes: false,
  exibe_tabela: exibeTabela,
  exibe_assinaturas: false,
});

const adicionarPagina = (
  paginas: PaginaComContador[],
  boletim: BoletimImpressao,
  contador: number,
) => {
  paginas.push({ boletim: paginaBase(boletim, [], false), contador });
  return paginas.length - 1;
};

const adicionarRecomendacao = (
  paginas: PaginaComContador[],
  boletim: BoletimImpressao,
  campo: "recomendacoes_aluno" | "recomendacoes_familia",
  valor: string,
) => {
  if (!valor) return;
  let indicePagina = paginas.length - 1;
  if (paginas[indicePagina].contador + 2 >= LIMITE_LINHAS) {
    indicePagina = adicionarPagina(paginas, boletim, CONTADOR_INICIAL);
  }
  paginas[indicePagina].contador += 1;

  for (let inicio = 0; inicio < valor.length; inicio += CARACTERES_RECOMENDACAO) {
    if (paginas[indicePagina].contador + 0.7 >= LIMITE_LINHAS) {
      indicePagina = adicionarPagina(paginas, boletim, 7);
    }
    paginas[indicePagina].boletim[campo] += valor.slice(
      inicio,
      inicio + CARACTERES_RECOMENDACAO,
    );
    paginas[indicePagina].boletim.exibe_recomendacoes = true;
    paginas[indicePagina].contador += 0.7;
  }
};

export const paginarBoletimExtenso = (
  boletim: BoletimImpressao,
): PaginaBoletimRenderizacao[] => {
  const possuiNotaFinal = boletim.periodos.includes(0);
  const paginas: PaginaComContador[] = [];
  let grupos: GrupoImpressao[] = [];
  let contador = CONTADOR_INICIAL + 2;

  boletim.grupos.forEach((grupo, indice) => {
    if (indice > 0) contador += 0.7;
    grupos.push(grupo);
    grupo.componentes.forEach((componente) => {
      contador += pesoComponente(componente.nome, possuiNotaFinal);
    });
    if (contador >= LIMITE_LINHAS) {
      paginas.push({ boletim: paginaBase(boletim, grupos, true), contador });
      grupos = [];
      contador = CONTADOR_INICIAL;
      if (indice < boletim.grupos.length - 1) contador += 2;
    }
  });

  if (grupos.length || !paginas.length) {
    paginas.push({ boletim: paginaBase(boletim, grupos, true), contador });
  } else {
    paginas.push({ boletim: paginaBase(boletim, [], false), contador });
  }

  let paginaComplementos = paginas.at(-1)!;
  const pesoLegenda = boletim.exibe_legenda ? 1 : 0;
  const pesoParecer = pesoParecerConclusivo(boletim.parecer_conclusivo);
  if (paginaComplementos.contador + pesoLegenda + pesoParecer >= LIMITE_LINHAS) {
    const indiceComplementos = adicionarPagina(
      paginas,
      boletim,
      CONTADOR_INICIAL,
    );
    paginaComplementos = paginas[indiceComplementos];
  }
  paginaComplementos.boletim.exibe_legenda = boletim.exibe_legenda;
  paginaComplementos.boletim.parecer_conclusivo = boletim.parecer_conclusivo;
  paginaComplementos.contador += pesoLegenda + pesoParecer;

  if (boletim.exibe_recomendacoes) {
    adicionarRecomendacao(paginas, boletim, "recomendacoes_aluno", boletim.recomendacoes_aluno);
    adicionarRecomendacao(paginas, boletim, "recomendacoes_familia", boletim.recomendacoes_familia);
  }

  let ultimaPagina = paginas.length - 1;
  if (paginas[ultimaPagina].contador + 2 >= LIMITE_LINHAS) {
    ultimaPagina = adicionarPagina(paginas, boletim, CONTADOR_INICIAL);
  }
  paginas[ultimaPagina].boletim.exibe_assinaturas = true;

  return paginas.map((pagina) => pagina.boletim);
};
