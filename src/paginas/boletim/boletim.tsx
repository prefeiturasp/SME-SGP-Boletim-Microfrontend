import {
  faArrowLeft,
  faQuestionCircle,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { AntdAppProvider } from "../../core/config/antd-app-provider";
import { confirmar, erro, sucesso } from "../../core/config/alertas";
import {
  Modalidade,
  OPCAO_SELECIONAR_ALUNOS,
  ehEjaOuCelp,
  usaBoletimTempoReal,
} from "../../core/constantes";
import { definirTokenSgp } from "../../core/servico/apiSgp";
import { definirUrlApiBoletim, definirUrlApiSgp } from "../../config";
import ListaAlunos from "../../componentes/alunos/ListaAlunos";
import GerandoBoletins from "../../componentes/geracao/GerandoBoletins";
import VisualizacaoBoletim from "../../componentes/geracao/VisualizacaoBoletim";
import FiltroBoletim, {
  type ValoresFiltro,
} from "../../componentes/filtro/FiltroBoletim";
import {
  gerarPdfBoletim,
  imprimirBoletim,
  obterUltimaAtualizacao,
  type DadosFiltroBoletim,
} from "../../services/boletimService";
import {
  nomeArquivoBoletim,
  type ResumoBoletim,
} from "../../mocks/boletimPdf";
import type { RootState } from "../../types/redux";
import "./boletim.css";

type EtapaBoletim = "filtros" | "gerando" | "visualizacao";

const resumoVazio: ResumoBoletim = {
  anoLetivo: "",
  dre: "",
  ue: "",
  modalidade: "",
  semestre: "",
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
  boletimApiUrl?: string;
}

const MENSAGEM_FILA =
  "Solicitação de geração do relatório gerada com sucesso. Em breve você receberá uma notificação com o resultado.";

const substituirUrlPdf = (arquivo: Blob) => (urlAtual: string) => {
  if (urlAtual) URL.revokeObjectURL(urlAtual);
  return URL.createObjectURL(arquivo);
};

const Boletim = ({ apiUrl, boletimApiUrl }: BoletimProps) => {
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
  const [nomeArquivo, setNomeArquivo] = useState("");
  const [dataConsolidacao, setDataConsolidacao] = useState("");

  if (apiUrl) definirUrlApiSgp(apiUrl);
  if (boletimApiUrl) definirUrlApiBoletim(boletimApiUrl);
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
      anoLetivo: valoresFiltro.anoLetivo || "",
      dre: valoresFiltro.dreNome || "",
      ue: valoresFiltro.ueNome || "",
      modalidade: valoresFiltro.modalidadeNome || "",
      semestre: ehEjaOuCelp(valoresFiltro.modalidadeId)
        ? String(valoresFiltro.semestre || "")
        : "",
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
    setDataConsolidacao("");
  }, []);

  const onClickVoltar = () => {
    if (etapa === "filtros") navigate("/");
    else voltarParaFiltros();
  };

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

  const onClickGerar = async () => {
    const estudantes =
      filtro.opcaoEstudanteId === OPCAO_SELECIONAR_ALUNOS
        ? `${itensSelecionados.length} selecionado(s)`
        : resumo.estudantes || "Todos";
    const resumoAtual = { ...resumo, estudantes };
    setResumoExibido(resumoAtual);
    setClicouBotaoGerar(true);

    if (!usaBoletimTempoReal(filtro.anoLetivo)) {
      const resultado = await imprimirBoletim({
        ...filtro,
        alunosCodigo: itensSelecionados,
      });
      if ("erro" in resultado && resultado.erro) {
        erro("Não foi possível solicitar a impressão do Boletim");
        return;
      }
      sucesso(MENSAGEM_FILA);
      return;
    }

    setNomeArquivo(nomeArquivoBoletim(resumoAtual.anoLetivo));
    setProgresso(0);
    setEtapa("gerando");
  };

  const baixarPdf = () => {
    if (!pdfUrl) return;
    const link = document.createElement("a");
    link.href = pdfUrl;
    link.download = nomeArquivo || nomeArquivoBoletim(resumoExibido.anoLetivo);
    link.click();
  };

  useEffect(() => {
    if (etapa !== "gerando") return;

    let ativo = true;
    let quadro = 0;
    const inicio = Date.now();
    const controle = new AbortController();

    const animar = () => {
      if (!ativo) return;
      const decorrido = Date.now() - inicio;
      setProgresso(Math.min(90, (decorrido / 8000) * 90));
      quadro = requestAnimationFrame(animar);
    };

    const concluirGeracao = async () => {
      const [resultado, atualizacao] = await Promise.all([
        gerarPdfBoletim(filtro, itensSelecionados, controle.signal),
        obterUltimaAtualizacao(filtro, itensSelecionados, controle.signal),
      ]);
      if (!ativo || resultado.cancelado) return;

      if (resultado.erro || !resultado.arquivo) {
        erro(resultado.mensagem || "Não foi possível gerar o boletim.");
        setClicouBotaoGerar(false);
        setProgresso(0);
        setEtapa("filtros");
        return;
      }

      if (resultado.nomeArquivo) setNomeArquivo(resultado.nomeArquivo);
      setDataConsolidacao(atualizacao);
      setPdfUrl(substituirUrlPdf(resultado.arquivo));
      setProgresso(100);
      setEtapa("visualizacao");
    };

    quadro = requestAnimationFrame(animar);
    void concluirGeracao();

    return () => {
      ativo = false;
      controle.abort();
      cancelAnimationFrame(quadro);
    };
  }, [etapa, filtro, itensSelecionados]);

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
          <div
            id="alerta-modalidade-infantil"
            className="alert alert-warning alert-dismissible fade show text-center alerta-modalidade-infantil"
            role="alert"
          >
            <b>Esta interface não está disponível para turmas da educação infantil</b>
          </div>
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
              onClick={onClickVoltar}
            >
              <FontAwesomeIcon icon={faArrowLeft} className="" />
            </button>
            {etapa === "visualizacao" ? (
              <>
                <button
                  type="button"
                  id="SGP_BUTTON_ALTERAR_FILTROS"
                  className="btn-acao btn-roxo"
                  onClick={onClickVoltar}
                >
                  Alterar Filtros
                </button>
                <button type="button" className="btn-acao btn-roxo" onClick={baixarPdf}>
                  Baixar PDF
                </button>
              </>
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
            nomeArquivo={nomeArquivo || nomeArquivoBoletim(resumoExibido.anoLetivo)}
            dataConsolidacao={dataConsolidacao}
          />
        )}
      </div>
    </AntdAppProvider>
  );
};

export default Boletim;
