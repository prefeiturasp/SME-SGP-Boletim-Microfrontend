import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { exibirErrosApi } from "../../core/config/alertas";
import { buscarAlunos, type DadosFiltroBoletim } from "../../services/boletimService";
import ListaAlunos from "./ListaAlunos";

vi.mock("../../services/boletimService", () => ({
  buscarAlunos: vi.fn(),
}));

vi.mock("../../core/config/alertas", () => ({
  exibirErrosApi: vi.fn(),
}));

vi.mock("antd", () => ({
  Table: ({
    dataSource,
    rowSelection,
  }: {
    dataSource: { codigo: string | number; nome: string }[];
    rowSelection: { onChange: (keys: Array<string | number>) => void };
  }) => (
    <div>
      {dataSource.map((item) => (
        <span key={item.codigo}>{item.nome}</span>
      ))}
      <button type="button" onClick={() => rowSelection.onChange([10, "20"])}>
        Selecionar
      </button>
    </div>
  ),
}));

const filtro: DadosFiltroBoletim = {
  anoLetivo: "2026",
  modalidade: "5",
  dreCodigo: "1",
  ueCodigo: "2",
  turmaCodigo: "3",
  semestre: 0,
  consideraHistorico: false,
  opcaoEstudanteId: "1",
  quantidadeBoletimPorPagina: "2",
  filtroEhValido: true,
};

describe("ListaAlunos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("carrega e seleciona estudantes", async () => {
    vi.mocked(buscarAlunos).mockResolvedValue([
      { codigo: 10, numeroChamada: 1, nome: "Estudante" },
    ]);
    const onSelecionar = vi.fn();

    render(<ListaAlunos filtro={filtro} onSelecionar={onSelecionar} />);

    expect(await screen.findByText("Estudante")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Selecionar" }));
    expect(onSelecionar).toHaveBeenLastCalledWith(["10", "20"]);
  });

  it("limpa a lista e exibe o erro da API", async () => {
    const error = new Error("falha");
    vi.mocked(buscarAlunos).mockRejectedValue(error);

    render(<ListaAlunos filtro={filtro} onSelecionar={vi.fn()} />);

    await waitFor(() => expect(exibirErrosApi).toHaveBeenCalledWith(error));
  });

  it("nao consulta quando o filtro e invalido", () => {
    render(
      <ListaAlunos
        filtro={{ ...filtro, filtroEhValido: false }}
        onSelecionar={vi.fn()}
      />,
    );

    expect(buscarAlunos).not.toHaveBeenCalled();
  });
});
