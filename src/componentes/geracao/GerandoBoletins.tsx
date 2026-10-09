interface GerandoBoletinsProps {
  progresso: number;
}

const GerandoBoletins = ({ progresso }: GerandoBoletinsProps) => (
  <section className="boletim-card gerando-card" aria-live="polite">
    <div className="gerando-conteudo">
      <div className="gerando-spinner" />
      <strong className="gerando-titulo">Gerando boletins...</strong>
      <progress className="gerando-barra" value={progresso} max={100}>
        {Math.round(progresso)}%
      </progress>
      <span className="gerando-dica">Isso pode levar alguns segundos.</span>
    </div>
  </section>
);

export default GerandoBoletins;
