import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { confirmar, erro, sucesso } from "../../core/config/alertas";
import {
  buscarContextoImpressaoBoletim,
  imprimirBoletim,
} from "../../services/boletimService";
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
  sucesso: vi.fn(),
  erro: vi.fn(),
}));

vi.mock("../../services/boletimService", () => ({
  buscarContextoImpressaoBoletim: vi.fn(),
  imprimirBoletim: vi.fn(),
}));

vi.mock("../../componentes/filtro/FiltroBoletim", () => {
  const filtroBase = {
    consideraHistorico: false,
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
  };

  return {
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
          onClick={() => onFiltrar({ ...filtroBase, anoLetivo: "2026" })}
        >
          Aplicar filtro
        </button>
        <button
          type="button"
          onClick={() => onFiltrar({ ...filtroBase, anoLetivo: "2025" })}
        >
          Aplicar filtro antigo
        </button>
        <button
          type="button"
          onClick={() =>
            onFiltrar({
              ...filtroBase,
              anoLetivo: "2026",
              modalidadeId: "1",
              modalidadeNome: "Educacao infantil",
            })
          }
        >
          Aplicar filtro infantil
        </button>
        <button type="button" onClick={() => setModoEdicao(true)}>
          Editar
        </button>
      </div>
    ),
  };
});

vi.mock("../../componentes/alunos/ListaAlunos", () => ({
  default: () => <div>Lista de alunos</div>,
}));

vi.mock("../../componentes/geracao/GerandoBoletins", () => ({
  default: ({ fase }: { fase: "buscando-dados" | "gerando-pdf" }) => (
    <div>{fase === "buscando-dados" ? "Buscando dados dos boletins" : "Gerando arquivo PDF"}</div>
  ),
}));

vi.mock("../../componentes/geracao/VisualizacaoBoletim", () => ({
  default: ({
    nomeArquivo,
    resumo,
    dataConsolidacao,
  }: {
    nomeArquivo: string;
    resumo: { dre: string; anoLetivo: string; turma: string };
    dataConsolidacao?: string;
  }) => (
    <div>
      Visualizando {nomeArquivo}
      <span>{resumo.anoLetivo}</span>
      <span>{resumo.dre}</span>
      <span>{resumo.turma}</span>
      <span>{dataConsolidacao}</span>
    </div>
  ),
}));

describe("Boletim", () => {
  let concluirPdf: (resultado: Awaited<ReturnType<typeof buscarContextoImpressaoBoletim>>) => void;
  let concluirWorker: (() => void) | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    class WorkerSimulado {
      onmessage: ((evento: MessageEvent) => void) | null = null;
      onerror: (() => void) | null = null;
      postMessage() {
        concluirWorker = () =>
          this.onmessage?.({
            data: { tipo: "concluido", arquivo: new ArrayBuffer(8) },
          } as MessageEvent);
      }
      terminate() {}
    }
    vi.stubGlobal("Worker", WorkerSimulado);
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:boletim"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
    vi.mocked(confirmar).mockResolvedValue(true);
    vi.mocked(buscarContextoImpressaoBoletim).mockImplementation(
      () =>
        new Promise<Awaited<ReturnType<typeof buscarContextoImpressaoBoletim>>>((resolve) => {
          concluirPdf = resolve;
        }),
    );
    vi.mocked(imprimirBoletim).mockResolvedValue({ data: { id: 1 } } as never);
  });

  it("aplica filtros, gera e exibe o boletim de 2026 com os dados do filtro", async () => {
    render(<Boletim apiUrl="https://api.exemplo" boletimApiUrl="https://boletim.exemplo" />);

    fireEvent.click(screen.getByRole("button", { name: "Aplicar filtro" }));
    const gerar = screen.getByRole("button", { name: "Gerar" });
    await waitFor(() => expect((gerar as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(gerar);

    expect(screen.getByText("Buscando dados dos boletins")).toBeTruthy();
    await act(async () => {
      concluirPdf({
        contexto: {
          paginas: [],
          boletins_por_pagina: 2,
          dados_atualizados_em: "30/09/2026 08:45",
          data_geracao: "03/11/2026 10:00",
          total_paginas: 0,
        },
      });
    });
    expect(await screen.findByText("Gerando arquivo PDF")).toBeTruthy();
    await waitFor(() => expect(concluirWorker).toBeTypeOf("function"));
    await act(async () => concluirWorker?.());
    expect(await screen.findByText("Visualizando boletim-escolar-2026.pdf")).toBeTruthy();
    expect(screen.getByText("2026")).toBeTruthy();
    expect(screen.getByText("DRE")).toBeTruthy();
    expect(screen.getByText("1A")).toBeTruthy();
    expect(screen.getByText("30/09/2026 - 08:45")).toBeTruthy();
    expect(buscarContextoImpressaoBoletim).toHaveBeenCalledWith(
      expect.objectContaining({
        anoLetivo: "2026",
        dreCodigo: "1",
        ueCodigo: "2",
        turmaCodigo: "3",
        quantidadeBoletimPorPagina: "2",
      }),
      [],
      expect.any(AbortSignal),
    );
    expect(imprimirBoletim).not.toHaveBeenCalled();
  });

  it("envia anos ate 2025 para a fila e avisa sobre a notificacao", async () => {
    render(<Boletim />);

    fireEvent.click(screen.getByRole("button", { name: "Aplicar filtro antigo" }));
    const gerar = screen.getByRole("button", { name: "Gerar" });
    await waitFor(() => expect((gerar as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(gerar);

    await waitFor(() => expect(imprimirBoletim).toHaveBeenCalled());
    expect(sucesso).toHaveBeenCalledWith(
      "Solicitação de geração do relatório gerada com sucesso. Em breve você receberá uma notificação com o resultado.",
    );
    expect(buscarContextoImpressaoBoletim).not.toHaveBeenCalled();
    expect(screen.queryByText("Buscando dados dos boletins")).toBeNull();
  });

  it("informa quando a solicitacao antiga falha", async () => {
    vi.mocked(imprimirBoletim).mockResolvedValue({ erro: true });
    render(<Boletim />);

    fireEvent.click(screen.getByRole("button", { name: "Aplicar filtro antigo" }));
    const gerar = screen.getByRole("button", { name: "Gerar" });
    await waitFor(() => expect((gerar as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(gerar);

    await waitFor(() =>
      expect(erro).toHaveBeenCalledWith(
        "Não foi possível solicitar a impressão do Boletim",
      ),
    );
  });

  it("volta aos filtros quando a geracao em tempo real falha", async () => {
    vi.mocked(buscarContextoImpressaoBoletim).mockResolvedValue({
      erro: true,
      mensagem: "Nenhum aluno encontrado.",
    });
    render(<Boletim />);

    fireEvent.click(screen.getByRole("button", { name: "Aplicar filtro" }));
    const gerar = screen.getByRole("button", { name: "Gerar" });
    await waitFor(() => expect((gerar as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(gerar);

    await waitFor(() => expect(erro).toHaveBeenCalledWith("Nenhum aluno encontrado."));
    expect(screen.queryByText(/Visualizando/)).toBeNull();
  });

  it("exibe o aviso de educacao infantil no padrao do SGP", () => {
    render(<Boletim />);

    fireEvent.click(screen.getByRole("button", { name: "Aplicar filtro infantil" }));

    const aviso = screen.getByRole("alert");
    expect(aviso.textContent).toBe(
      "Esta interface não está disponível para turmas da educação infantil",
    );
    expect(aviso.className).toContain("alert-warning");
    expect(aviso.className).toContain("text-center");
  });

  it("alterar filtros retorna a pesquisa com o mesmo comportamento do voltar", async () => {
    render(<Boletim />);

    fireEvent.click(screen.getByRole("button", { name: "Aplicar filtro" }));
    const gerar = screen.getByRole("button", { name: "Gerar" });
    await waitFor(() => expect((gerar as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(gerar);
    await act(async () => {
      concluirPdf({
        contexto: {
          paginas: [],
          boletins_por_pagina: 2,
          dados_atualizados_em: null,
          data_geracao: "03/11/2026 10:00",
          total_paginas: 0,
        },
      });
    });
    await screen.findByText("Gerando arquivo PDF");
    await waitFor(() => expect(concluirWorker).toBeTypeOf("function"));
    await act(async () => concluirWorker?.());

    fireEvent.click(await screen.findByRole("button", { name: "Alterar Filtros" }));

    expect(navegar).not.toHaveBeenCalled();
    expect(screen.queryByText(/Visualizando/)).toBeNull();
    expect(screen.getByRole("button", { name: "Gerar" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Alterar Filtros" })).toBeNull();
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
