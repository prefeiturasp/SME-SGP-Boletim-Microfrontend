interface GerandoBoletinsProps {
  fase: "buscando-dados" | "gerando-pdf";
  progresso: number;
}

const GerandoBoletins = ({ fase, progresso }: GerandoBoletinsProps) => (
  <section className="boletim-card gerando-card" aria-live="polite">
    <div className="gerando-conteudo">
      <div className="gerando-spinner" aria-hidden="true" />
      {fase === "buscando-dados" ? (
        <>
          <strong className="gerando-titulo">Buscando dados dos boletins...</strong>
          <progress
            className="gerando-barra gerando-barra-indeterminada"
            aria-label="Buscando dados dos boletins"
          />
          <span className="gerando-dica">Consultando as informações dos estudantes.</span>
        </>
      ) : (
        <>
          <strong className="gerando-titulo">Gerando arquivo PDF...</strong>
          <progress className="gerando-barra" value={progresso} max={100}>
            {Math.round(progresso)}%
          </progress>
          <span className="gerando-dica">Isso pode levar alguns segundos.</span>
        </>
      )}
    </div>
  </section>
);

export default GerandoBoletins;
