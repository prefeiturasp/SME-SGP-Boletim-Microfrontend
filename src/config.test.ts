import { beforeEach, describe, expect, it, vi } from "vitest";

describe("configuracao da API do SGP", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.stubGlobal("__ENV__", {});
  });

  it("prioriza a URL informada pelo host e remove a barra final", async () => {
    vi.stubEnv("VITE_SGP_API", "https://variavel.exemplo/api");
    vi.stubGlobal("__ENV__", { VITE_SGP_API: "https://runtime.exemplo/api" });
    const { definirUrlApiSgp, getSgpApiUrl } = await import("./config");

    definirUrlApiSgp("https://host.exemplo/api/");

    expect(getSgpApiUrl()).toBe("https://host.exemplo/api");
  });

  it("usa a configuracao de runtime quando o host nao informa a URL", async () => {
    vi.stubEnv("VITE_SGP_API", "https://variavel.exemplo/api");
    vi.stubGlobal("__ENV__", { VITE_SGP_API: "https://runtime.exemplo/api" });
    const { getSgpApiUrl } = await import("./config");

    expect(getSgpApiUrl()).toBe("https://runtime.exemplo/api");
  });

  it("usa a variavel do Vite quando nao ha configuracao do host ou runtime", async () => {
    vi.stubEnv("VITE_SGP_API", "https://variavel.exemplo/api");
    const { getSgpApiUrl } = await import("./config");

    expect(getSgpApiUrl()).toBe("https://variavel.exemplo/api");
  });

  it("retorna vazio quando nenhuma URL foi configurada", async () => {
    vi.stubEnv("VITE_SGP_API", "");
    const { getSgpApiUrl } = await import("./config");

    expect(getSgpApiUrl()).toBe("");
  });
});
