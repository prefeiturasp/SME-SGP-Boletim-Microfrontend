import type { ResumoBoletim } from "../../mocks/boletimPdf";

interface VisualizacaoBoletimProps {
  resumo: ResumoBoletim;
  pdfUrl: string;
  nomeArquivo: string;
}

const ItemResumo = ({ rotulo, valor }: { rotulo: string; valor: string }) => (
  <span>
    <b>{rotulo}:</b> {valor || "-"}
  </span>
);

const VisualizacaoBoletim = ({ resumo, pdfUrl, nomeArquivo }: VisualizacaoBoletimProps) => (
  <section className="boletim-visualizacao">
    <div className="boletim-resumo">
      <div className="boletim-resumo-linha">
        <ItemResumo rotulo="Exibir histórico" valor={resumo.exibirHistorico} />
        <ItemResumo rotulo="Ano letivo" valor={resumo.anoLetivo} />
        <ItemResumo rotulo="DRE" valor={resumo.dre} />
        <ItemResumo rotulo="UE" valor={resumo.ue} />
        <ItemResumo rotulo="Modalidade" valor={resumo.modalidade} />
        <ItemResumo rotulo="Turma" valor={resumo.turma} />
      </div>
      <div className="boletim-resumo-linha">
        <ItemResumo rotulo="Estudantes" valor={resumo.estudantes} />
        <ItemResumo rotulo="Boletins por página" valor={resumo.boletinsPorPagina} />
        <ItemResumo rotulo="Imprimir estudantes inativos" valor={resumo.imprimirInativos} />
      </div>
    </div>
    <iframe className="boletim-pdf" src={pdfUrl} title={nomeArquivo} />
  </section>
);

export default VisualizacaoBoletim;
