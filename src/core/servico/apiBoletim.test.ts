import { beforeEach, describe, expect, it, vi } from "vitest";

interface ClienteHttp {
  interceptor?: (config: {
    headers: Record<string, string>;
    baseURL?: string;
  }) => unknown;
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
}

const instancias = vi.hoisted(() => [] as ClienteHttp[]);

vi.mock("../../config", () => ({
  getBoletimApiUrl: () => "https://boletim.exemplo",
  getSgpApiUrl: () => "https://sgp.exemplo",
}));

vi.mock("axios", () => ({
  default: {
    create: () => {
      const instancia: ClienteHttp = {
        get: vi.fn().mockResolvedValue({ data: "ok" }),
        post: vi.fn().mockResolvedValue({ data: "ok" }),
      };
      instancia.interceptor = undefined;
      instancias.push({
        ...instancia,
        interceptors: undefined,
      } as ClienteHttp);
      const registrado = instancias[instancias.length - 1];
      return {
        get: registrado.get,
        post: registrado.post,
        interceptors: {
          request: {
            use: (fn: ClienteHttp["interceptor"]) => {
              registrado.interceptor = fn;
            },
          },
        },
      };
    },
  },
}));

import { getBoletim } from "./apiBoletim";
import { definirTokenSgp, getSgp, postSgp } from "./apiSgp";

const clientePorUrl = (url: string) =>
  instancias.find((cliente) => {
    const config = { headers: {} as Record<string, string> };
    cliente.interceptor?.(config);
    return config.baseURL === url;
  });

describe("cliente da API de boletim", () => {
  beforeEach(() => {
    definirTokenSgp();
    instancias.forEach((cliente) => {
      cliente.get.mockClear();
      cliente.post.mockClear();
    });
  });

  it("envia o token e pede PDF quando o cabecalho ainda nao foi definido", () => {
    const cliente = clientePorUrl("https://boletim.exemplo");
    definirTokenSgp("token-boletim");
    const config = { headers: {} as Record<string, string> };

    cliente?.interceptor?.(config);

    expect(config.baseURL).toBe("https://boletim.exemplo");
    expect(config.headers.Authorization).toBe("Bearer token-boletim");
    expect(config.headers.Accept).toBe("application/pdf");
  });

  it("preserva o Accept informado e omite o token ausente", () => {
    const cliente = clientePorUrl("https://boletim.exemplo");
    const config = { headers: { Accept: "application/json" } };

    cliente?.interceptor?.(config);

    expect(config.headers.Authorization).toBeUndefined();
    expect(config.headers.Accept).toBe("application/json");
  });

  it("consulta o PDF serializando os filtros", async () => {
    const cliente = clientePorUrl("https://boletim.exemplo");

    await expect(
      getBoletim("api/boletim/pdf/", {
        params: { ano_letivo: 2026, alunos_codigo: [10, 20] },
      }),
    ).resolves.toEqual({ data: "ok" });

    const opcoes = cliente?.get.mock.calls[0][1];
    expect(cliente?.get).toHaveBeenCalledWith(
      "api/boletim/pdf/",
      expect.objectContaining({
        params: { ano_letivo: 2026, alunos_codigo: [10, 20] },
      }),
    );
    expect(opcoes.paramsSerializer.serialize(opcoes.params)).toBe(
      "ano_letivo=2026&alunos_codigo=10&alunos_codigo=20",
    );
  });
});

describe("cliente da API do SGP", () => {
  beforeEach(() => {
    definirTokenSgp();
  });

  it("envia o token e pede JSON", () => {
    const cliente = clientePorUrl("https://sgp.exemplo");
    definirTokenSgp("token-sgp");
    const config = { headers: {} as Record<string, string> };

    cliente?.interceptor?.(config);

    expect(config.headers.Authorization).toBe("Bearer token-sgp");
    expect(config.headers.Accept).toBe("application/json");
  });

  it("consulta e envia dados pela API do SGP", async () => {
    const cliente = clientePorUrl("https://sgp.exemplo");

    await getSgp("v1/anos", { params: { ano: 2026 } });
    await postSgp("v1/boletim/imprimir", { ano: 2025 });

    expect(cliente?.get).toHaveBeenCalledWith(
      "v1/anos",
      expect.objectContaining({ params: { ano: 2026 } }),
    );
    expect(cliente?.post).toHaveBeenCalledWith("v1/boletim/imprimir", { ano: 2025 });
  });
});
