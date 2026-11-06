export type DensidadeBoletim = 1 | 2 | 6;

export interface AreaBoletim {
  x: number;
  topo: number;
  largura: number;
  altura: number;
}

export interface ConfiguracaoLayoutBoletim {
  altura: number;
  colunas: number;
  espacamentoVertical: number;
  margemInterna: number;
  logoAltura: number;
  tamanhoTitulo: number;
  tamanhoSubtitulo: number;
  tamanhoTexto: number;
  tamanhoCabecalhoTabela: number;
  tamanhoValorTabela: number;
  alturaLinha: number;
  alturaCabecalho: number;
  recuoCelula: number;
  margemSecao: number;
  bordaExterna: boolean;
}

const PX_PARA_PONTO = 0.75;
const CM_PARA_PONTO = 72 / 2.54;

const bytesWindows1252: Record<number, number> = {
  0x20ac: 0x80,
  0x201a: 0x82,
  0x0192: 0x83,
  0x201e: 0x84,
  0x2026: 0x85,
  0x2020: 0x86,
  0x2021: 0x87,
  0x02c6: 0x88,
  0x2030: 0x89,
  0x0160: 0x8a,
  0x2039: 0x8b,
  0x0152: 0x8c,
  0x017d: 0x8e,
  0x2018: 0x91,
  0x2019: 0x92,
  0x201c: 0x93,
  0x201d: 0x94,
  0x2022: 0x95,
  0x2013: 0x96,
  0x2014: 0x97,
  0x02dc: 0x98,
  0x2122: 0x99,
  0x0161: 0x9a,
  0x203a: 0x9b,
  0x0153: 0x9c,
  0x017e: 0x9e,
  0x0178: 0x9f,
};

const temMojibake = (valor: string) =>
  Array.from(valor).some((caractere, indice, caracteres) => {
    const codigo = caractere.charCodeAt(0);
    const proximo = caracteres[indice + 1]?.charCodeAt(0) ?? 0;
    return (
      (codigo === 0xc2 || codigo === 0xc3) &&
      ((proximo >= 0x80 && proximo <= 0xbf) || proximo === 0x0192)
    );
  });

const decodificarWindows1252ComoUtf8 = (valor: string) => {
  const bytes = Array.from(valor, (caractere) => {
    const codigo = caractere.charCodeAt(0);
    return codigo <= 0xff ? codigo : bytesWindows1252[codigo] ?? codigo;
  });
  return new TextDecoder("utf-8", { fatal: true }).decode(
    Uint8Array.from(bytes),
  );
};

export const corrigirMojibakeUtf8 = (valor: string) => {
  let corrigido = valor;
  for (let tentativa = 0; tentativa < 2; tentativa += 1) {
    if (!temMojibake(corrigido)) break;
    try {
      corrigido = decodificarWindows1252ComoUtf8(corrigido);
    } catch {
      break;
    }
  }
  return corrigido;
};

export const formatarPaginacao = (indice: number, total: number) =>
  `${indice + 1} / ${total}`;

export const calcularLimiteVertical = (
  densidade: DensidadeBoletim,
  topo: number,
  altura: number,
  alturaPagina: number,
  margemPagina: number,
) =>
  densidade === 1
    ? alturaPagina - margemPagina
    : topo + altura - configuracoesLayout[densidade].margemInterna;

export const periodosBoletimSimples = (periodos: number[]) => {
  const semestral = !periodos.includes(3) && !periodos.includes(4);
  return semestral ? [1, 2, 0] : [1, 2, 3, 4, 0];
};

export const configuracaoBoletimSimples = {
  alturaCabecalhoPrincipal: 37,
  alturaLinhaCabecalho: 8,
  alturaLinhaTabela: 7,
  margemAposIdentificacao: 6,
};


export const configuracoesLayout: Record<
  DensidadeBoletim,
  ConfiguracaoLayoutBoletim
> = {
  1: {
    altura: 27.8 * CM_PARA_PONTO,
    colunas: 1,
    espacamentoVertical: 0,
    margemInterna: 0,
    logoAltura: 64 * PX_PARA_PONTO,
    tamanhoTitulo: 12 * PX_PARA_PONTO,
    tamanhoSubtitulo: 14 * PX_PARA_PONTO,
    tamanhoTexto: 12 * PX_PARA_PONTO,
    tamanhoCabecalhoTabela: 11 * PX_PARA_PONTO,
    tamanhoValorTabela: 8 * PX_PARA_PONTO,
    alturaLinha: 14.12,
    alturaCabecalho: 60.75,
    recuoCelula: 7.5,
    margemSecao: 10 * PX_PARA_PONTO,
    bordaExterna: false,
  },
  2: {
    altura: 12.9 * CM_PARA_PONTO,
    colunas: 1,
    espacamentoVertical: 48 * PX_PARA_PONTO,
    margemInterna: 0,
    logoAltura: 51.2 * PX_PARA_PONTO,
    tamanhoTitulo: 9.6 * PX_PARA_PONTO,
    tamanhoSubtitulo: 11.2 * PX_PARA_PONTO,
    tamanhoTexto: 9.6 * PX_PARA_PONTO,
    tamanhoCabecalhoTabela: 8.8 * PX_PARA_PONTO,
    tamanhoValorTabela: 8 * PX_PARA_PONTO,
    alturaLinha: 11.3,
    alturaCabecalho: 38.88,
    recuoCelula: 6,
    margemSecao: 4 * PX_PARA_PONTO,
    bordaExterna: false,
  },
  6: {
    altura: 9 * CM_PARA_PONTO,
    colunas: 2,
    espacamentoVertical: 1 * PX_PARA_PONTO,
    margemInterna: 5 * PX_PARA_PONTO,
    logoAltura: 28 * PX_PARA_PONTO,
    tamanhoTitulo: 6 * PX_PARA_PONTO,
    tamanhoSubtitulo: 7 * PX_PARA_PONTO,
    tamanhoTexto: 6 * PX_PARA_PONTO,
    tamanhoCabecalhoTabela: 5 * PX_PARA_PONTO,
    tamanhoValorTabela: 4 * PX_PARA_PONTO,
    alturaLinha: 7.06,
    alturaCabecalho: 24.3,
    recuoCelula: 2.25,
    margemSecao: 2 * PX_PARA_PONTO,
    bordaExterna: true,
  },
};

export const calcularAreasBoletins = (
  densidade: DensidadeBoletim,
  quantidade: number,
  larguraPagina: number,
  margem: number,
) => {
  const configuracao = configuracoesLayout[densidade];
  const larguraUtil = larguraPagina - margem * 2;
  const largura = larguraUtil / configuracao.colunas;

  return Array.from({ length: quantidade }, (_, indice): AreaBoletim => {
    const linha = Math.floor(indice / configuracao.colunas);
    const coluna = indice % configuracao.colunas;
    return {
      x: margem + coluna * largura,
      topo:
        margem +
        linha * (configuracao.altura + configuracao.espacamentoVertical),
      largura,
      altura: configuracao.altura,
    };
  });
};

export const quebrarTexto = (
  valor: string,
  cabeNaLinha: (linha: string) => boolean,
) => {
  const palavras = valor.trim().split(/\s+/).filter(Boolean);
  const linhas: string[] = [];
  let linha = "";

  for (const palavra of palavras) {
    const candidata = linha ? `${linha} ${palavra}` : palavra;
    if (linha && !cabeNaLinha(candidata)) {
      linhas.push(linha);
      linha = palavra;
    } else {
      linha = candidata;
    }
  }
  if (linha) linhas.push(linha);
  return linhas;
};

export const ajustarTamanhoTexto = (
  tamanho: number,
  cabe: (tamanhoAtual: number) => boolean,
) => {
  const minimo = tamanho * 0.6;
  let atual = tamanho;
  while (atual > minimo && !cabe(atual)) atual -= 0.2;
  return atual;
};

export const tamanhoTextoPercentual = (tamanho: number, valor: unknown) =>
  /^\d{3}(?:[.,]\d+)?%$/.test(String(valor ?? "").trim())
    ? tamanho * 0.85
    : tamanho;
