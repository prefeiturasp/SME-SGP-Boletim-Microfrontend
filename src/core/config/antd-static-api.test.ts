import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getAntdModal,
  getAntdNotification,
  setAntdModal,
  setAntdNotification,
} from "./antd-static-api";

describe("antd-static-api", () => {
  beforeEach(() => {
    setAntdNotification(null);
    setAntdModal(null);
  });

  it("armazena e remove a API de notificacao", () => {
    const api = {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
    };

    setAntdNotification(api);
    expect(getAntdNotification()).toBe(api);
    setAntdNotification(null);
    expect(getAntdNotification()).toBeNull();
  });

  it("armazena e remove a API de modal", () => {
    const api = { confirm: vi.fn() };

    setAntdModal(api);
    expect(getAntdModal()).toBe(api);
    setAntdModal(null);
    expect(getAntdModal()).toBeNull();
  });
});
