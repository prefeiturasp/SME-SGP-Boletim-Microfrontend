import { describe, expect, it } from "vitest";
import { criarBoletimPdfMock, nomeArquivoBoletim } from "./boletimPdf";

describe("boletimPdf", () => {
  it("gera um documento PDF valido", async () => {
    const bytes = await criarBoletimPdfMock({
      exibirHistorico: "Nao",
      anoLetivo: "2026",
      dre: "DRE",
      ue: "UE",
      modalidade: "Fundamental",
      turma: "1A",
      estudantes: "Todos",
      boletinsPorPagina: "1",
      imprimirInativos: "Nao",
    });

    expect(new TextDecoder().decode(bytes.slice(0, 4))).toBe("%PDF");
  });

  it("usa o ano letivo no nome do arquivo", () => {
    expect(nomeArquivoBoletim("2027")).toBe("boletim-escolar-2027.pdf");
  });
});
