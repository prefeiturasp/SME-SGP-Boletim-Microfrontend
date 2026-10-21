import axios from "axios";
import type { AxiosRequestConfig, InternalAxiosRequestConfig } from "axios";
import { getBoletimApiUrl } from "../../config";
import { obterTokenSgp, serializarParams } from "./apiSgp";

const apiBoletim = axios.create();

apiBoletim.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  config.baseURL = getBoletimApiUrl();
  const token = obterTokenSgp();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (!config.headers.Accept) {
    config.headers.Accept = "application/pdf";
  }
  return config;
});

export const getBoletim = <T>(url: string, config?: AxiosRequestConfig) =>
  apiBoletim.get<T>(url, {
    ...config,
    paramsSerializer: {
      serialize: (params) => serializarParams(params as Record<string, unknown>),
    },
  });
