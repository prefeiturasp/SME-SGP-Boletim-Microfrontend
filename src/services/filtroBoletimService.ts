import { getSgp } from "../core/servico/apiSgp";

export interface OpcaoFiltro {
  desc?: string;
  valor: string;
  abrev?: string;
  id?: number;
  nomeFiltro?: string;
  ano?: string;
}

interface DreApi {
  nome: string;
  codigo: string | number;
  abreviacao?: string;
  id?: number;
}

interface UeApi {
  nome: string;
  codigo: string | number;
  id?: number;
}

interface ModalidadeApi {
  descricao: string;
  valor: string | number;
}

interface TurmaApi {
  nome: string;
  codigo: string | number;
  id?: number;
  ano?: string;
  nomeFiltro?: string;
}

const ordenarPorTexto = (indice: "desc") => (a: OpcaoFiltro, b: OpcaoFiltro) => {
  const itemA = String(a[indice] || "").toUpperCase();
  const itemB = String(b[indice] || "").toUpperCase();
  if (itemA > itemB) return 1;
  if (itemA < itemB) return -1;
  return 0;
};

export const listarAnosLetivos = async (consideraHistorico: boolean) => {
  const resposta = await getSgp<Array<string | number>>(
    `v1/abrangencias/${consideraHistorico}/anos-letivos?anoMinimo=0`,
  );
  return (resposta.data || []).map((ano) => ({
    desc: String(ano),
    valor: String(ano),
  }));
};

export const listarDres = async (
  consideraHistorico: boolean,
  anoLetivo: string,
) => {
  const resposta = await getSgp<DreApi[]>(
    `v1/abrangencias/${consideraHistorico}/dres?anoLetivo=${anoLetivo}`,
  );
  return (resposta.data || [])
    .map((item) => ({
      desc: item.nome,
      valor: String(item.codigo),
      abrev: item.abreviacao,
      id: item.id,
    }))
    .sort(ordenarPorTexto("desc"));
};

export const listarUes = async (
  consideraHistorico: boolean,
  dreCodigo: string,
  anoLetivo: string,
) => {
  const resposta = await getSgp<UeApi[]>(
    `v1/abrangencias/${consideraHistorico}/dres/${dreCodigo}/ues?anoLetivo=${anoLetivo}`,
  );
  return (resposta.data || []).map((item) => ({
    desc: item.nome,
    valor: String(item.codigo),
    id: item.id,
  }));
};

export const listarModalidades = async (
  ueCodigo: string,
  consideraHistorico: boolean,
  anoLetivo: string,
) => {
  const url = consideraHistorico
    ? `v1/relatorios/filtros/ues/${ueCodigo}/modalidades/abrangencias?consideraNovasModalidades=false&consideraHistorico=${consideraHistorico}&anoLetivo=${anoLetivo}`
    : `v1/relatorios/filtros/ues/${ueCodigo}/modalidades/abrangencias?consideraNovasModalidades=false`;

  const resposta = await getSgp<ModalidadeApi[]>(url);
  return (resposta.data || []).map((item) => ({
    desc: item.descricao,
    valor: String(item.valor),
  }));
};

export const listarSemestres = async (
  consideraHistorico: boolean,
  anoLetivo: string,
  modalidadeId: string,
  dreCodigo: string,
  ueCodigo: string,
) => {
  const resposta = await getSgp<Array<string | number>>(
    `v1/abrangencias/${consideraHistorico}/semestres`,
    {
      params: { anoLetivo, modalidade: modalidadeId, dreCodigo, ueCodigo },
    },
  );
  return (resposta.data || []).map((periodo) => ({
    desc: String(periodo),
    valor: String(periodo),
  }));
};

export const listarTurmas = async ({
  consideraHistorico,
  ueCodigo,
  modalidadeId,
  semestre,
  anoLetivo,
}: {
  consideraHistorico: boolean;
  ueCodigo: string;
  modalidadeId: string;
  semestre?: string;
  anoLetivo: string;
}) => {
  const params: Record<string, string> = {};
  if (modalidadeId) params.modalidade = modalidadeId;
  if (semestre) params.periodo = semestre;

  const resposta = await getSgp<TurmaApi[]>(
    `v1/abrangencias/${consideraHistorico}/dres/ues/${ueCodigo}/turmas-regulares?consideraNovosAnosInfantil=true${
      anoLetivo ? `&anoLetivo=${anoLetivo}` : ""
    }`,
    { params },
  );

  return resposta.data || [];
};
