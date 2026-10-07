import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSgp } from "../core/servico/apiSgp";
import {
  listarAnosLetivos,
  listarDres,
  listarModalidades,
  listarSemestres,
  listarTurmas,
  listarUes,
} from "./filtroBoletimService";

vi.mock("../core/servico/apiSgp", () => ({
  getSgp: vi.fn(),
}));

describe("filtroBoletimService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("converte anos letivos em opcoes textuais", async () => {
    vi.mocked(getSgp).mockResolvedValue({ data: [2026, "2025"] } as never);

    await expect(listarAnosLetivos(false)).resolves.toEqual([
      { desc: "2026", valor: "2026" },
      { desc: "2025", valor: "2025" },
    ]);
  });

  it("ordena as DREs pelo nome", async () => {
    vi.mocked(getSgp).mockResolvedValue({
      data: [
        { nome: "DRE Z", codigo: 2 },
        { nome: "DRE A", codigo: 1, abreviacao: "A" },
      ],
    } as never);

    await expect(listarDres(false, "2026")).resolves.toEqual([
      { desc: "DRE A", valor: "1", abrev: "A", id: undefined },
      { desc: "DRE Z", valor: "2", abrev: undefined, id: undefined },
    ]);
  });

  it("converte unidades escolares em opcoes", async () => {
    vi.mocked(getSgp).mockResolvedValue({
      data: [{ nome: "EMEF Teste", codigo: 123, id: 10 }],
    } as never);

    await expect(listarUes(false, "1", "2026")).resolves.toEqual([
      { desc: "EMEF Teste", valor: "123", id: 10 },
    ]);
  });

  it("consulta modalidades atuais sem parametros historicos", async () => {
    vi.mocked(getSgp).mockResolvedValue({
      data: [{ descricao: "Fundamental", valor: 5 }],
    } as never);

    await expect(listarModalidades("123", false, "2026")).resolves.toEqual([
      { desc: "Fundamental", valor: "5" },
    ]);
    expect(getSgp).toHaveBeenCalledWith(
      "v1/relatorios/filtros/ues/123/modalidades/abrangencias?consideraNovasModalidades=false",
    );
  });

  it("inclui ano e historico ao consultar modalidades anteriores", async () => {
    vi.mocked(getSgp).mockResolvedValue({ data: [] } as never);

    await listarModalidades("123", true, "2025");

    expect(getSgp).toHaveBeenCalledWith(
      "v1/relatorios/filtros/ues/123/modalidades/abrangencias?consideraNovasModalidades=false&consideraHistorico=true&anoLetivo=2025",
    );
  });

  it("converte os semestres retornados pela API", async () => {
    vi.mocked(getSgp).mockResolvedValue({ data: [1, "2"] } as never);

    await expect(
      listarSemestres(false, "2026", "5", "1", "123"),
    ).resolves.toEqual([
      { desc: "1", valor: "1" },
      { desc: "2", valor: "2" },
    ]);
    expect(getSgp).toHaveBeenCalledWith("v1/abrangencias/false/semestres", {
      params: {
        anoLetivo: "2026",
        modalidade: "5",
        dreCodigo: "1",
        ueCodigo: "123",
      },
    });
  });

  it("envia modalidade, periodo e ano ao consultar turmas", async () => {
    vi.mocked(getSgp).mockResolvedValue({ data: [] } as never);

    await listarTurmas({
      consideraHistorico: true,
      ueCodigo: "123",
      modalidadeId: "5",
      semestre: "2",
      anoLetivo: "2026",
    });

    expect(getSgp).toHaveBeenCalledWith(
      "v1/abrangencias/true/dres/ues/123/turmas-regulares?consideraNovosAnosInfantil=true&anoLetivo=2026",
      { params: { modalidade: "5", periodo: "2" } },
    );
  });

  it("omite parametros opcionais vazios ao consultar turmas", async () => {
    const turmas = [{ nome: "1A", codigo: 10 }];
    vi.mocked(getSgp).mockResolvedValue({ data: turmas } as never);

    await expect(
      listarTurmas({
        consideraHistorico: false,
        ueCodigo: "123",
        modalidadeId: "",
        anoLetivo: "",
      }),
    ).resolves.toEqual(turmas);
    expect(getSgp).toHaveBeenCalledWith(
      "v1/abrangencias/false/dres/ues/123/turmas-regulares?consideraNovosAnosInfantil=true",
      { params: {} },
    );
  });
});
