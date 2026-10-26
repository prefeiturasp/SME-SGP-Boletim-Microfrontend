import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getBoletim } from "../core/servico/apiBoletim";
import { getSgp, postSgp } from "../core/servico/apiSgp";
import { getBoletimApiUrl } from "../config";
import {
  buscarAlunos,
  formatarDataConsolidacao,
  gerarPdfBoletim,
  imprimirBoletim,
  montarParametrosPdf,
  obterUltimaAtualizacao,
  type DadosFiltroBoletim,
} from "./boletimService";

vi.mock("../core/servico/apiSgp", () => ({
  getSgp: vi.fn(),
  postSgp: vi.fn(),
}));

vi.mock("../core/servico/apiBoletim", () => ({
  getBoletim: vi.fn(),
}));

vi.mock("../config", () => ({
  getBoletimApiUrl: vi.fn(() => "https://boletim.exemplo"),
}));

const filtro: DadosFiltroBoletim = {
  anoLetivo: "2026",
  modalidade: "5",
  dreCodigo: "1",
  ueCodigo: "2",
  turmaCodigo: "3",
  semestre: 1,
  consideraHistorico: false,
  opcaoEstudanteId: "1",
  quantidadeBoletimPorPagina: "2",
  filtroEhValido: true,
};

describe("boletimService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna os alunos recebidos da API", async () => {
    const alunos = [{ codigo: "10", numeroChamada: 1, nome: "Estudante" }];
    vi.mocked(getSgp).mockResolvedValue({ data: { items: alunos } } as never);

    await expect(buscarAlunos(filtro)).resolves.toEqual(alunos);
    expect(getSgp).toHaveBeenCalledWith(
      "v1/boletim/alunos?numeroPagina=1&numeroRegistros=10",
      { params: filtro },
    );
  });

  it("retorna uma lista vazia quando a API nao envia alunos", async () => {
    vi.mocked(getSgp).mockResolvedValue({ data: {} } as never);

    await expect(buscarAlunos(filtro)).resolves.toEqual([]);
  });

  it("retorna a resposta da solicitacao de impressao", async () => {
    const dados = { ...filtro, alunosCodigo: ["10"] };
    const resposta = { data: { id: "arquivo" } };
    vi.mocked(postSgp).mockResolvedValue(resposta as never);

    await expect(imprimirBoletim(dados)).resolves.toBe(resposta);
    expect(postSgp).toHaveBeenCalledWith("v1/boletim/imprimir", dados);
  });

  it("retorna vazio quando a impressao nao produz dados", async () => {
    vi.mocked(postSgp).mockResolvedValue({ data: undefined } as never);

    await expect(
      imprimirBoletim({ ...filtro, alunosCodigo: [] }),
    ).resolves.toEqual({});
  });

  it("sinaliza erro quando a impressao falha", async () => {
    vi.mocked(postSgp).mockRejectedValue(new Error("falha"));

    await expect(
      imprimirBoletim({ ...filtro, alunosCodigo: [] }),
    ).resolves.toEqual({ erro: true });
  });

  it("monta a consulta do PDF com os filtros e os alunos selecionados", () => {
    expect(
      montarParametrosPdf(
        { ...filtro, turmaCodigo: "-99", consideraInativo: true },
        ["10", "0", "abc"],
      ),
    ).toEqual({
      ano_letivo: 2026,
      dre_codigo: "1",
      ue_codigo: "2",
      modalidade: 5,
      semestre: 1,
      considera_inativo: true,
      boletins_por_pagina: 2,
      alunos_codigo: [10],
    });
  });

  it("omite a turma quando a opcao e todas e nao envia alunos na opcao todos", () => {
    expect(
      montarParametrosPdf({ ...filtro, opcaoEstudanteId: "0", turmaCodigo: "-99" }, ["10"]),
    ).not.toHaveProperty("turma_codigo");
    expect(
      montarParametrosPdf({ ...filtro, opcaoEstudanteId: "0" }, ["10"]),
    ).not.toHaveProperty("alunos_codigo");
  });

  it("retorna o PDF gerado pela API", async () => {
    const arquivo = new Blob(["pdf"], { type: "application/pdf" });
    vi.mocked(getBoletim).mockResolvedValue({
      status: 200,
      data: arquivo,
      headers: {
        "content-type": "application/pdf",
        "content-disposition": "attachment; filename=\"boletim-turma.pdf\"",
      },
    } as never);

    await expect(gerarPdfBoletim(filtro, [])).resolves.toEqual({
      arquivo,
      nomeArquivo: "boletim-turma.pdf",
    });
    expect(getBoletim).toHaveBeenCalledWith(
      "api/boletim/pdf/",
      expect.objectContaining({
        responseType: "blob",
        params: expect.objectContaining({ ano_letivo: 2026, turma_codigo: "3" }),
      }),
    );
  });

  it("usa a mensagem do cabecalho quando nao ha alunos", async () => {
    vi.mocked(getBoletim).mockResolvedValue({
      status: 204,
      data: new Blob(),
      headers: { "x-mensagem": "Nenhum aluno encontrado para o filtro." },
    } as never);

    await expect(gerarPdfBoletim(filtro, [])).resolves.toEqual({
      erro: true,
      mensagem: "Nenhum aluno encontrado para o filtro.",
    });
  });

  it("le a mensagem de erro retornada pela API", async () => {
    const falha = new axios.AxiosError("erro");
    falha.response = {
      data: new Blob([JSON.stringify({ mensagens: ["Filtro invalido"] })]),
      status: 400,
      statusText: "Bad Request",
      headers: {},
      config: {} as never,
    };
    vi.mocked(getBoletim).mockRejectedValue(falha);

    await expect(gerarPdfBoletim(filtro, [])).resolves.toEqual({
      erro: true,
      mensagem: "Filtro invalido",
    });
  });

  it("formata a data da ultima consolidacao no horario de Sao Paulo", () => {
    expect(formatarDataConsolidacao("2026-09-30T11:45:00Z")).toBe(
      "30/09/2026 - 08:45",
    );
    expect(formatarDataConsolidacao("2026-09-30T08:45:00")).toBe(
      "30/09/2026 - 08:45",
    );
    expect(formatarDataConsolidacao("2026-09-30T08:45:00.123456-03:00")).toBe(
      "30/09/2026 - 08:45",
    );
    expect(formatarDataConsolidacao(null)).toBe("");
    expect(formatarDataConsolidacao("sem data")).toBe("");
  });

  it("consulta a ultima atualizacao no recorte do boletim", async () => {
    vi.mocked(getBoletim).mockResolvedValue({
      data: { ultimaAtualizacao: "2026-09-30T11:45:00Z" },
    } as never);

    await expect(obterUltimaAtualizacao(filtro, ["10"])).resolves.toBe(
      "30/09/2026 - 08:45",
    );
    expect(getBoletim).toHaveBeenCalledWith(
      "api/boletim/ultima-atualizacao/",
      expect.objectContaining({
        headers: { Accept: "application/json" },
        params: expect.objectContaining({
          ano_letivo: 2026,
          turma_codigo: "3",
          alunos_codigo: [10],
        }),
      }),
    );
  });

  it("retorna vazio quando a ultima atualizacao nao pode ser consultada", async () => {
    vi.mocked(getBoletimApiUrl).mockReturnValueOnce("");
    await expect(obterUltimaAtualizacao(filtro, [])).resolves.toBe("");
    expect(getBoletim).not.toHaveBeenCalled();

    vi.mocked(getBoletim).mockRejectedValueOnce(new Error("falha"));
    await expect(obterUltimaAtualizacao(filtro, [])).resolves.toBe("");

    vi.mocked(getBoletim).mockResolvedValueOnce({
      data: { ultimaAtualizacao: null },
    } as never);
    await expect(obterUltimaAtualizacao(filtro, [])).resolves.toBe("");
  });

  it("avisa quando a URL da API de boletim nao foi configurada", async () => {
    vi.mocked(getBoletimApiUrl).mockReturnValueOnce("");

    await expect(gerarPdfBoletim(filtro, [])).resolves.toEqual({
      erro: true,
      mensagem: "A URL da API de boletim não foi configurada.",
    });
    expect(getBoletim).not.toHaveBeenCalled();
  });
});
