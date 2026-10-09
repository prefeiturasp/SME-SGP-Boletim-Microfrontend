import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSgp, postSgp } from "../core/servico/apiSgp";
import {
  buscarAlunos,
  imprimirBoletim,
  type DadosFiltroBoletim,
} from "./boletimService";

vi.mock("../core/servico/apiSgp", () => ({
  getSgp: vi.fn(),
  postSgp: vi.fn(),
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
});
