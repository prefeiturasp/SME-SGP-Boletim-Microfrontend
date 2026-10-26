import { Tooltip } from "antd";
import type { ResumoBoletim } from "../../mocks/boletimPdf";

interface VisualizacaoBoletimProps {
  resumo: ResumoBoletim;
  pdfUrl: string;
  nomeArquivo: string;
  dataConsolidacao?: string;
}

const MENSAGEM_CONSOLIDACAO =
  "Os dados do boletim são atualizados na sincronização da manhã. Lançamentos realizados hoje serão atualizados e exibidos no boletim amanhã.";

const ItemResumo = ({ rotulo, valor }: { rotulo: string; valor: string }) => (
  <span className="boletim-resumo-item">
    <b>{rotulo}:</b> {valor || "-"}
  </span>
);

const textoSemestre = (valor: string) =>
  /^[12]$/.test(valor.trim()) ? `${valor.trim()}º semestre` : valor;

const VisualizacaoBoletim = ({
  resumo,
  pdfUrl,
  nomeArquivo,
  dataConsolidacao,
}: VisualizacaoBoletimProps) => (
  <section className="boletim-visualizacao">
    <div className="boletim-resumo">
      <div className="boletim-resumo-filtros">
        <h2 className="boletim-resumo-titulo">Filtros selecionados:</h2>
        <div className="boletim-resumo-linha">
          <ItemResumo rotulo="Ano letivo" valor={resumo.anoLetivo} />
          <ItemResumo rotulo="DRE" valor={resumo.dre} />
          <ItemResumo rotulo="UE" valor={resumo.ue} />
        </div>
        <div className="boletim-resumo-linha">
          <ItemResumo rotulo="Modalidade" valor={resumo.modalidade} />
          {resumo.semestre ? (
            <ItemResumo rotulo="Semestre" valor={textoSemestre(resumo.semestre)} />
          ) : null}
          <ItemResumo rotulo="Turma" valor={resumo.turma} />
        </div>
        <div className="boletim-resumo-linha">
          <ItemResumo rotulo="Boletins por página" valor={resumo.boletinsPorPagina} />
          <ItemResumo
            rotulo="Imprimir estudantes inativos"
            valor={resumo.imprimirInativos}
          />
        </div>
      </div>
      <div className="boletim-consolidacao">
        <span className="boletim-consolidacao-chip">
          <span>Dados consolidados em: {dataConsolidacao || "-"}</span>
          <Tooltip
            title={MENSAGEM_CONSOLIDACAO}
            placement="bottomRight"
            trigger={["hover", "focus"]}
            mouseEnterDelay={0}
            overlayInnerStyle={{ maxWidth: 340 }}
          >
            <button
              type="button"
              className="boletim-consolidacao-info"
              aria-label="Informações sobre a atualização dos dados do boletim"
            >
              i
            </button>
          </Tooltip>
        </span>
      </div>
    </div>
    <iframe className="boletim-pdf" src={pdfUrl} title={nomeArquivo} />
  </section>
);

export default VisualizacaoBoletim;
