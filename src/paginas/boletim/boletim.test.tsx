import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { confirmar } from "../../core/config/alertas";
import { criarBoletimPdfMock } from "../../mocks/boletimPdf";
import Boletim from "./boletim";

const navegar = vi.fn();

vi.mock("react-redux", () => ({
  useSelector: (selector: (state: unknown) => unknown) =>
    selector({
      usuario: {
        token: "token",
        listaUrlAjudaDoSistema: [
          { rota: "/boletim", url: "https://ajuda.exemplo" },
        ],
      },
      navegacao: { rotaAtiva: "/boletim" },
    }),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => navegar,
}));

vi.mock("@fortawesome/react-fontawesome", () => ({
  FontAwesomeIcon: () => <span>icone</span>,
}));

vi.mock("antd", () => ({
  Alert: ({ message }: { message: string }) => <div>{message}</div>,
}));

vi.mock("../../core/config/antd-app-provider", () => ({
  AntdAppProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("../../core/config/alertas", () => ({
  confirmar: vi.fn(),
}));

vi.mock("../../mocks/boletimPdf", () => ({
  criarBoletimPdfMock: vi.fn(),
  nomeArquivoBoletim: (ano?: string) => `boletim-${ano || "2026"}.pdf`,
}));

vi.mock("../../componentes/filtro/FiltroBoletim", () => ({
  default: ({
    onFiltrar,
    setModoEdicao,
  }: {
    onFiltrar: (values: Record<string, unknown>) => void;
    setModoEdicao: (value: boolean) => void;
  }) => (
    <div>
      <button
        type="button"
        onClick={() =>
          onFiltrar({
            consideraHistorico: false,
            anoLetivo: "2026",
            dreCodigo: "1",
            ueCodigo: "2",
            modalidadeId: "6",
            turmasId: "3",
            opcaoEstudanteId: "0",
            quantidadeBoletimPorPagina: "2",
            dreNome: "DRE",
            ueNome: "UE",
            modalidadeNome: "Medio",
            turmaNome: "1A",
            imprimirEstudantesInativos: false,
          })
        }
      >
        Aplicar filtro
      </button>
      <button type="button" onClick={() => setModoEdicao(true)}>
        Editar
      </button>
    </div>
  ),
}));

vi.mock("../../componentes/alunos/ListaAlunos", () => ({
  default: () => <div>Lista de alunos</div>,
}));

vi.mock("../../componentes/geracao/GerandoBoletins", () => ({
  default: () => <div>Gerando boletins</div>,
}));

vi.mock("../../componentes/geracao/VisualizacaoBoletim", () => ({
  default: ({ nomeArquivo }: { nomeArquivo: string }) => (
    <div>Visualizando {nomeArquivo}</div>
  ),
}));

describe("Boletim", () => {
  const quadros: FrameRequestCallback[] = [];

  beforeEach(() => {
    vi.clearAllMocks();
    quadros.length = 0;
    vi.stubGlobal(
      "requestAnimationFrame",
      vi.fn((callback: FrameRequestCallback) => {
        quadros.push(callback);
        return quadros.length;
      }),
    );
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:boletim"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
    vi.mocked(confirmar).mockResolvedValue(true);
    vi.mocked(criarBoletimPdfMock).mockResolvedValue(new Uint8Array([1, 2, 3]));
  });

  it("aplica filtros, gera e exibe o boletim", async () => {
    const agora = vi.spyOn(Date, "now").mockReturnValue(0);
    render(<Boletim apiUrl="https://api.exemplo" />);

    fireEvent.click(screen.getByRole("button", { name: "Aplicar filtro" }));
    const gerar = screen.getByRole("button", { name: "Gerar" });
    await waitFor(() => expect((gerar as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(gerar);

    expect(screen.getByText("Gerando boletins")).toBeTruthy();
    agora.mockReturnValue(3000);
    await act(async () => {
      quadros.shift()?.(3000);
      await Promise.resolve();
    });

    expect(await screen.findByText("Visualizando boletim-2026.pdf")).toBeTruthy();
    expect(criarBoletimPdfMock).toHaveBeenCalled();
    agora.mockRestore();
  });

  it("navega ao voltar e confirma o cancelamento da edicao", async () => {
    render(<Boletim />);

    fireEvent.click(screen.getByTitle("Voltar"));
    expect(navegar).toHaveBeenCalledWith("/");

    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(confirmar).toHaveBeenCalled());
  });
});
