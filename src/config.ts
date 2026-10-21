let urlApiInformadaPeloHost = "";
let urlApiBoletimInformadaPeloHost = "";

const urlConfigurada = (
  informadaPeloHost: string,
  runtime: string | undefined,
  variavelVite: string | undefined,
) => {
  if (informadaPeloHost) return informadaPeloHost;
  if (runtime) return runtime.replace(/\/$/, "");
  if (variavelVite) return variavelVite.replace(/\/$/, "");
  return "";
};

export const definirUrlApiSgp = (url?: string) => {
  if (url) urlApiInformadaPeloHost = url.replace(/\/$/, "");
};

export const definirUrlApiBoletim = (url?: string) => {
  if (url) urlApiBoletimInformadaPeloHost = url.replace(/\/$/, "");
};

export const getSgpApiUrl = (): string =>
  urlConfigurada(
    urlApiInformadaPeloHost,
    globalThis.__ENV__?.VITE_SGP_API,
    import.meta.env.VITE_SGP_API,
  );

export const getBoletimApiUrl = (): string =>
  urlConfigurada(
    urlApiBoletimInformadaPeloHost,
    globalThis.__ENV__?.VITE_BOLETIM_API,
    import.meta.env.VITE_BOLETIM_API,
  );
