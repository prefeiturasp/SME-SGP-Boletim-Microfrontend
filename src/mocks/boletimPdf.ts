import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

export interface ResumoBoletim {
  exibirHistorico: string;
  anoLetivo: string;
  dre: string;
  ue: string;
  modalidade: string;
  turma: string;
  estudantes: string;
  boletinsPorPagina: string;
  imprimirInativos: string;
}

interface NotaBimestre {
  conceito: string;
  percentual: string;
}

interface LinhaComponente {
  nome: string;
  bimestres: NotaBimestre[];
  final: string;
}

interface BoletimEstudante {
  numero: string;
  nome: string;
  eol: string;
  turma: string;
  ciclo: string;
  frequenciaGlobal: string;
  componentes: LinhaComponente[];
  areas: { nome: string; valores: string[] }[];
  grupos: { nome: string; valores: string[] }[];
  recomendacoes: string;
}

const preto = rgb(0.1, 0.1, 0.1);
const cinza = rgb(0.45, 0.45, 0.45);
const borda = rgb(0.55, 0.55, 0.55);

const vazio = { conceito: "", percentual: "" };

const boletimMiguel = (turma: string): BoletimEstudante => ({
  numero: "22",
  nome: "MIGUEL LOPES SARMENTO",
  eol: "7732087",
  turma: turma || "EF - 1A",
  ciclo: "Alfabetização",
  frequenciaGlobal: "97.48%",
  componentes: [
    {
      nome: "Arte",
      bimestres: [
        { conceito: "S", percentual: "92.86%" },
        { conceito: "S", percentual: "94.12%" },
        vazio,
        vazio,
      ],
      final: "-",
    },
    {
      nome: "Ed. Física",
      bimestres: [
        { conceito: "P", percentual: "100.00%" },
        { conceito: "S", percentual: "100.00%" },
        vazio,
        vazio,
      ],
      final: "-",
    },
    {
      nome: "Inglês",
      bimestres: [
        { conceito: "", percentual: "100.00%" },
        { conceito: "P", percentual: "100.00%" },
        vazio,
        vazio,
      ],
      final: "-",
    },
    {
      nome: "Ciências",
      bimestres: [{ conceito: "S", percentual: "" }, { conceito: "P", percentual: "" }, vazio, vazio],
      final: "-",
    },
    {
      nome: "Geografia",
      bimestres: [{ conceito: "S", percentual: "" }, { conceito: "P", percentual: "" }, vazio, vazio],
      final: "-",
    },
    {
      nome: "História",
      bimestres: [
        { conceito: "S", percentual: "90.00%" },
        { conceito: "P", percentual: "90.00%" },
        vazio,
        vazio,
      ],
      final: "-",
    },
    {
      nome: "Língua Portuguesa",
      bimestres: [{ conceito: "S", percentual: "" }, { conceito: "P", percentual: "" }, vazio, vazio],
      final: "-",
    },
    {
      nome: "Matemática",
      bimestres: [{ conceito: "S", percentual: "" }, { conceito: "P", percentual: "" }, vazio, vazio],
      final: "-",
    },
  ],
  areas: [
    { nome: "Laboratório de Educação Digital", valores: ["100.00%", "100.00%", "-", "-"] },
    { nome: "Sala de leitura", valores: ["100.00%", "100.00%", "-", "-"] },
  ],
  grupos: [
    { nome: "I - EDUCOMUNICAÇÃO E NOVAS LINGUAGENS", valores: ["100.00%", "100.00%"] },
    { nome: "II - CULTURAS, ARTE E MEMÓRIA - JOGOS", valores: ["100.00%", "98.00%"] },
    { nome: "II - CULTURAS, ARTE E MEMÓRIA - JOGOS E BRINCADEIRAS", valores: ["100.00%", "98.00%"] },
    { nome: "III - ORIENTAÇÃO DE ESTUDOS E INVESTIGAÇÃO", valores: ["100.00%", "98.00%"] },
    { nome: "III - ORIENTAÇÃO DE ESTUDOS E INVESTIGAÇÃO CIENTÍFICA", valores: ["90.91%", "100.00%"] },
    { nome: "III - ORIENTAÇÃO DE ESTUDOS E INVESTIGAÇÃO", valores: ["90.91%", "100.00%"] },
    { nome: "VI - CULTURA CORPORAL, APRENDIZAGEM E CONVIVÊNCIA", valores: ["92.31%", "83.33%"] },
  ],
  recomendacoes:
    "Busque ir além dos conhecimentos trabalhados em sala de aula. Seja curioso. Cuide de seu material escolar. Ele é de sua responsabilidade. Cuide de suas relações pessoais. Busque ajuda e orientação de professores, funcionários e gestores sempre que necessário. Desenvolva uma rotina de estudo e organização para o cumprimento das tarefas e prazos escolares. Esclareça suas dúvidas com os professores sempre que necessário. Frequente as aulas diariamente. Em caso de ausência, justifique-a. Frequente bibliotecas e sites confiáveis para pesquisa. Leia, releia, converse com seus colegas e outros adultos sobre temas estudados, buscando ampliar seu entendimento sobre eles. Participe das aulas com atenção, pergunte quando tiver dúvidas e faça registro das ideias centrais da aula. Peça permissão para falar e saiba ouvir seus colegas.",
});

const variar = (base: BoletimEstudante, dados: Partial<BoletimEstudante>): BoletimEstudante => ({
  ...base,
  ...dados,
});

const desenharTexto = (
  page: PDFPage,
  valor: string,
  x: number,
  y: number,
  tamanho: number,
  fonte: PDFFont,
  cor = preto,
) => {
  page.drawText(valor, { x, y, size: tamanho, font: fonte, color: cor });
};

const celula = (
  page: PDFPage,
  valor: string,
  posicao: { x: number; y: number },
  dimensoes: { largura: number; altura: number },
  fonte: PDFFont,
  tamanho = 7,
  alinhar: "centro" | "inicio" = "centro",
) => {
  const { x, y } = posicao;
  const { largura, altura } = dimensoes;
  page.drawRectangle({
    x,
    y: y - altura,
    width: largura,
    height: altura,
    borderColor: borda,
    borderWidth: 0.4,
  });
  const texto = valor.length > 42 ? `${valor.slice(0, 40)}...` : valor;
  const larguraTexto = fonte.widthOfTextAtSize(texto, tamanho);
  const textoX = alinhar === "inicio" ? x + 3 : x + Math.max(2, (largura - larguraTexto) / 2);
  desenharTexto(page, texto, textoX, y - altura + 4, tamanho, fonte);
};

export const criarBoletimPdfMock = async (resumo: ResumoBoletim) => {
  const documento = await PDFDocument.create();
  const regular = await documento.embedFont(StandardFonts.Helvetica);
  const negrito = await documento.embedFont(StandardFonts.HelveticaBold);
  const ano = resumo.anoLetivo || "2026";
  const turma = resumo.turma || "EF - 1A";
  const base = boletimMiguel(turma);
  const estudantes = [
    base,
    variar(base, {
      numero: "03",
      nome: "ALICE OLIVEIRA UGOLINI",
      eol: "6612044",
      frequenciaGlobal: "98.10%",
    }),
    variar(base, {
      numero: "11",
      nome: "ANA GABRIELA HOLANDA BENEVIDES",
      eol: "6841190",
      frequenciaGlobal: "96.22%",
    }),
  ];

  estudantes.forEach((estudante) => {
    const pagina = documento.addPage([595, 842]);
    let y = 810;

    desenharTexto(pagina, "CIDADE DE", 36, y, 8, negrito);
    desenharTexto(pagina, "SÃO PAULO", 36, y - 12, 11, negrito);
    desenharTexto(pagina, "EDUCAÇÃO", 36, y - 24, 8, negrito);

    const titulo = `BOLETIM ESCOLAR - ${ano}`;
    desenharTexto(pagina, titulo, 360, y, 9, negrito);
    desenharTexto(pagina, "SECRETARIA MUNICIPAL DE EDUCAÇÃO", 318, y - 12, 7, regular);
    desenharTexto(pagina, resumo.dre || "DIRETORIA REGIONAL DE EDUCAÇÃO", 300, y - 22, 7, regular);
    const ue = resumo.ue || "UNIDADE ESCOLAR";
    desenharTexto(pagina, ue.length > 52 ? `${ue.slice(0, 52)}...` : ue, 330, y - 32, 7, regular);

    y = 760;
    const info = [
      [`Estudante: ${estudante.numero} - ${estudante.nome}`, `Ciclo: ${estudante.ciclo}`, `Frequência Global: ${estudante.frequenciaGlobal}`],
      [`Código EOL: ${estudante.eol}`, `Turma: ${estudante.turma}`, ""],
    ];

    info.forEach((colunas, indice) => {
      const topo = y - indice * 16;
      pagina.drawRectangle({
        x: 28,
        y: topo - 16,
        width: 539,
        height: 16,
        borderColor: borda,
        borderWidth: 0.4,
      });
      desenharTexto(pagina, colunas[0], 32, topo - 11, 7, regular);
      desenharTexto(pagina, colunas[1], 280, topo - 11, 7, regular);
      if (colunas[2]) desenharTexto(pagina, colunas[2], 430, topo - 11, 7, regular);
    });

    y = 720;
    const larguraNome = 150;
    const larguraBimestre = 84;
    const larguraFinal = 53;
    const altura = 14;
    const x0 = 28;

    celula(pagina, "Componentes curriculares", { x: x0, y }, { largura: larguraNome, altura: altura * 2 }, negrito, 7, "inicio");
    ["1º Bim.", "2º Bim.", "3º Bim.", "4º Bim."].forEach((rotulo, indice) => {
      const x = x0 + larguraNome + indice * larguraBimestre;
      celula(pagina, rotulo, { x, y }, { largura: larguraBimestre, altura }, negrito, 6);
      celula(pagina, "Conc.", { x, y: y - altura }, { largura: larguraBimestre / 2, altura }, regular, 6);
      celula(pagina, "%", { x: x + larguraBimestre / 2, y: y - altura }, { largura: larguraBimestre / 2, altura }, regular, 6);
    });
    celula(pagina, "Final", { x: x0 + larguraNome + larguraBimestre * 4, y }, { largura: larguraFinal, altura: altura * 2 }, negrito, 7);

    y -= altura * 2;
    estudante.componentes.forEach((linha) => {
      celula(pagina, linha.nome, { x: x0, y }, { largura: larguraNome, altura }, regular, 7, "inicio");
      linha.bimestres.forEach((nota, indice) => {
        const x = x0 + larguraNome + indice * larguraBimestre;
        celula(pagina, nota.conceito || "-", { x, y }, { largura: larguraBimestre / 2, altura }, regular, 6);
        celula(pagina, nota.percentual || "-", { x: x + larguraBimestre / 2, y }, { largura: larguraBimestre / 2, altura }, regular, 6);
      });
      celula(pagina, linha.final, { x: x0 + larguraNome + larguraBimestre * 4, y }, { largura: larguraFinal, altura }, regular, 7);
      y -= altura;
    });

    estudante.areas.forEach((area) => {
      celula(pagina, area.nome, { x: x0, y }, { largura: larguraNome, altura }, regular, 6, "inicio");
      area.valores.forEach((valor, indice) => {
        celula(pagina, valor, { x: x0 + larguraNome + indice * larguraBimestre, y }, { largura: larguraBimestre, altura }, regular, 6);
      });
      celula(pagina, "-", { x: x0 + larguraNome + larguraBimestre * 4, y }, { largura: larguraFinal, altura }, regular, 7);
      y -= altura;
    });

    y -= 8;
    estudante.grupos.forEach((grupo) => {
      celula(pagina, grupo.nome, { x: x0, y }, { largura: 360, altura }, regular, 6, "inicio");
      celula(pagina, grupo.valores[0], { x: x0 + 360, y }, { largura: 89, altura }, regular, 6);
      celula(pagina, grupo.valores[1], { x: x0 + 449, y }, { largura: 90, altura }, regular, 6);
      y -= altura;
    });

    y -= 16;
    desenharTexto(
      pagina,
      "Legenda: F:Frequente  -  NF:Não Frequente  -  P:Plenamente Satisfatório  -  S:Satisfatório  -  NS:Não Satisfatório",
      28,
      y,
      6.5,
      regular,
      cinza,
    );

    y -= 18;
    pagina.drawRectangle({
      x: 28,
      y: y - 92,
      width: 539,
      height: 92,
      borderColor: borda,
      borderWidth: 0.4,
    });
    desenharTexto(pagina, "Recomendações ao estudante", 32, y - 12, 8, negrito);
    const palavras = estudante.recomendacoes.split(" ");
    let linha = "";
    let linhaY = y - 26;
    palavras.forEach((palavra) => {
      const candidata = linha ? `${linha} ${palavra}` : palavra;
      if (regular.widthOfTextAtSize(candidata, 7) > 520) {
        desenharTexto(pagina, linha, 32, linhaY, 7, regular);
        linha = palavra;
        linhaY -= 9;
      } else {
        linha = candidata;
      }
    });
    if (linha) desenharTexto(pagina, linha, 32, linhaY, 7, regular);
  });

  return documento.save();
};

export const nomeArquivoBoletim = (anoLetivo?: string) =>
  `boletim-escolar-${anoLetivo || "2026"}.pdf`;
