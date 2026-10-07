let urlApiInformadaPeloHost = "";

export const definirUrlApiSgp = (url?: string) => {
  if (url) urlApiInformadaPeloHost = url.replace(/\/$/, "");
};

export const getSgpApiUrl = (): string => {
  if (urlApiInformadaPeloHost) return urlApiInformadaPeloHost;

  if (globalThis.__ENV__?.VITE_SGP_API) {
    return globalThis.__ENV__.VITE_SGP_API;
  }

  if (import.meta.env.VITE_SGP_API) {
    return import.meta.env.VITE_SGP_API;
  }

  return "";
};
