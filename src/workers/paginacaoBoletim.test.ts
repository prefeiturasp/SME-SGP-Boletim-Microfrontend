import { describe, expect, it } from "vitest";
import type { BoletimImpressao, ComponenteImpressao } from "../types/boletimImpressao";
import { paginarBoletimExtenso } from "./paginacaoBoletim";

const componente = (indice: number): ComponenteImpressao => ({
  nome: `Componente ${indice}`,
  periodos: [],
  eh_regencia: false,
});

const criarBoletim = (quantidade: number): BoletimImpressao => ({
  dados: {
    ano_letivo: 2026,
    dre_nome: "DRE",
    ue_nome: "UE",
    aluno_codigo: 1,
    turma_relatorio: "1A",
    ciclo: "Ciclo",
  },
  nome_aluno: "Estudante",
  periodos: [1, 2, 3, 4],
  usa_conceito: false,
  exibe_legenda: true,
  grupos: [{ componentes: Array.from({ length: quantidade }, (_, indice) => componente(indice)) }],
  frequencia_global: "100%",
  parecer_conclusivo: "Parecer",
  recomendacoes_aluno: "Aluno",
  recomendacoes_familia: "Familia",
  exibe_recomendacoes: true,
});

describe("paginarBoletimExtenso", () => {
  it("mantem boletim curto em uma pagina", () => {
    expect(paginarBoletimExtenso(criarBoletim(10))).toHaveLength(1);
  });

  it("continua componentes sem omitir dados e deixa complementos na ultima pagina", () => {
    const paginas = paginarBoletimExtenso(criarBoletim(60));

    expect(paginas.length).toBeGreaterThanOrEqual(2);
    expect(
      paginas.flatMap((pagina) => pagina.grupos.flatMap((grupo) => grupo.componentes)),
    ).toHaveLength(60);
    expect(paginas[0].exibe_recomendacoes).toBe(false);
    expect(paginas[0].parecer_conclusivo).toBe("");
    expect(paginas.at(-1)?.exibe_recomendacoes).toBe(true);
  });

  it("move recomendacoes extensas para continuacoes sem perder texto", () => {
    const boletim = criarBoletim(20);
    boletim.recomendacoes_aluno = Array.from({ length: 1_200 }, () => "texto").join(" ");
    const paginas = paginarBoletimExtenso(boletim);

    expect(paginas.length).toBeGreaterThan(1);
    expect(paginas[0].exibe_recomendacoes).toBe(true);
    expect(paginas.at(-1)?.exibe_recomendacoes).toBe(true);
    expect(
      paginas
        .map((pagina) => pagina.recomendacoes_aluno)
        .filter(Boolean)
        .join(""),
    ).toBe(boletim.recomendacoes_aluno);
  });

  it("move parecer extenso quando nao resta espaco na pagina", () => {
    const boletim = criarBoletim(54);
    boletim.parecer_conclusivo = "Parecer ".repeat(300);

    const paginas = paginarBoletimExtenso(boletim);

    expect(paginas.length).toBeGreaterThan(1);
    expect(paginas.at(-1)?.parecer_conclusivo).toBe(
      boletim.parecer_conclusivo,
    );
  });
});
