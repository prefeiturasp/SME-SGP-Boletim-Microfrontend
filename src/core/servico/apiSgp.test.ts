import { describe, expect, it } from "vitest";
import { serializarParams } from "./apiSgp";

describe("serializarParams", () => {
  it("serializa valores primitivos e ignora valores vazios", () => {
    const resultado = serializarParams({
      texto: "valor",
      numero: 10,
      ativo: false,
      vazio: "",
      nulo: null,
      ausente: undefined,
    });

    expect(resultado).toBe("texto=valor&numero=10&ativo=false");
  });

  it("repete a chave para itens de uma lista", () => {
    expect(serializarParams({ codigos: [1, 2, ""] })).toBe(
      "codigos=1&codigos=2",
    );
  });

  it("serializa objetos como JSON", () => {
    expect(serializarParams({ filtro: { ano: 2026 } })).toBe(
      "filtro=%7B%22ano%22%3A2026%7D",
    );
  });
});
