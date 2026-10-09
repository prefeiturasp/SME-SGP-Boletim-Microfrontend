import { beforeEach, describe, expect, it, vi } from "vitest";
import { Modal, notification } from "antd";
import {
  setAntdModal,
  setAntdNotification,
} from "./antd-static-api";
import { confirmar, erro, exibirErrosApi, sucesso } from "./alertas";

vi.mock("antd", () => ({
  Modal: { confirm: vi.fn() },
  notification: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

describe("alertas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setAntdNotification(null);
    setAntdModal(null);
  });

  it("usa a notificacao estatica quando nao ha provider", () => {
    sucesso("Concluido");
    erro("Falhou");

    expect(notification.success).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Sucesso",
        description: "Concluido",
        className: "alerta-sucesso",
      }),
    );
    expect(notification.error).toHaveBeenCalledWith(
      expect.objectContaining({ className: "alerta-erro" }),
    );
  });

  it("usa a notificacao fornecida pelo provider", () => {
    const api = {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
    };
    setAntdNotification(api);

    sucesso("Concluido");

    expect(api.success).toHaveBeenCalled();
    expect(notification.success).not.toHaveBeenCalled();
  });

  it("exibe todas as mensagens recebidas da API", () => {
    exibirErrosApi({
      response: { data: { mensagens: ["Primeiro erro", "Segundo erro"] } },
    });

    expect(notification.error).toHaveBeenCalledTimes(2);
  });

  it("exibe uma mensagem padrao quando a API nao detalha o erro", () => {
    exibirErrosApi(new Error("falha"));

    expect(notification.error).toHaveBeenCalledWith(
      expect.objectContaining({ description: "Ocorreu um erro interno." }),
    );
  });

  it("resolve a confirmacao pelo modal do provider", async () => {
    const confirm = vi.fn((config: { onOk: () => void }) => config.onOk());
    setAntdModal({ confirm });

    await expect(confirmar("Titulo", "Texto")).resolves.toBe(true);
  });

  it("resolve o cancelamento pelo modal estatico", async () => {
    vi.mocked(Modal.confirm).mockImplementation((config) => {
      config.onCancel?.();
      return {} as never;
    });

    await expect(confirmar("Titulo", "Texto")).resolves.toBe(false);
  });
});
