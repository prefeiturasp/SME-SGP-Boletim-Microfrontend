import { describe, expect, it } from "vitest";
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
} from "./layoutBoletim";

describe("layoutBoletim", () => {
  it("reproduz as alturas e o intervalo dos layouts do backend", () => {
    expect(configuracoesLayout[1].altura).toBeCloseTo(788.03, 1);
    expect(configuracoesLayout[2].altura).toBeCloseTo(365.67, 1);
    expect(configuracoesLayout[2].espacamentoVertical).toBe(36);
    expect(configuracoesLayout[6].altura).toBeCloseTo(255.12, 1);
    expect(configuracoesLayout[1].alturaLinha).toBeCloseTo(14.12, 2);
    expect(configuracoesLayout[1].alturaCabecalho).toBeCloseTo(60.75, 2);
    expect(configuracoesLayout[1].recuoCelula).toBe(7.5);
    expect(configuracoesLayout[2].logoAltura).toBeCloseTo(
      configuracoesLayout[1].logoAltura * 0.8,
    );
    expect(configuracoesLayout[2].tamanhoTexto).toBeCloseTo(
      configuracoesLayout[1].tamanhoTexto * 0.8,
    );
    expect(configuracoesLayout[2].alturaLinha).toBeCloseTo(
      configuracoesLayout[1].alturaLinha * 0.8,
      1,
    );
  });

  it("posiciona seis boletins em duas colunas e tres linhas", () => {
    const areas = calcularAreasBoletins(6, 6, 595.28, 14.17);

    expect(areas).toHaveLength(6);
    expect(areas[1].x).toBeCloseTo(297.64, 1);
    expect(areas[2].x).toBeCloseTo(14.17, 1);
    expect(areas[2].topo).toBeGreaterThan(areas[0].topo + areas[0].altura);
  });

  it("mantem todas as palavras ao quebrar textos extensos", () => {
    expect(
      quebrarTexto("uma recomendacao extensa para o estudante", (linha) =>
        linha.length <= 18,
      ),
    ).toEqual(["uma recomendacao", "extensa para o", "estudante"]);
  });

  it("corrige texto UTF-8 interpretado como Windows-1252 sem alterar acentos validos", () => {
    expect(corrigirMojibakeUtf8("CÃ³digo e EducaÃ§Ã£o")).toBe(
      "Código e Educação",
    );
    expect(corrigirMojibakeUtf8("EDUCAÃ‡ÃƒO")).toBe("EDUCAÇÃO");
    expect(corrigirMojibakeUtf8("JOÃO e Alfabetização")).toBe(
      "JOÃO e Alfabetização",
    );
  });

  it("usa o total fisico de paginas sem reiniciar a cada vinte paginas", () => {
    expect(formatarPaginacao(0, 22)).toBe("1 / 22");
    expect(formatarPaginacao(19, 22)).toBe("20 / 22");
    expect(formatarPaginacao(20, 22)).toBe("21 / 22");
    expect(formatarPaginacao(21, 22)).toBe("22 / 22");
  });

  it("permite que o boletim unico use toda a area util da pagina", () => {
    expect(calcularLimiteVertical(1, 14.17, 788.03, 841.89, 14.17)).toBeCloseTo(
      827.72,
      2,
    );
    expect(calcularLimiteVertical(2, 14.17, 365.67, 841.89, 14.17)).toBeCloseTo(
      379.84,
      2,
    );
  });

  it("inclui o periodo final no boletim simples anual e semestral", () => {
    expect(periodosBoletimSimples([1, 2, 3, 4])).toEqual([1, 2, 3, 4, 0]);
    expect(periodosBoletimSimples([1, 2])).toEqual([1, 2, 0]);
  });

  it("reserva altura suficiente para textos e bordas do boletim simples", () => {
    expect(configuracaoBoletimSimples.alturaLinhaCabecalho).toBeGreaterThan(
      5.25 + 2,
    );
    expect(configuracaoBoletimSimples.alturaLinhaTabela).toBeGreaterThan(
      4.5 + 2,
    );
  });

  it("reduz o texto de celulas estreitas antes de aplicar reticencias", () => {
    expect(ajustarTamanhoTexto(4.5, (tamanho) => tamanho <= 4.1)).toBeCloseTo(
      4.1,
      5,
    );
    expect(ajustarTamanhoTexto(4.5, () => true)).toBe(4.5);
  });

  it("reduz preventivamente percentuais de tres algarismos", () => {
    expect(tamanhoTextoPercentual(4.5, "100.00%")).toBeCloseTo(3.825, 5);
    expect(tamanhoTextoPercentual(4.5, "99.99%")).toBe(4.5);
    expect(tamanhoTextoPercentual(4.5, "S")).toBe(4.5);
  });

});
