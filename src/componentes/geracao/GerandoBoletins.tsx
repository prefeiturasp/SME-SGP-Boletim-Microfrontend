interface GerandoBoletinsProps {
  progresso: number;
}

const GerandoBoletins = ({ progresso }: GerandoBoletinsProps) => (
  <section className="boletim-card gerando-card" aria-live="polite">
    <div className="gerando-conteudo">
      <div className="gerando-spinner" />
      <strong className="gerando-titulo">Gerando boletins...</strong>
      <div className="gerando-barra" role="progressbar" aria-valuenow={Math.round(progresso)} aria-valuemin={0} aria-valuemax={100}>
        <div className="gerando-barra-preenchimento" style={{ width: `${progresso}%` }} />
      </div>
      <span className="gerando-dica">Isso pode levar alguns segundos.</span>
    </div>
  </section>
);

export default GerandoBoletins;
