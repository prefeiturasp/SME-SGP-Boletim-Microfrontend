import axios from "axios";
import type { AxiosRequestConfig, InternalAxiosRequestConfig } from "axios";
import { getSgpApiUrl } from "../../config";

let tokenAtual = "";

export const definirTokenSgp = (token?: string) => {
  tokenAtual = token || "";
};

const apiSgp = axios.create();

const serializarValor = (valor: unknown) =>
  typeof valor === "object" ? JSON.stringify(valor) : String(valor);

export const serializarParams = (params: Record<string, unknown>) => {
  const search = new URLSearchParams();

  Object.entries(params || {}).forEach(([chave, valor]) => {
    if (valor === null || valor === undefined || valor === "") return;

    if (Array.isArray(valor)) {
      valor.forEach((item) => {
        if (item !== null && item !== undefined && item !== "") {
          search.append(chave, serializarValor(item));
        }
      });
      return;
    }

    search.append(chave, serializarValor(valor));
  });

  return search.toString();
};

apiSgp.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  config.baseURL = getSgpApiUrl();
  if (tokenAtual) {
    config.headers.Authorization = `Bearer ${tokenAtual}`;
  }
  config.headers.Accept = "application/json";
  return config;
});

export const getSgp = <T>(url: string, config?: AxiosRequestConfig) =>
  apiSgp.get<T>(url, {
    ...config,
    paramsSerializer: {
      serialize: (params) => serializarParams(params as Record<string, unknown>),
    },
  });

export const postSgp = <T>(url: string, dados?: unknown) =>
  apiSgp.post<T>(url, dados);
