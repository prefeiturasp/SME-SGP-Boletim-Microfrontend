import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import VisualizacaoBoletim from "./VisualizacaoBoletim";

const resumoBase = {
  anoLetivo: "2026",
  dre: "DRE Teste",
  ue: "UE Teste",
  modalidade: "Fundamental",
  turma: "1A",
  estudantes: "Todos",
  boletinsPorPagina: "2",
  imprimirInativos: "Nao",
};

describe("VisualizacaoBoletim", () => {
  it("exibe os filtros selecionados ao lado da consolidacao e incorpora o PDF", async () => {
    const usuario = userEvent.setup();
    render(
      <VisualizacaoBoletim
        resumo={resumoBase}
        pdfUrl="blob:boletim"
        nomeArquivo="boletim.pdf"
        dataConsolidacao="30/09/2026 - 08:45"
      />,
    );

    const linhas = document.querySelectorAll(".boletim-resumo-linha");
    expect(screen.getByRole("heading", { name: "Filtros selecionados:" })).toBeTruthy();
    expect(screen.queryByText("Exibir histórico:")).toBeNull();
    expect(screen.queryByText("Estudantes:")).toBeNull();
    expect(linhas[0].textContent).toContain("Ano letivo:");
    expect(linhas[0].textContent).toContain("2026");
    expect(linhas[0].textContent).toContain("DRE:");
    expect(linhas[0].textContent).toContain("DRE Teste");
    expect(linhas[0].textContent).toContain("UE:");
    expect(linhas[0].textContent?.indexOf("Ano letivo:")).toBeLessThan(
      linhas[0].textContent?.indexOf("DRE:") ?? 0,
    );
    expect(linhas[1].textContent).toContain("Modalidade:");
    expect(linhas[1].textContent).toContain("Turma:");
    expect(linhas[1].textContent).not.toContain("Semestre:");
    expect(linhas[2].textContent).toContain("Boletins por página:");
    expect(linhas[2].textContent).toContain("Imprimir estudantes inativos:");
    expect(screen.getByText("Dados consolidados em: 30/09/2026 - 08:45")).toBeTruthy();
    expect(screen.getByTitle("boletim.pdf").getAttribute("src")).toBe("blob:boletim");

    await usuario.hover(
      screen.getByRole("button", {
        name: "Informações sobre a atualização dos dados do boletim",
      }),
    );
    expect(
      await screen.findByText(
        "Os dados do boletim são atualizados na sincronização da manhã. Lançamentos realizados hoje serão atualizados e exibidos no boletim amanhã.",
      ),
    ).toBeTruthy();
  });

  it("exibe marcador quando um valor do resumo esta vazio", () => {
    render(
      <VisualizacaoBoletim
        resumo={{
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

    expect(screen.getAllByText("-")).toHaveLength(7);
    expect(screen.getByText("Dados consolidados em: -")).toBeTruthy();
  });

  it("exibe o semestre quando a modalidade selecionada o exige", () => {
    render(
      <VisualizacaoBoletim
        resumo={{
          ...resumoBase,
          modalidade: "EJA",
          semestre: "1",
        }}
        pdfUrl="blob:boletim"
        nomeArquivo="boletim.pdf"
      />,
    );

    const linha = document.querySelectorAll(".boletim-resumo-linha")[1];
    expect(linha.textContent).toContain("Modalidade:");
    expect(linha.textContent).toContain("Semestre:");
    expect(linha.textContent).toContain("1º semestre");
    expect(linha.textContent).toContain("Turma:");
    expect(linha.textContent?.indexOf("Modalidade:")).toBeLessThan(
      linha.textContent?.indexOf("Semestre:") ?? 0,
    );
    expect(linha.textContent?.indexOf("Semestre:")).toBeLessThan(
      linha.textContent?.indexOf("Turma:") ?? 0,
    );
  });
});
