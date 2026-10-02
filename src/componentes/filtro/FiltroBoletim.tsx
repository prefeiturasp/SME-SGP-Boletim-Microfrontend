import { Checkbox, Radio } from "antd";
import { useCallback, useEffect, useState } from "react";
import SelectCampo from "../ui/SelectCampo";
import {
  OPCAO_SELECIONAR_ALUNOS,
  OPCAO_TODOS,
  OPCAO_TODOS_ESTUDANTES,
  Modalidade,
  ehEjaOuCelp,
} from "../../core/constantes";
import { exibirErrosApi } from "../../core/config/alertas";
import {
  listarAnosLetivos,
  listarDres,
  listarModalidades,
  listarSemestres,
  listarTurmas,
  listarUes,
  type OpcaoFiltro,
} from "../../services/filtroBoletimService";
import "./filtro.css";

export interface ValoresFiltro {
  consideraHistorico: boolean;
  anoLetivo?: string;
  dreCodigo?: string;
  ueCodigo?: string;
  modalidadeId?: string;
  semestre?: string | number;
  turmasId?: string;
  opcaoEstudanteId?: string;
  quantidadeBoletimPorPagina: string;
  imprimirEstudantesInativos?: boolean;
  dreNome?: string;
  ueNome?: string;
  modalidadeNome?: string;
  turmaNome?: string;
}

interface FiltroBoletimProps {
  onFiltrar: (valores: ValoresFiltro) => void;
  filtrou: boolean;
  setFiltrou: (valor: boolean) => void;
  setModoEdicao: (valor: boolean) => void;
  cancelou: boolean;
  setCancelou: (valor: boolean) => void;
}

const opcoesEstudantes = [
  { texto: "Todos", valor: OPCAO_TODOS_ESTUDANTES },
  { texto: "Selecionar Alunos", valor: OPCAO_SELECIONAR_ALUNOS },
];

const qtdBoletinsPaginaMedio = [
  { valor: "1", texto: "1" },
  { valor: "4", texto: "4" },
];

const qtdBoletinsPaginaFundamentalEja = [
  { valor: "1", texto: "1" },
  { valor: "2", texto: "2" },
  { valor: "6", texto: "6" },
];

const mensagemQuantidade = (quantidade: string) => {
  switch (quantidade) {
    case "1":
      return "Nesta opção será impresso o boletim detalhado";
    case "2":
      return "Nesta opção será impresso o boletim detalhado sem as recomendações";
    case "4":
    case "6":
      return "Nesta opção será impresso o boletim simples";
    default:
      return "";
  }
};

const paraSelect = (lista: OpcaoFiltro[], texto: "desc" | "nomeFiltro" = "desc") =>
  lista.map((item) => ({
    valor: item.valor,
    texto: (texto === "nomeFiltro" ? item.nomeFiltro : item.desc) || "",
  }));

const FiltroBoletim = ({
  onFiltrar,
  filtrou,
  setFiltrou,
  setModoEdicao,
  cancelou,
  setCancelou,
}: FiltroBoletimProps) => {
  const [anoAtual] = useState(String(new Date().getFullYear()));
  const [anoLetivo, setAnoLetivo] = useState<string>();
  const [carregandoAnosLetivos, setCarregandoAnosLetivos] = useState(false);
  const [carregandoDres, setCarregandoDres] = useState(false);
  const [carregandoModalidade, setCarregandoModalidade] = useState(false);
  const [carregandoSemestres, setCarregandoSemestres] = useState(false);
  const [carregandoTurmas, setCarregandoTurmas] = useState(false);
  const [carregandoUes, setCarregandoUes] = useState(false);
  const [consideraHistorico, setConsideraHistorico] = useState(false);
  const [desabilitarEstudante, setDesabilitarEstudante] = useState(false);
  const [dreCodigo, setDreCodigo] = useState<string>();
  const [listaAnosLetivo, setListaAnosLetivo] = useState<OpcaoFiltro[]>([]);
  const [listaDres, setListaDres] = useState<OpcaoFiltro[]>([]);
  const [listaModalidades, setListaModalidades] = useState<OpcaoFiltro[]>([]);
  const [listaSemestres, setListaSemestres] = useState<OpcaoFiltro[]>([]);
  const [listaTurmas, setListaTurmas] = useState<OpcaoFiltro[]>([]);
  const [listaUes, setListaUes] = useState<OpcaoFiltro[]>([]);
  const [modalidadeId, setModalidadeId] = useState<string>();
  const [quantidadeBoletimPorPagina, setQuantidadeBoletimPorPagina] = useState("");
  const [semestre, setSemestre] = useState<string>();
  const [opcaoEstudanteId, setOpcaoEstudanteId] = useState<string>();
  const [turmasId, setTurmasId] = useState<string>();
  const [ueCodigo, setUeCodigo] = useState<string>();
  const [imprimirEstudantesInativos, setImprimirEstudantesInativos] = useState<
    boolean | undefined
  >();

  const ejaOuCelp = ehEjaOuCelp(modalidadeId);
  const ensinoMedio = Number(modalidadeId) === Modalidade.MEDIO;
  const listaQtdBoletinsPagina = ensinoMedio
    ? qtdBoletinsPaginaMedio
    : qtdBoletinsPaginaFundamentalEja;

  const limparCampos = () => {
    setListaUes([]);
    setUeCodigo(undefined);
    setListaModalidades([]);
    setModalidadeId(undefined);
    setListaSemestres([]);
    setSemestre(undefined);
    setListaTurmas([]);
    setTurmasId(undefined);
    setQuantidadeBoletimPorPagina("");
    setOpcaoEstudanteId(undefined);
    setImprimirEstudantesInativos(false);
  };

  const nomeDaLista = (
    lista: OpcaoFiltro[],
    valor?: string,
    campo: "desc" | "nomeFiltro" = "desc",
  ) => lista.find((item) => String(item.valor) === String(valor))?.[campo] || "";

  useEffect(() => {
    const params: ValoresFiltro = {
      consideraHistorico,
      anoLetivo,
      dreCodigo,
      ueCodigo,
      modalidadeId,
      semestre: semestre || 0,
      turmasId,
      opcaoEstudanteId,
      quantidadeBoletimPorPagina,
      imprimirEstudantesInativos,
      dreNome: nomeDaLista(listaDres, dreCodigo),
      ueNome: nomeDaLista(listaUes, ueCodigo),
      modalidadeNome: nomeDaLista(listaModalidades, modalidadeId),
      turmaNome: nomeDaLista(listaTurmas, turmasId, "nomeFiltro"),
    };

    if (!filtrou) {
      onFiltrar(params);
    }
  }, [
    consideraHistorico,
    anoLetivo,
    dreCodigo,
    ueCodigo,
    modalidadeId,
    semestre,
    turmasId,
    opcaoEstudanteId,
    onFiltrar,
    filtrou,
    quantidadeBoletimPorPagina,
    imprimirEstudantesInativos,
    listaDres,
    listaUes,
    listaModalidades,
    listaTurmas,
  ]);

  const aplicarAnoPadrao = useCallback(
    (lista: OpcaoFiltro[]) => {
      if (lista?.length) {
        const temAnoAtual = lista.find((item) => String(item.valor) === String(anoAtual));
        setAnoLetivo(temAnoAtual ? anoAtual : String(lista[0].valor));
        return;
      }
      setAnoLetivo(undefined);
    },
    [anoAtual],
  );

  const obterAnosLetivos = useCallback(async () => {
    setCarregandoAnosLetivos(true);
    try {
      const anosLetivos = await listarAnosLetivos(consideraHistorico);
      if (!anosLetivos.length) {
        anosLetivos.push({ desc: anoAtual, valor: anoAtual });
      }
      const anosOrdenados = [...anosLetivos].sort((a, b) =>
        String(b.valor).localeCompare(String(a.valor)),
      );
      aplicarAnoPadrao(anosOrdenados);
      setListaAnosLetivo(anosOrdenados);
    } catch {
      const fallback = [{ desc: anoAtual, valor: anoAtual }];
      aplicarAnoPadrao(fallback);
      setListaAnosLetivo(fallback);
    } finally {
      setCarregandoAnosLetivos(false);
    }
  }, [anoAtual, consideraHistorico, aplicarAnoPadrao]);

  useEffect(() => {
    obterAnosLetivos();
  }, [obterAnosLetivos, consideraHistorico]);

  useEffect(() => {
    aplicarAnoPadrao(listaAnosLetivo);
  }, [consideraHistorico, listaAnosLetivo, aplicarAnoPadrao]);

  const obterDres = useCallback(async () => {
    if (!anoLetivo) return;
    setCarregandoDres(true);
    try {
      const lista = await listarDres(consideraHistorico, anoLetivo);
      setListaDres(lista);
      if (lista.length === 1) setDreCodigo(lista[0].valor);
      if (!lista.length) setDreCodigo(undefined);
    } catch (falha) {
      exibirErrosApi(falha);
      setDreCodigo(undefined);
      setListaDres([]);
    } finally {
      setCarregandoDres(false);
    }
  }, [anoLetivo, consideraHistorico]);

  useEffect(() => {
    if (anoLetivo) obterDres();
  }, [anoLetivo, consideraHistorico, obterDres]);

  const obterUes = useCallback(async () => {
    if (!anoLetivo || !dreCodigo) return;
    setCarregandoUes(true);
    try {
      const lista = await listarUes(consideraHistorico, dreCodigo, anoLetivo);
      if (lista.length === 1) setUeCodigo(lista[0].valor);
      setListaUes(lista);
    } catch (falha) {
      exibirErrosApi(falha);
      setListaUes([]);
    } finally {
      setCarregandoUes(false);
    }
  }, [dreCodigo, anoLetivo, consideraHistorico]);

  useEffect(() => {
    if (dreCodigo) {
      obterUes();
      return;
    }
    setListaUes([]);
  }, [dreCodigo, obterUes]);

  const obterModalidades = useCallback(async () => {
    if (!ueCodigo || !anoLetivo) return;
    setCarregandoModalidade(true);
    try {
      const lista = await listarModalidades(ueCodigo, consideraHistorico, anoLetivo);
      setListaModalidades(lista);
      if (lista.length === 1) setModalidadeId(lista[0].valor);
    } catch (falha) {
      exibirErrosApi(falha);
      setListaModalidades([]);
    } finally {
      setCarregandoModalidade(false);
    }
  }, [ueCodigo, consideraHistorico, anoLetivo]);

  useEffect(() => {
    if (anoLetivo && ueCodigo) {
      obterModalidades();
      return;
    }
    setModalidadeId(undefined);
    setListaModalidades([]);
  }, [obterModalidades, anoLetivo, ueCodigo, consideraHistorico]);

  useEffect(() => {
    const carregarSemestres = async () => {
      if (!(modalidadeId && anoLetivo && ejaOuCelp && dreCodigo && ueCodigo)) {
        setSemestre(undefined);
        setListaSemestres([]);
        return;
      }
      setCarregandoSemestres(true);
      try {
        const lista = await listarSemestres(
          consideraHistorico,
          anoLetivo,
          modalidadeId,
          dreCodigo,
          ueCodigo,
        );
        if (lista.length === 1) setSemestre(lista[0].valor);
        setListaSemestres(lista);
      } catch (falha) {
        exibirErrosApi(falha);
        setListaSemestres([]);
      } finally {
        setCarregandoSemestres(false);
      }
    };
    carregarSemestres();
  }, [modalidadeId, anoLetivo, dreCodigo, ueCodigo, consideraHistorico, ejaOuCelp]);

  const obterTurmas = useCallback(async () => {
    if (ejaOuCelp && !semestre) return;
    if (!dreCodigo || !ueCodigo || !modalidadeId || !anoLetivo) return;

    setCarregandoTurmas(true);
    try {
      const retorno = await listarTurmas({
        consideraHistorico,
        ueCodigo,
        modalidadeId,
        semestre,
        anoLetivo,
      });

      if (retorno.length) {
        const lista: OpcaoFiltro[] = [];
        if (retorno.length > 1) {
          lista.push({ valor: OPCAO_TODOS, nomeFiltro: "Todas" });
        }
        retorno.forEach((item) =>
          lista.push({
            desc: item.nome,
            valor: String(item.codigo),
            id: item.id,
            ano: item.ano,
            nomeFiltro: item.nomeFiltro,
          }),
        );
        setListaTurmas(lista);
        if (lista.length === 1) {
          setTurmasId(lista[0].valor);
          setOpcaoEstudanteId(OPCAO_TODOS_ESTUDANTES);
        }
      } else {
        setListaTurmas([]);
      }
    } catch (falha) {
      exibirErrosApi(falha);
      setListaTurmas([]);
    } finally {
      setCarregandoTurmas(false);
    }
  }, [ejaOuCelp, ueCodigo, dreCodigo, consideraHistorico, anoLetivo, modalidadeId, semestre]);

  useEffect(() => {
    if (ueCodigo && modalidadeId) {
      obterTurmas();
      return;
    }
    setTurmasId(undefined);
    setListaTurmas([]);
  }, [ueCodigo, modalidadeId, semestre, obterTurmas]);

  useEffect(() => {
    if (opcaoEstudanteId !== OPCAO_TODOS_ESTUDANTES) {
      setImprimirEstudantesInativos(false);
    }
    if (opcaoEstudanteId === OPCAO_SELECIONAR_ALUNOS) {
      setFiltrou(false);
      setImprimirEstudantesInativos(true);
    }
  }, [opcaoEstudanteId, setFiltrou]);

  useEffect(() => {
    if (!cancelou) return;
    setConsideraHistorico(false);
    limparCampos();
    setAnoLetivo(anoAtual);
    setDreCodigo(undefined);
    obterDres();
    setFiltrou(false);
    setCancelou(false);
    setImprimirEstudantesInativos(false);
    setQuantidadeBoletimPorPagina("");
    setOpcaoEstudanteId(undefined);
    // O cancelamento replica o fluxo atual do SGP, que zera o formulário uma vez.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cancelou]);

  const marcarEdicao = () => {
    setFiltrou(false);
    setModoEdicao(true);
  };

  return (
    <div className="filtros">
      <div className="linha">
        <div className="checkbox-historico">
          <Checkbox
            id="SGP_CHECKBOX_EXIBIR_HISTORICO"
            checked={consideraHistorico}
            onChange={(evento) => {
              setConsideraHistorico(evento.target.checked);
              limparCampos();
              setDreCodigo(undefined);
              setQuantidadeBoletimPorPagina("");
              marcarEdicao();
            }}
          >
            Exibir histórico?
          </Checkbox>
        </div>
      </div>

      <div className="linha linha-anos">
        <SelectCampo
          id="SGP_SELECT_ANO_LETIVO"
          label="Ano Letivo"
          opcoes={paraSelect(listaAnosLetivo)}
          valor={anoLetivo}
          disabled={listaAnosLetivo.length === 1}
          carregando={carregandoAnosLetivos}
          placeholder="Ano letivo"
          onChange={(ano) => {
            limparCampos();
            setAnoLetivo(ano);
            marcarEdicao();
          }}
        />
        <SelectCampo
          id="SGP_SELECT_DRE"
          label="Diretoria Regional de Educação (DRE)"
          opcoes={paraSelect(listaDres)}
          valor={dreCodigo}
          disabled={!anoLetivo || listaDres.length === 1}
          carregando={carregandoDres}
          placeholder="Diretoria Regional De Educação (DRE)"
          showSearch
          onChange={(dre) => {
            setDreCodigo(dre);
            limparCampos();
            marcarEdicao();
          }}
        />
        <SelectCampo
          id="SGP_SELECT_UE"
          label="Unidade Escolar (UE)"
          opcoes={paraSelect(listaUes)}
          valor={ueCodigo}
          disabled={!dreCodigo || listaUes.length === 1}
          carregando={carregandoUes}
          placeholder="Unidade Escolar (UE)"
          showSearch
          onChange={(ue) => {
            setUeCodigo(ue);
            setListaModalidades([]);
            setModalidadeId(undefined);
            setListaTurmas([]);
            setTurmasId(undefined);
            setQuantidadeBoletimPorPagina("");
            marcarEdicao();
          }}
        />
      </div>

      <div className="linha linha-3">
        <SelectCampo
          id="SGP_SELECT_MODALIDADE"
          label="Modalidade"
          opcoes={paraSelect(listaModalidades)}
          valor={modalidadeId}
          disabled={!ueCodigo || listaModalidades.length === 1}
          carregando={carregandoModalidade}
          placeholder="Modalidade"
          onChange={(valor) => {
            setTurmasId(undefined);
            setModalidadeId(valor);
            setQuantidadeBoletimPorPagina("");
            marcarEdicao();
          }}
        />
        <SelectCampo
          id="SGP_SELECT_SEMESTRE"
          label="Semestre"
          opcoes={paraSelect(listaSemestres)}
          valor={semestre}
          disabled={
            !modalidadeId ||
            listaSemestres.length === 1 ||
            (Number(modalidadeId) !== Modalidade.EJA &&
              Number(modalidadeId) !== Modalidade.CELP)
          }
          carregando={carregandoSemestres}
          placeholder="Semestre"
          onChange={(valor) => {
            setSemestre(valor);
            setQuantidadeBoletimPorPagina("");
            marcarEdicao();
          }}
        />
        <SelectCampo
          id="SGP_SELECT_TURMA"
          label="Turma"
          opcoes={paraSelect(listaTurmas, "nomeFiltro")}
          valor={turmasId}
          disabled={!modalidadeId || listaTurmas.length === 1 || (ejaOuCelp && !semestre)}
          carregando={carregandoTurmas}
          placeholder="Turma"
          showSearch
          onChange={(valor) => {
            const temOpcaoTodas = String(valor) === OPCAO_TODOS;
            setTurmasId(valor);
            setOpcaoEstudanteId(OPCAO_TODOS_ESTUDANTES);
            setDesabilitarEstudante(temOpcaoTodas);
            setQuantidadeBoletimPorPagina("");
            marcarEdicao();
          }}
        />
      </div>

      <div className="linha linha-3">
        <SelectCampo
          id="SGP_SELECT_OPCAO_ESTUDANTE"
          label="Estudante(s)"
          opcoes={opcoesEstudantes}
          valor={opcaoEstudanteId}
          disabled={!turmasId || desabilitarEstudante}
          placeholder="Estudante(s)"
          onChange={(valor) => {
            setFiltrou(false);
            setOpcaoEstudanteId(valor);
            setQuantidadeBoletimPorPagina("");
          }}
        />
        <div>
          <SelectCampo
            id="SGP_SELECT_MODELO_BOLETIM"
            label="Qtde de boletins por página"
            opcoes={listaQtdBoletinsPagina}
            valor={quantidadeBoletimPorPagina || undefined}
            disabled={!turmasId || !opcaoEstudanteId}
            placeholder="Qtde de boletins por página"
            onChange={(valor) => {
              setFiltrou(false);
              setQuantidadeBoletimPorPagina(valor);
              setModoEdicao(true);
            }}
          />
          <div className="aviso-boletim">{mensagemQuantidade(quantidadeBoletimPorPagina)}</div>
        </div>
        <div className="radio-inativos">
          <span className="campo-label">Imprimir estudantes inativos</span>
          <Radio.Group
            id="SGP_CHECKBOX_IMPRIMIR_ESTUDANTE_INATIVO"
            options={[
              { label: "Sim", value: true },
              { label: "Não", value: false },
            ]}
            value={imprimirEstudantesInativos || false}
            disabled={opcaoEstudanteId !== OPCAO_TODOS_ESTUDANTES}
            onChange={(evento) => {
              setFiltrou(false);
              setImprimirEstudantesInativos(evento.target.value);
              setModoEdicao(true);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default FiltroBoletim;
