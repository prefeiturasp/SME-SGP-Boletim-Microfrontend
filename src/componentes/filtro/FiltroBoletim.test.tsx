import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { exibirErrosApi } from "../../core/config/alertas";
import {
  listarAnosLetivos,
  listarDres,
  listarModalidades,
  listarSemestres,
  listarTurmas,
  listarUes,
} from "../../services/filtroBoletimService";
import FiltroBoletim from "./FiltroBoletim";

vi.mock("../../services/filtroBoletimService", () => ({
  listarAnosLetivos: vi.fn(),
  listarDres: vi.fn(),
  listarModalidades: vi.fn(),
  listarSemestres: vi.fn(),
  listarTurmas: vi.fn(),
  listarUes: vi.fn(),
}));

vi.mock("../../core/config/alertas", () => ({
  exibirErrosApi: vi.fn(),
}));

vi.mock("../ui/SelectCampo", () => ({
  default: ({
    id,
    label,
    opcoes,
    valor,
    onChange,
    disabled,
  }: {
    id: string;
    label: string;
    opcoes: { valor: string; texto: string }[];
    valor?: string;
    onChange: (value: string) => void;
    disabled?: boolean;
  }) => (
    <label htmlFor={id}>
      {label}
      <select
        id={id}
        aria-label={label}
        value={valor || ""}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Selecione</option>
        {opcoes.map((opcao) => (
          <option key={opcao.valor} value={opcao.valor}>
            {opcao.texto}
          </option>
        ))}
      </select>
    </label>
  ),
}));

vi.mock("antd", () => ({
  Checkbox: ({
    id,
    checked,
    onChange,
    children,
  }: {
    id: string;
    checked: boolean;
    onChange: (event: { target: { checked: boolean } }) => void;
    children: React.ReactNode;
  }) => (
    <label htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange({ target: { checked: event.target.checked } })}
      />
      {children}
    </label>
  ),
  Radio: {
    Group: ({
      id,
      value,
      onChange,
      disabled,
    }: {
      id: string;
      value: boolean;
      onChange: (event: { target: { value: boolean } }) => void;
      disabled: boolean;
    }) => (
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => onChange({ target: { value: !value } })}
      >
        Alterar inativos
      </button>
    ),
  },
}));

const prepararRespostas = () => {
  vi.mocked(listarAnosLetivos).mockResolvedValue([
    { desc: "2026", valor: "2026" },
  ]);
  vi.mocked(listarDres).mockResolvedValue([
    { desc: "DRE", valor: "1", abrev: undefined, id: undefined },
  ]);
  vi.mocked(listarUes).mockResolvedValue([
    { desc: "UE", valor: "2", id: undefined },
  ]);
  vi.mocked(listarModalidades).mockResolvedValue([
    { desc: "Medio", valor: "6" },
  ]);
  vi.mocked(listarSemestres).mockResolvedValue([]);
  vi.mocked(listarTurmas).mockResolvedValue([
    { nome: "1A", codigo: "3", nomeFiltro: "1A" },
  ]);
};

describe("FiltroBoletim", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prepararRespostas();
  });

  it("carrega os filtros encadeados e comunica o formulario", async () => {
    const onFiltrar = vi.fn();
    const setFiltrou = vi.fn();
    const setModoEdicao = vi.fn();

    render(
      <FiltroBoletim
        onFiltrar={onFiltrar}
        filtrou={false}
        setFiltrou={setFiltrou}
        setModoEdicao={setModoEdicao}
        cancelou={false}
        setCancelou={vi.fn()}
      />,
    );

    await waitFor(() => expect(listarTurmas).toHaveBeenCalled());
    await waitFor(() =>
      expect(onFiltrar).toHaveBeenCalledWith(
        expect.objectContaining({
          anoLetivo: "2026",
          dreCodigo: "1",
          ueCodigo: "2",
          modalidadeId: "6",
          turmasId: "3",
        }),
      ),
    );

    fireEvent.change(document.querySelector("#SGP_SELECT_MODELO_BOLETIM")!, {
      target: { value: "2" },
    });
    expect(setModoEdicao).toHaveBeenCalledWith(true);

    fireEvent.click(document.querySelector("#SGP_CHECKBOX_EXIBIR_HISTORICO")!);
    expect(setFiltrou).toHaveBeenCalledWith(false);
  });

  it("permite selecionar todos os agrupamentos de turma", async () => {
    vi.mocked(listarTurmas).mockResolvedValue([
      { nome: "1A", codigo: "3", nomeFiltro: "1A" },
      { nome: "1B", codigo: "4", nomeFiltro: "1B" },
    ]);

    render(
      <FiltroBoletim
        onFiltrar={vi.fn()}
        filtrou={false}
        setFiltrou={vi.fn()}
        setModoEdicao={vi.fn()}
        cancelou={false}
        setCancelou={vi.fn()}
      />,
    );

    await waitFor(() =>
      expect((screen.getByLabelText("Turma") as HTMLSelectElement).disabled).toBe(
        false,
      ),
    );
    fireEvent.change(screen.getByLabelText("Turma"), {
      target: { value: "-99" },
    });
    expect(
      (screen.getByLabelText("Estudante(s)") as HTMLSelectElement).disabled,
    ).toBe(true);
  });

  it("exibe falhas ao carregar filtros dependentes", async () => {
    const error = new Error("falha");
    vi.mocked(listarDres).mockRejectedValue(error);

    render(
      <FiltroBoletim
        onFiltrar={vi.fn()}
        filtrou={false}
        setFiltrou={vi.fn()}
        setModoEdicao={vi.fn()}
        cancelou={false}
        setCancelou={vi.fn()}
      />,
    );

    await waitFor(() => expect(exibirErrosApi).toHaveBeenCalledWith(error));
  });
});
