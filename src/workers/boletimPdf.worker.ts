import fontkit from "@pdf-lib/fontkit";
import {
  PDFDocument,
  rgb,
  type PDFFont,
  type PDFImage,
  type PDFPage,
} from "pdf-lib";
import fonteNegritoUrl from "../assets/boletim/RobotoMono-Bold.ttf";
import fonteRegularUrl from "../assets/boletim/RobotoMono-Regular.ttf";
import logoUrl from "../assets/boletim/logo-sme.png";
import {
  ajustarTamanhoTexto,
  calcularAreasBoletins,
  calcularLimiteVertical,
  configuracaoBoletimSimples,
  configuracoesLayout,
  corrigirMojibakeUtf8,
  formatarPaginacao,
  periodosBoletimSimples,
  quebrarTexto,
  tamanhoTextoPercentual,
  type AreaBoletim,
} from "./layoutBoletim";
import type {
  BoletimImpressao,
  ContextoImpressaoBoletim,
  MensagemWorkerEntrada,
  MensagemWorkerSaida,
} from "../types/boletimImpressao";
import { paginarBoletimExtenso } from "./paginacaoBoletim";

const A4 = { largura: 595.28, altura: 841.89 };
const MARGEM = 14.17;
const COR = rgb(0.26, 0.28, 0.29);
const FUNDO = rgb(0.95, 0.95, 0.95);

const valorParaTexto = (valor: unknown) =>
  typeof valor === "string" ||
  typeof valor === "number" ||
  typeof valor === "boolean" ||
  typeof valor === "bigint"
    ? String(valor)
    : "";

interface RecursosPdf {
  regular: PDFFont;
  negrito: PDFFont;
  logo: PDFImage;
}

type Area = AreaBoletim;

const publicar = (mensagem: MensagemWorkerSaida, transferir?: Transferable[]) => {
  const conteudo =
    mensagem.tipo === "erro"
      ? { ...mensagem, mensagem: corrigirMojibakeUtf8(mensagem.mensagem) }
      : mensagem;
  globalThis.postMessage(conteudo, { transfer: transferir || [] });
};

const carregar = async (url: string) => {
  const resposta = await fetch(url);
  if (!resposta.ok) throw new Error("Não foi possível carregar os recursos do PDF.");
  return resposta.arrayBuffer();
};

const limitar = (texto: string, fonte: PDFFont, tamanho: number, largura: number) => {
  if (fonte.widthOfTextAtSize(texto, tamanho) <= largura) return texto;
  let fim = texto.length;
  while (fim > 1 && fonte.widthOfTextAtSize(`${texto.slice(0, fim)}...`, tamanho) > largura) {
    fim -= 1;
  }
  return `${texto.slice(0, fim)}...`;
};

const texto = (...[
  pagina,
  valor,
  x,
  topo,
  largura,
  fonte,
  tamanho,
  centralizado = false,
  recuo = 3,
  altura,
]: [PDFPage, unknown, number, number, number, PDFFont, number, boolean?, number?, number?]) => {
  const margemHorizontal = centralizado ? 0.5 : recuo;
  const exibido = limitar(
    corrigirMojibakeUtf8(valorParaTexto(valor)),
    fonte,
    tamanho,
    largura - margemHorizontal * 2,
  );
  const deslocamento = centralizado
    ? Math.max(2, (largura - fonte.widthOfTextAtSize(exibido, tamanho)) / 2)
    : recuo;
  pagina.drawText(exibido, {
    x: x + deslocamento,
    y:
      altura === undefined
        ? A4.altura - topo - tamanho - 2
        : A4.altura - topo - altura + altura / 2 - tamanho * 0.3,
    size: tamanho,
    font: fonte,
    color: COR,
  });
};

const celula = (...[
  pagina,
  valor,
  area,
  fonte,
  tamanho,
  centralizado = false,
  fundo = false,
  recuo = 3,
]: [PDFPage, unknown, Area, PDFFont, number, boolean?, boolean?, number?]) => {
  pagina.drawRectangle({
    x: area.x,
    y: A4.altura - area.topo - area.altura,
    width: area.largura,
    height: area.altura,
    borderColor: COR,
    borderWidth: 0.45,
    color: fundo ? FUNDO : undefined,
  });
  texto(
    pagina,
    valor,
    area.x,
    area.topo,
    area.largura,
    fonte,
    tamanho,
    centralizado,
    recuo,
    area.altura,
  );
};

const celulaComQuebra = (...[
  pagina,
  valor,
  area,
  fonte,
  tamanho,
  alturaLinhaTexto,
  fundo = false,
  recuo = 3,
]: [PDFPage, string, Area, PDFFont, number, number, boolean?, number?]) => {
  const linhas = linhasTexto(valor, fonte, tamanho, area.largura - recuo * 2);
  pagina.drawRectangle({
    x: area.x,
    y: A4.altura - area.topo - area.altura,
    width: area.largura,
    height: area.altura,
    borderColor: COR,
    borderWidth: 0.45,
    color: fundo ? FUNDO : undefined,
  });
  const alturaTexto = linhas.length * alturaLinhaTexto;
  const topoTexto = area.topo + Math.max(0, (area.altura - alturaTexto) / 2);
  linhas.forEach((linhaTexto, indice) => {
    pagina.drawText(linhaTexto, {
      x: area.x + recuo,
      y: A4.altura - topoTexto - tamanho - indice * alturaLinhaTexto,
      size: tamanho,
      font: fonte,
      color: COR,
    });
  });
};

const celulaAjustada = (...[
  pagina,
  valor,
  area,
  fonte,
  tamanho,
  centralizado = false,
  fundo = false,
  recuo = 3,
]: [PDFPage, unknown, Area, PDFFont, number, boolean?, boolean?, number?]) => {
  const textoValor = corrigirMojibakeUtf8(valorParaTexto(valor));
  const larguraDisponivel = area.largura - (centralizado ? 1 : recuo * 2);
  const tamanhoAjustado = ajustarTamanhoTexto(
    tamanho,
    (tamanhoAtual) =>
      fonte.widthOfTextAtSize(textoValor, tamanhoAtual) <= larguraDisponivel,
  );
  celula(
    pagina,
    textoValor,
    area,
    fonte,
    tamanhoAjustado,
    centralizado,
    fundo,
    recuo,
  );
};

const textoDireita = (
  pagina: PDFPage,
  valor: unknown,
  area: Area,
  fonte: PDFFont,
  tamanho: number,
) => {
  const exibido = limitar(
    corrigirMojibakeUtf8(valorParaTexto(valor)),
    fonte,
    tamanho,
    area.largura - 2,
  );
  pagina.drawText(exibido, {
    x:
      area.x +
      area.largura -
      fonte.widthOfTextAtSize(exibido, tamanho) -
      2,
    y: A4.altura - area.topo - tamanho - 1,
    size: tamanho,
    font: fonte,
    color: COR,
  });
};

const linhasTexto = (
  valor: string,
  fonte: PDFFont,
  tamanho: number,
  largura: number,
) =>
  quebrarTexto(
    corrigirMojibakeUtf8(valor),
    (linha) => fonte.widthOfTextAtSize(linha, tamanho) <= largura - 6,
  );

const celulaMultilinha = (
  pagina: PDFPage,
  valor: string,
  area: Omit<Area, "altura">,
  fonte: PDFFont,
  tamanho: number,
  alturaLinha: number,
) => {
  const linhas = linhasTexto(valor, fonte, tamanho, area.largura);
  const altura = Math.max(alturaLinha, linhas.length * alturaLinha + 4);
  pagina.drawRectangle({
    x: area.x,
    y: A4.altura - area.topo - altura,
    width: area.largura,
    height: altura,
    borderColor: COR,
    borderWidth: 0.45,
  });
  linhas.forEach((linha, indice) => {
    pagina.drawText(linha, {
      x: area.x + 3,
      y: A4.altura - area.topo - tamanho - 2 - indice * alturaLinha,
      size: tamanho,
      font: fonte,
      color: COR,
    });
  });
  return altura;
};

const desenharRodape = (
  pagina: PDFPage,
  contexto: ContextoImpressaoBoletim,
  indice: number,
  totalPaginas: number,
  recursos: RecursosPdf,
) => {
  const tamanho = 5.3;
  const atualizacao = contexto.dados_atualizados_em || "não informado";
  pagina.drawText(
    corrigirMojibakeUtf8(
      `SGP - Sistema de Gestão Pedagógica | Dados atualizados em ${atualizacao} | Gerado em ${contexto.data_impressao}`,
    ),
    { x: MARGEM, y: 6, size: tamanho, font: recursos.regular, color: COR },
  );
  const paginas = formatarPaginacao(indice, totalPaginas);
  pagina.drawText(paginas, {
    x: A4.largura - MARGEM - recursos.regular.widthOfTextAtSize(paginas, tamanho),
    y: 6,
    size: tamanho,
    font: recursos.regular,
    color: COR,
  });
};

const desenharBoletimSimples = (
  pagina: PDFPage,
  boletim: BoletimImpressao,
  area: Area,
  recursos: RecursosPdf,
  dataImpressao: string,
) => {
  const configuracao = configuracoesLayout[6];
  const x = area.x + configuracao.margemInterna;
  const largura = area.largura - configuracao.margemInterna * 2;
  const limite = area.topo + area.altura - configuracao.margemInterna;
  const tamanhoTabela = 4.5;
  const tamanhoCabecalho = 5.25;
  const alturaLinhaCabecalho =
    configuracaoBoletimSimples.alturaLinhaCabecalho;
  const alturaLinha = configuracaoBoletimSimples.alturaLinhaTabela;
  let topo = area.topo + configuracao.margemInterna;

  pagina.drawRectangle({
    x: area.x,
    y: A4.altura - area.topo - area.altura,
    width: area.largura,
    height: area.altura,
    borderColor: COR,
    borderWidth: 0.75,
  });

  const logoAltura = 24;
  pagina.drawImage(recursos.logo, {
    x,
    y: A4.altura - topo - logoAltura,
    width: logoAltura * (recursos.logo.width / recursos.logo.height),
    height: logoAltura,
  });
  const tituloX = x + largura * 0.18;
  const tituloLargura = largura - (tituloX - x);
  textoDireita(pagina, "SGP - SISTEMA DE GESTÃO PEDAGÓGICA", { x: tituloX, topo, largura: tituloLargura, altura: 8 }, recursos.negrito, 7.5);
  textoDireita(pagina, "BOLETIM ESCOLAR", { x: tituloX, topo: topo + 8, largura: tituloLargura, altura: 10 }, recursos.regular, 10.5);
  textoDireita(pagina, boletim.dados.ano_letivo, { x: tituloX, topo: topo + 18, largura: tituloLargura, altura: 10 }, recursos.regular, 10.5);
  topo += configuracaoBoletimSimples.alturaCabecalhoPrincipal;

  const quarto = largura * 0.25;
  celulaAjustada(pagina, `DRE: ${boletim.dados.dre_nome}`, { x, topo, largura: quarto, altura: alturaLinhaCabecalho }, recursos.regular, tamanhoCabecalho, false, false, 3);
  celulaAjustada(pagina, `UE: ${boletim.dados.ue_nome}`, { x: x + quarto, topo, largura: largura - quarto, altura: alturaLinhaCabecalho }, recursos.regular, tamanhoCabecalho, false, false, 3);
  topo += alturaLinhaCabecalho;
  celulaAjustada(pagina, `TURMA: ${boletim.dados.turma_relatorio}`, { x, topo, largura: quarto, altura: alturaLinhaCabecalho }, recursos.regular, tamanhoCabecalho, false, false, 3);
  celulaAjustada(pagina, `ESTUDANTE: ${boletim.nome_aluno}`, { x: x + quarto, topo, largura: largura - quarto, altura: alturaLinhaCabecalho }, recursos.regular, tamanhoCabecalho, false, false, 3);
  topo += alturaLinhaCabecalho;
  celulaAjustada(pagina, `FREQUÊNCIA GLOBAL: ${boletim.frequencia_global}`, { x, topo, largura: largura / 2, altura: alturaLinhaCabecalho }, recursos.regular, tamanhoCabecalho, false, false, 3);
  celulaAjustada(pagina, `DATA DE IMPRESSÃO: ${dataImpressao}`, { x: x + largura / 2, topo, largura: largura / 2, altura: alturaLinhaCabecalho }, recursos.regular, tamanhoCabecalho, false, false, 3);
  topo +=
    alturaLinhaCabecalho +
    configuracaoBoletimSimples.margemAposIdentificacao;

  const periodos = periodosBoletimSimples(boletim.periodos);
  const semestral = periodos.length === 3;
  const larguraComponente = largura * (semestral ? 0.48 : 0.27);
  const larguraPeriodo = (largura - larguraComponente) / periodos.length;
  celulaAjustada(pagina, "", { x, topo, largura: larguraComponente, altura: alturaLinha * 2 }, recursos.regular, tamanhoTabela, false, false, 3);
  periodos.forEach((periodo, indice) => {
    const colunaX = x + larguraComponente + larguraPeriodo * indice;
    celulaAjustada(pagina, periodo === 0 ? "FINAL" : `${periodo}º BIMESTRE`, { x: colunaX, topo, largura: larguraPeriodo, altura: alturaLinha }, recursos.regular, tamanhoTabela, true, true);
    celulaAjustada(pagina, "Nota", { x: colunaX, topo: topo + alturaLinha, largura: larguraPeriodo / 2, altura: alturaLinha }, recursos.regular, tamanhoTabela, true, true);
    celulaAjustada(pagina, "% Freq.", { x: colunaX + larguraPeriodo / 2, topo: topo + alturaLinha, largura: larguraPeriodo / 2, altura: alturaLinha }, recursos.regular, tamanhoTabela, true, true);
  });
  topo += alturaLinha * 2;

  boletim.grupos.forEach((grupo) => {
    grupo.componentes.forEach((componente) => {
      celulaAjustada(pagina, componente.nome, { x, topo, largura: larguraComponente, altura: alturaLinha }, recursos.regular, tamanhoTabela, false, false, 3);
      periodos.forEach((periodo, indice) => {
        const origem = boletim.periodos.indexOf(periodo);
        const valores = origem >= 0 ? componente.periodos[origem] : undefined;
        const colunaX = x + larguraComponente + larguraPeriodo * indice;
        celulaAjustada(pagina, valores?.nota ?? "", { x: colunaX, topo, largura: larguraPeriodo / 2, altura: alturaLinha }, recursos.regular, tamanhoTabela, true);
        const frequencia = valores?.frequencia ?? "";
        const tamanhoFrequencia = tamanhoTextoPercentual(tamanhoTabela, frequencia);
        if (!componente.eh_regencia) {
          celulaAjustada(pagina, frequencia, { x: colunaX + larguraPeriodo / 2, topo, largura: larguraPeriodo / 2, altura: alturaLinha }, recursos.regular, tamanhoFrequencia, true);
        } else if (componente.primeira_linha_regencia) {
          celulaAjustada(pagina, frequencia, { x: colunaX + larguraPeriodo / 2, topo, largura: larguraPeriodo / 2, altura: alturaLinha * Math.max(1, componente.linhas_regencia || 1) }, recursos.regular, tamanhoFrequencia, true);
        }
      });
      topo += alturaLinha;
    });
  });

  if (boletim.parecer_conclusivo) {
    celulaAjustada(pagina, `Parecer conclusivo: ${boletim.parecer_conclusivo}`, { x, topo, largura, altura: alturaLinha }, recursos.regular, tamanhoTabela, false, false, 3);
  }
  topo += alturaLinha;

  const topoRodape = limite - 27;
  pagina.drawLine({
    start: { x, y: A4.altura - topoRodape },
    end: { x: x + largura, y: A4.altura - topoRodape },
    thickness: 0.75,
    color: COR,
  });
  texto(pagina, "OBSERVAÇÕES:", x + 3, topoRodape + 4, largura - 6, recursos.regular, 7.5);
  [15, 24].forEach((deslocamento) => {
    pagina.drawLine({
      start: { x: x + 6, y: A4.altura - topoRodape - deslocamento },
      end: { x: x + largura - 6, y: A4.altura - topoRodape - deslocamento },
      thickness: 0.75,
      color: COR,
    });
  });
};

interface ContextoPeriodosTabela {
  pagina: PDFPage;
  componente: BoletimImpressao["grupos"][number]["componentes"][number];
  periodos: number[];
  componenteIndice: number;
  alturasComponentes: number[];
  x: number;
  topo: number;
  larguraNome: number;
  larguraPeriodo: number;
  alturaComponente: number;
  recursos: RecursosPdf;
  tamanhoValor: number;
}

const desenharPeriodosTabela = ({
  pagina,
  componente,
  periodos,
  componenteIndice,
  alturasComponentes,
  x,
  topo,
  larguraNome,
  larguraPeriodo,
  alturaComponente,
  recursos,
  tamanhoValor,
}: ContextoPeriodosTabela) => {
  componente.periodos.slice(0, periodos.length).forEach((periodo, indice) => {
    const colunaX = x + larguraNome + larguraPeriodo * indice;
    celula(pagina, periodo.nota, { x: colunaX, topo, largura: larguraPeriodo / 2, altura: alturaComponente }, recursos.regular, tamanhoValor, true);
    if (!componente.eh_regencia) {
      celula(pagina, periodo.frequencia, { x: colunaX + larguraPeriodo / 2, topo, largura: larguraPeriodo / 2, altura: alturaComponente }, recursos.regular, tamanhoValor, true);
      return;
    }
    if (!componente.primeira_linha_regencia) return;
    const quantidadeRegencia = Math.max(1, componente.linhas_regencia || 1);
    const alturaRegencia = alturasComponentes
      .slice(componenteIndice, componenteIndice + quantidadeRegencia)
      .reduce((total, alturaAtual) => total + alturaAtual, 0);
    celula(pagina, periodo.frequencia, { x: colunaX + larguraPeriodo / 2, topo, largura: larguraPeriodo / 2, altura: alturaRegencia }, recursos.regular, tamanhoValor, true);
  });
};

const desenharBoletim = (
  pagina: PDFPage,
  boletim: BoletimImpressao,
  area: Area,
  recursos: RecursosPdf,
  densidade: 1 | 2 | 6,
  dataImpressao: string,
) => {
  if (densidade === 6) {
    desenharBoletimSimples(pagina, boletim, area, recursos, dataImpressao);
    return;
  }
  const configuracao = configuracoesLayout[densidade];
  const x = area.x + configuracao.margemInterna;
  const largura = area.largura - configuracao.margemInterna * 2;
  const linha = configuracao.alturaLinha;
  const tamanho = configuracao.tamanhoTexto;
  const limite = calcularLimiteVertical(
    densidade,
    area.topo,
    area.altura,
    A4.altura,
    MARGEM,
  );
  const exibeTabela = !("exibe_tabela" in boletim) || boletim.exibe_tabela;
  const exibeAssinaturas =
    !("exibe_assinaturas" in boletim) || boletim.exibe_assinaturas;
  let topo = area.topo + configuracao.margemInterna;

  if (configuracao.bordaExterna) {
    pagina.drawRectangle({
      x: area.x,
      y: A4.altura - area.topo - area.altura,
      width: area.largura,
      height: area.altura,
      borderColor: COR,
      borderWidth: 0.45,
    });
  }

  const logoAltura = configuracao.logoAltura;
  const proporcao = recursos.logo.width / recursos.logo.height;
  pagina.drawImage(recursos.logo, {
    x,
    y: A4.altura - topo - logoAltura,
    width: logoAltura * proporcao,
    height: logoAltura,
  });
  const tituloX = x + largura * 0.1;
  const tituloLargura = largura - (tituloX - x);
  const alturaPrimeiroTitulo = configuracao.tamanhoTitulo * 1.125;
  const alturaDemaisTitulos =
    (configuracao.alturaCabecalho - alturaPrimeiroTitulo) / 3;
  textoDireita(pagina, `BOLETIM ESCOLAR - ${boletim.dados.ano_letivo}`, { x: tituloX, topo, largura: tituloLargura, altura: alturaPrimeiroTitulo }, recursos.negrito, configuracao.tamanhoTitulo);
  textoDireita(pagina, "SECRETARIA MUNICIPAL DE EDUCAÇÃO", { x: tituloX, topo: topo + alturaPrimeiroTitulo, largura: tituloLargura, altura: alturaDemaisTitulos }, recursos.regular, configuracao.tamanhoSubtitulo);
  textoDireita(pagina, boletim.dados.dre_nome, { x: tituloX, topo: topo + alturaPrimeiroTitulo + alturaDemaisTitulos, largura: tituloLargura, altura: alturaDemaisTitulos }, recursos.regular, configuracao.tamanhoSubtitulo);
  textoDireita(pagina, boletim.dados.ue_nome, { x: tituloX, topo: topo + alturaPrimeiroTitulo + alturaDemaisTitulos * 2, largura: tituloLargura, altura: alturaDemaisTitulos }, recursos.regular, configuracao.tamanhoSubtitulo);
  topo += configuracao.alturaCabecalho + configuracao.margemSecao;

  const metade = largura / 2;
  const exibeCiclo = Boolean(boletim.dados.ciclo);
  celula(pagina, `Estudante: ${boletim.nome_aluno}`, { x, topo, largura: exibeCiclo ? metade : largura, altura: linha }, recursos.regular, tamanho, false, false, configuracao.recuoCelula);
  if (exibeCiclo) {
    celula(pagina, `Ciclo: ${boletim.dados.ciclo}`, { x: x + metade, topo, largura: metade, altura: linha }, recursos.regular, tamanho, false, false, configuracao.recuoCelula);
  }
  topo += linha;
  const terco = largura / 3;
  celula(pagina, `Código EOL: ${boletim.dados.aluno_codigo}`, { x, topo, largura: terco, altura: linha }, recursos.regular, tamanho, false, false, configuracao.recuoCelula);
  celula(pagina, `Turma: ${boletim.dados.turma_relatorio}`, { x: x + terco, topo, largura: terco, altura: linha }, recursos.regular, tamanho, false, false, configuracao.recuoCelula);
  celula(pagina, `Frequência Global: ${boletim.frequencia_global}`, { x: x + terco * 2, topo, largura: terco, altura: linha }, recursos.regular, tamanho, false, false, configuracao.recuoCelula);
  topo += linha + configuracao.margemSecao;

  if (exibeTabela) {
  const periodos = boletim.periodos;
  const larguraNome = largura * 0.44;
  const larguraPeriodo = (largura - larguraNome) / Math.max(1, periodos.length);
  celula(pagina, "Componentes curriculares", { x, topo, largura: larguraNome, altura: linha * 2 }, recursos.negrito, tamanho, false, true, configuracao.recuoCelula);
  periodos.forEach((periodo, indice) => {
    const colunaX = x + larguraNome + larguraPeriodo * indice;
    celula(pagina, periodo === 0 ? "Final" : `${periodo}º Bim.`, { x: colunaX, topo, largura: larguraPeriodo, altura: linha }, recursos.negrito, configuracao.tamanhoCabecalhoTabela, true, true);
    celula(pagina, boletim.usa_conceito ? "Conc." : "Nota", { x: colunaX, topo: topo + linha, largura: larguraPeriodo / 2, altura: linha }, recursos.regular, configuracao.tamanhoCabecalhoTabela, true, true);
    celula(pagina, "%", { x: colunaX + larguraPeriodo / 2, topo: topo + linha, largura: larguraPeriodo / 2, altura: linha }, recursos.regular, configuracao.tamanhoCabecalhoTabela, true, true);
  });
  topo += linha * 2;

  boletim.grupos.forEach((grupo, grupoIndice) => {
    if (grupoIndice > 0) topo += configuracao.margemSecao;
    const alturasComponentes = grupo.componentes.map((componente) => {
      const quantidadeLinhas = Math.max(
        1,
        linhasTexto(
          componente.nome,
          recursos.regular,
          tamanho,
          larguraNome - configuracao.recuoCelula * 2,
        ).length,
      );
      const espacoAdicional = quantidadeLinhas > 1 ? 4 : 0;
      return Math.max(
        linha,
        quantidadeLinhas * tamanho * 1.2 + espacoAdicional,
      );
    });
    grupo.componentes.forEach((componente, componenteIndice) => {
      const alturaComponente = alturasComponentes[componenteIndice];
      celulaComQuebra(
        pagina,
        componente.nome,
        { x, topo, largura: larguraNome, altura: alturaComponente },
        recursos.regular,
        tamanho,
        tamanho * 1.2,
        false,
        configuracao.recuoCelula,
      );
      desenharPeriodosTabela({
        pagina,
        componente,
        periodos,
        componenteIndice,
        alturasComponentes,
        x,
        topo,
        larguraNome,
        larguraPeriodo,
        alturaComponente,
        recursos,
        tamanhoValor: configuracao.tamanhoValorTabela,
      });
      topo += alturaComponente;
    });
  });

  if (densidade === 1 && topo > limite) {
    throw new Error(`O boletim de ${boletim.nome_aluno} excedeu o espaço do layout.`);
  }
  }

  if (boletim.exibe_legenda) {
    topo += configuracao.margemSecao;
    const legenda = "Legenda: F:Frequente - NF:Não Frequente - P:Plenamente Satisfatório - S:Satisfatório - NS:Não Satisfatório";
    const linhasLegenda = linhasTexto(legenda, recursos.regular, tamanho, largura);
    linhasLegenda.forEach((linhaLegenda, indice) => {
      texto(pagina, linhaLegenda, x, topo + indice * tamanho * 1.2, largura, recursos.regular, tamanho);
    });
    topo += Math.max(linha, linhasLegenda.length * tamanho * 1.2);
  }
  if (boletim.parecer_conclusivo) {
    topo += configuracao.margemSecao;
    const parecer = `Parecer Conclusivo: ${boletim.parecer_conclusivo}`;
    const linhasParecer = linhasTexto(parecer, recursos.regular, tamanho, largura);
    const alturaParecer = Math.max(linha, linhasParecer.length * tamanho * 1.2 + 4);
    celulaComQuebra(pagina, parecer, { x, topo, largura, altura: alturaParecer }, recursos.regular, tamanho, tamanho * 1.2, true, configuracao.recuoCelula);
    topo += alturaParecer;
  }
  if (boletim.exibe_recomendacoes) {
    for (const [rotulo, valor] of [
      ["Recomendações ao estudante", boletim.recomendacoes_aluno],
      ["Recomendações à família", boletim.recomendacoes_familia],
    ] as const) {
      if (!valor) continue;
      topo += configuracao.margemSecao;
      celula(pagina, rotulo, { x, topo, largura, altura: linha }, recursos.negrito, tamanho, true, true);
      topo += linha;
      topo += celulaMultilinha(
        pagina,
        valor,
        { x, topo, largura },
        recursos.regular,
        tamanho,
        tamanho * 1.2,
      );
    }
  }

  if (exibeAssinaturas) {
    topo += 1;
    for (let indice = 0; indice < 2; indice += 1) {
      topo += linha;
      pagina.drawLine({
        start: { x, y: A4.altura - topo },
        end: { x: x + largura, y: A4.altura - topo },
        thickness: 0.45,
        color: COR,
      });
    }
  }

  if (densidade === 1 && topo > limite) {
    throw new Error(`O boletim de ${boletim.nome_aluno} excedeu o espaço do layout.`);
  }

};

const gerar = async (contexto: ContextoImpressaoBoletim) => {
  const [regularBytes, negritoBytes, logoBytes] = await Promise.all([
    carregar(fonteRegularUrl),
    carregar(fonteNegritoUrl),
    carregar(logoUrl),
  ]);
  publicar({ tipo: "progresso", valor: 5 });
  const documento = await PDFDocument.create();
  documento.registerFontkit(fontkit);
  const [regular, negrito, logo] = await Promise.all([
    documento.embedFont(regularBytes, { subset: true }),
    documento.embedFont(negritoBytes, { subset: true }),
    documento.embedPng(logoBytes),
  ]);
  const recursos = { regular, negrito, logo };
  const paginasOriginais = contexto.paginas.map((pagina) =>
    pagina.linhas.flatMap((linha) => linha.boletins),
  );
  const paginasRenderizacao =
    contexto.boletins_por_pagina === 1
      ? paginasOriginais
          .flat()
          .flatMap((boletim) =>
            paginarBoletimExtenso(boletim).map((fragmento) => [fragmento]),
          )
      : paginasOriginais;
  const totalBoletins = Math.max(
    1,
    paginasRenderizacao.reduce((total, boletins) => total + boletins.length, 0),
  );
  let processados = 0;
  paginasRenderizacao.forEach((boletins, paginaIndice) => {
    const pagina = documento.addPage([A4.largura, A4.altura]);
    const areas = calcularAreasBoletins(
      contexto.boletins_por_pagina,
      boletins.length,
      A4.largura,
      MARGEM,
    );
    boletins.forEach((boletim, indice) => {
      desenharBoletim(
        pagina,
        boletim,
        areas[indice],
        recursos,
        contexto.boletins_por_pagina,
        contexto.data_impressao,
      );
      processados += 1;
      publicar({ tipo: "progresso", valor: 5 + (processados / totalBoletins) * 85 });
    });
    desenharRodape(
      pagina,
      contexto,
      paginaIndice,
      paginasRenderizacao.length,
      recursos,
    );
  });
  publicar({ tipo: "progresso", valor: 92 });
  const bytes = await documento.save({ useObjectStreams: true, addDefaultPage: false });
  const arquivo = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  publicar({ tipo: "concluido", arquivo }, [arquivo]);
};

globalThis.onmessage = (evento: MessageEvent<MensagemWorkerEntrada>) => {
  if (evento.data.tipo !== "gerar") return;
  void gerar(evento.data.contexto).catch((error: unknown) => {
    publicar({
      tipo: "erro",
      mensagem: error instanceof Error ? error.message : "Não foi possível gerar o PDF.",
    });
  });
};
