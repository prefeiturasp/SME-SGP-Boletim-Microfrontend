import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import VisualizacaoBoletim from "./VisualizacaoBoletim";

describe("VisualizacaoBoletim", () => {
  it("exibe o resumo e incorpora o PDF", () => {
    render(
      <VisualizacaoBoletim
        resumo={{
          exibirHistorico: "Nao",
          anoLetivo: "2026",
          dre: "DRE Teste",
          ue: "UE Teste",
          modalidade: "Fundamental",
          turma: "1A",
          estudantes: "Todos",
          boletinsPorPagina: "2",
          imprimirInativos: "Nao",
        }}
        pdfUrl="blob:boletim"
        nomeArquivo="boletim.pdf"
      />,
    );

    expect(screen.getByText("DRE Teste")).toBeTruthy();
    expect(screen.getByTitle("boletim.pdf").getAttribute("src")).toBe(
      "blob:boletim",
    );
  });

  it("exibe marcador quando um valor do resumo esta vazio", () => {
    render(
      <VisualizacaoBoletim
        resumo={{
          exibirHistorico: "",
          anoLetivo: "",
          dre: "",
          ue: "",
          modalidade: "",
          turma: "",
          estudantes: "",
          boletinsPorPagina: "",
          imprimirInativos: "",
        }}
        pdfUrl="blob:boletim"
        nomeArquivo="boletim.pdf"
      />,
    );

    expect(screen.getAllByText("-")).toHaveLength(9);
  });
});
