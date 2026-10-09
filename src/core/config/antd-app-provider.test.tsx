import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { getAntdModal, getAntdNotification } from "./antd-static-api";
import { AntdAppProvider } from "./antd-app-provider";

const { notificationApi, modalApi } = vi.hoisted(() => ({
  notificationApi: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
  modalApi: { confirm: vi.fn() },
}));

vi.mock("antd", () => ({
  notification: {
    useNotification: () => [notificationApi, <span key="n">Notificacao</span>],
  },
  Modal: {
    useModal: () => [modalApi, <span key="m">Modal</span>],
  },
}));

describe("AntdAppProvider", () => {
  it("disponibiliza as APIs enquanto estiver montado", () => {
    const { unmount } = render(
      <AntdAppProvider>
        <span>Conteudo</span>
      </AntdAppProvider>,
    );

    expect(screen.getByText("Conteudo")).toBeTruthy();
    expect(getAntdNotification()).toBe(notificationApi);
    expect(getAntdModal()).toBe(modalApi);

    unmount();
    expect(getAntdNotification()).toBeNull();
    expect(getAntdModal()).toBeNull();
  });
});
