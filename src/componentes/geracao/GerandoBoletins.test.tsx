import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import GerandoBoletins from "./GerandoBoletins";

describe("GerandoBoletins", () => {
  it("representa o andamento com um elemento de progresso acessivel", () => {
    const html = renderToStaticMarkup(
      createElement(GerandoBoletins, { progresso: 42 }),
    );

    expect(html).toContain('<progress class="gerando-barra" value="42" max="100">');
    expect(html).toContain("42%");
  });
});
