import { Alert } from "antd";
import {
  faArrowLeft,
  faQuestionCircle,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { AntdAppProvider } from "../../core/config/antd-app-provider";
import { confirmar } from "../../core/config/alertas";
import { Modalidade, OPCAO_SELECIONAR_ALUNOS } from "../../core/constantes";
import { definirTokenSgp } from "../../core/servico/apiSgp";
import { definirUrlApiSgp } from "../../config";
import ListaAlunos from "../../componentes/alunos/ListaAlunos";
import GerandoBoletins from "../../componentes/geracao/GerandoBoletins";
import VisualizacaoBoletim from "../../componentes/geracao/VisualizacaoBoletim";
import FiltroBoletim, {
  type ValoresFiltro,
} from "../../componentes/filtro/FiltroBoletim";
import { type DadosFiltroBoletim } from "../../services/boletimService";
import {
  criarBoletimPdfMock,
  nomeArquivoBoletim,
  type ResumoBoletim,
} from "../../mocks/boletimPdf";
import type { RootState } from "../../types/redux";
import "./boletim.css";

type EtapaBoletim = "filtros" | "gerando" | "visualizacao";

const resumoVazio: ResumoBoletim = {
  exibirHistorico: "Não",
  anoLetivo: "",
  dre: "",
  ue: "",
  modalidade: "",
  turma: "",
  estudantes: "",
  boletinsPorPagina: "",
  imprimirInativos: "Não",
};

const estadoInicial: DadosFiltroBoletim = {
  anoLetivo: "",
  modalidade: "",
  dreCodigo: "",
  ueCodigo: "",
  turmaCodigo: "",
  semestre: 0,
  consideraHistorico: false,
  opcaoEstudanteId: "",
  quantidadeBoletimPorPagina: "",
  filtroEhValido: true,
};

interface BoletimProps {
  apiUrl?: string;
}

const criarArquivoPdf = async (resumo: ResumoBoletim) => {
  const bytes = await criarBoletimPdfMock(resumo);
  return new File(
    [Uint8Array.from(bytes)],
    nomeArquivoBoletim(resumo.anoLetivo),
    { type: "application/pdf" },
  );
};

const atualizarUrlPdf = (arquivo: File) => (urlAtual: string) => {
  if (urlAtual) URL.revokeObjectURL(urlAtual);
  return URL.createObjectURL(arquivo);
};

const Boletim = ({ apiUrl }: BoletimProps) => {
  const navigate = useNavigate();
  const usuario = useSelector((state: RootState) => state.usuario);
  const rotaAtiva = useSelector(
    (state: RootState) => state.navegacao?.rotaAtiva,
  );

  const [clicouBotaoGerar, setClicouBotaoGerar] = useState(false);
  const [desabilitarBotaoGerar, setDesabilitarBotaoGerar] = useState(false);
  const [filtrou, setFiltrou] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [cancelou, setCancelou] = useState(false);
  const [filtro, setFiltro] = useState<DadosFiltroBoletim>(estadoInicial);
  const [itensSelecionados, setItensSelecionados] = useState<string[]>([]);
  const [resumo, setResumo] = useState<ResumoBoletim>(resumoVazio);
  const [resumoExibido, setResumoExibido] = useState<ResumoBoletim>(resumoVazio);
  const [etapa, setEtapa] = useState<EtapaBoletim>("filtros");
  const [progresso, setProgresso] = useState(0);
  const [pdfUrl, setPdfUrl] = useState("");

  if (apiUrl) definirUrlApiSgp(apiUrl);
  definirTokenSgp(usuario?.token);

  const selecionarAlunos = Boolean(
    filtro.turmaCodigo && filtro.opcaoEstudanteId === "1",
  );

  const urlAjuda = useMemo(() => {
    const lista = usuario?.listaUrlAjudaDoSistema;
    if (!lista?.length || !rotaAtiva) return "";
    const dados = lista.find(
      (item) => !!item?.rota && rotaAtiva.includes(item.rota),
    );
    if (dados?.url && dados.rota && rotaAtiva.startsWith(dados.rota))
      return dados.url;
    return "";
  }, [usuario, rotaAtiva]);

  const onSelecionarItems = useCallback((codigos: string[]) => {
    setItensSelecionados(codigos);
    setClicouBotaoGerar(false);
  }, []);

  const onChangeFiltro = useCallback((valoresFiltro: ValoresFiltro) => {
    const modalidade = Number(valoresFiltro.modalidadeId);
    setFiltro({
      anoLetivo: valoresFiltro.anoLetivo || "",
      modalidade: valoresFiltro.modalidadeId || "",
      dreCodigo: valoresFiltro.dreCodigo || "",
      ueCodigo: valoresFiltro.ueCodigo || "",
      turmaCodigo: valoresFiltro.turmasId || "",
      semestre:
        modalidade === Modalidade.EJA || modalidade === Modalidade.CELP
          ? valoresFiltro.semestre || 0
          : 0,
      consideraHistorico: valoresFiltro.consideraHistorico,
      opcaoEstudanteId: valoresFiltro.opcaoEstudanteId || "",
      quantidadeBoletimPorPagina: valoresFiltro.quantidadeBoletimPorPagina,
      filtroEhValido: true,
      consideraInativo: valoresFiltro.imprimirEstudantesInativos,
    });
    setResumo({
      exibirHistorico: valoresFiltro.consideraHistorico ? "Sim" : "Não",
      anoLetivo: valoresFiltro.anoLetivo || "",
      dre: valoresFiltro.dreNome || "",
      ue: valoresFiltro.ueNome || "",
      modalidade: valoresFiltro.modalidadeNome || "",
      turma: valoresFiltro.turmaNome || "",
      estudantes:
        valoresFiltro.opcaoEstudanteId === OPCAO_SELECIONAR_ALUNOS
          ? "Selecionar Alunos"
          : "Todos",
      boletinsPorPagina: valoresFiltro.quantidadeBoletimPorPagina || "",
      imprimirInativos: valoresFiltro.imprimirEstudantesInativos ? "Sim" : "Não",
    });
    setItensSelecionados([]);
    setClicouBotaoGerar(false);
    setFiltrou(true);
  }, []);

  const voltarParaFiltros = useCallback(() => {
    setEtapa("filtros");
    setProgresso(0);
    setClicouBotaoGerar(false);
  }, []);

  const onClickCancelar = async () => {
    if (etapa === "gerando") {
      voltarParaFiltros();
      return;
    }
    if (!modoEdicao) return;
    const confirmou = await confirmar(
      "Atenção",
      "Deseja realmente cancelar as alterações?",
    );
    if (confirmou) {
      setCancelou(true);
      setModoEdicao(false);
    }
  };

  const onClickGerar = () => {
    const estudantes =
      filtro.opcaoEstudanteId === OPCAO_SELECIONAR_ALUNOS
        ? `${itensSelecionados.length} selecionado(s)`
        : resumo.estudantes || "Todos";
    setResumoExibido({ ...resumo, estudantes });
    setClicouBotaoGerar(true);
    setProgresso(0);
    setEtapa("gerando");
  };

  const baixarPdf = () => {
    if (!pdfUrl) return;
    const link = document.createElement("a");
    link.href = pdfUrl;
    link.download = nomeArquivoBoletim(resumoExibido.anoLetivo);
    link.click();
  };

  useEffect(() => {
    if (etapa !== "gerando") return;

    let ativo = true;
    const inicio = Date.now();
    const duracao = 2200;
    let quadro = 0;

    const concluirGeracao = async () => {
      try {
        const arquivo = await criarArquivoPdf(resumoExibido);
        if (!ativo) return;
        setPdfUrl(atualizarUrlPdf(arquivo));
        setEtapa("visualizacao");
      } catch {
        if (ativo) setEtapa("filtros");
      }
    };

    const animar = () => {
      const percentual = Math.min(100, ((Date.now() - inicio) / duracao) * 100);
      if (!ativo) return;
      setProgresso(percentual);
      if (percentual < 100) {
        quadro = requestAnimationFrame(animar);
        return;
      }

      void concluirGeracao();
    };

    quadro = requestAnimationFrame(animar);
    return () => {
      ativo = false;
      cancelAnimationFrame(quadro);
    };
  }, [etapa, resumoExibido]);

  useEffect(() => {
    const temSemestreOuNaoEja =
      (Number(filtro.modalidade) !== Modalidade.EJA &&
        Number(filtro.modalidade) !== Modalidade.CELP) ||
      Boolean(filtro.semestre);
    const ehInfantil = Number(filtro.modalidade) === Modalidade.INFANTIL;
    const temEstudanteSelecionados =
      selecionarAlunos && !itensSelecionados.length;

    setDesabilitarBotaoGerar(
      ehInfantil ||
        temEstudanteSelecionados ||
        !filtro.modalidade ||
        !filtro.turmaCodigo ||
        !filtro.opcaoEstudanteId ||
        !temSemestreOuNaoEja ||
        !filtro.quantidadeBoletimPorPagina ||
        clicouBotaoGerar,
    );
  }, [filtro, itensSelecionados, selecionarAlunos, clicouBotaoGerar, cancelou]);

  return (
    <AntdAppProvider>
      <div className="boletim-pagina">
        {Number(filtro.modalidade) === Modalidade.INFANTIL && (
          <Alert
            className="alerta-infantil"
            type="warning"
            showIcon
            message="Esta interface não está disponível para turmas da educação infantil"
          />
        )}

        <header className="boletim-cabecalho">
          <h1 className="boletim-titulo">
            Impressão de Boletim
            {urlAjuda && (
              <button
                type="button"
                className="boletim-ajuda"
                aria-label="Ajuda"
                onClick={() => window.open(urlAjuda, "_blank")}
              >
                <FontAwesomeIcon icon={faQuestionCircle} className="" />
              </button>
            )}
          </h1>
          <div className="boletim-acoes">
            <button
              type="button"
              id="SGP_BUTTON_VOLTAR"
              className="btn-acao btn-azul"
              title="Voltar"
              onClick={() => {
                if (etapa === "filtros") navigate("/");
                else voltarParaFiltros();
              }}
            >
              <FontAwesomeIcon icon={faArrowLeft} className="" />
            </button>
            {etapa === "visualizacao" ? (
              <button type="button" className="btn-acao btn-roxo" onClick={baixarPdf}>
                Baixar PDF
              </button>
            ) : (
              <>
                <button
                  type="button"
                  id="SGP_BUTTON_CANCELAR"
                  className="btn-acao btn-roxo"
                  disabled={etapa === "filtros" && !modoEdicao}
                  onClick={onClickCancelar}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  id="SGP_BUTTON_GERAR"
                  className="btn-acao btn-roxo"
                  disabled={
                    etapa === "gerando" || desabilitarBotaoGerar || !filtro.turmaCodigo
                  }
                  onClick={onClickGerar}
                >
                  Gerar
                </button>
              </>
            )}
          </div>
        </header>

        <div className={etapa === "filtros" ? undefined : "filtros-ocultos"}>
          <section className="boletim-card">
            <FiltroBoletim
              cancelou={cancelou}
              filtrou={filtrou}
              setFiltrou={setFiltrou}
              setCancelou={setCancelou}
              onFiltrar={onChangeFiltro}
              setModoEdicao={setModoEdicao}
            />
            {!!filtro.turmaCodigo && selecionarAlunos && (
              <ListaAlunos filtro={filtro} onSelecionar={onSelecionarItems} />
            )}
          </section>
        </div>

        {etapa === "gerando" && <GerandoBoletins progresso={progresso} />}
        {etapa === "visualizacao" && pdfUrl && (
          <VisualizacaoBoletim
            resumo={resumoExibido}
            pdfUrl={pdfUrl}
            nomeArquivo={nomeArquivoBoletim(resumoExibido.anoLetivo)}
          />
        )}
      </div>
    </AntdAppProvider>
  );
};

export default Boletim;
