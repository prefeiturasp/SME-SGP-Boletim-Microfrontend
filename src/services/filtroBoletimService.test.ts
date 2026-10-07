import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSgp } from "../core/servico/apiSgp";
import {
  listarAnosLetivos,
  listarDres,
  listarTurmas,
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
});
