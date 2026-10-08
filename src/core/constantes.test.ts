import { describe, expect, it } from "vitest";
import { Modalidade, ehEjaOuCelp } from "./constantes";

describe("ehEjaOuCelp", () => {
  it("identifica modalidades com semestre", () => {
    expect(ehEjaOuCelp(String(Modalidade.EJA))).toBe(true);
    expect(ehEjaOuCelp(String(Modalidade.CELP))).toBe(true);
  });

  it("rejeita modalidades sem semestre", () => {
    expect(ehEjaOuCelp(String(Modalidade.MEDIO))).toBe(false);
    expect(ehEjaOuCelp(undefined)).toBe(false);
  });
});
