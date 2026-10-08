export interface UsuarioState {
  token?: string;
  logado?: boolean;
  acessoAdmin?: boolean;
  listaUrlAjudaDoSistema?: { rota?: string; url?: string }[];
  [key: string]: unknown;
}

export interface NavegacaoState {
  rotaAtiva?: string;
  [key: string]: unknown;
}

export interface RootState {
  usuario: UsuarioState;
  navegacao?: NavegacaoState;
  [key: string]: unknown;
}
