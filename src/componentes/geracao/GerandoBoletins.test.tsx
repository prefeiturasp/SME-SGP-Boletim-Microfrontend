import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import GerandoBoletins from "./GerandoBoletins";

describe("GerandoBoletins", () => {
  it("indica a busca dos dados sem percentual", () => {
    const html = renderToStaticMarkup(
      createElement(GerandoBoletins, { fase: "buscando-dados", progresso: 0 }),
    );

    expect(html).toContain("Buscando dados dos boletins...");
    expect(html).toContain('<progress class="gerando-barra gerando-barra-indeterminada"');
    expect(html).not.toContain('value="');
  });

  it("representa o progresso da geração do PDF", () => {
    const html = renderToStaticMarkup(
      createElement(GerandoBoletins, { fase: "gerando-pdf", progresso: 42 }),
    );

    expect(html).toContain("Gerando arquivo PDF...");
    expect(html).toContain('<progress class="gerando-barra" value="42" max="100">');
    expect(html).toContain("42%");
  });
});
