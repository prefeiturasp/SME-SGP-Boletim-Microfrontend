import { describe, expect, it } from "vitest";
import { Modalidade, ehEjaOuCelp, usaBoletimTempoReal } from "./constantes";

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

describe("usaBoletimTempoReal", () => {
  it("gera o PDF na hora a partir de 2026", () => {
    expect(usaBoletimTempoReal("2026")).toBe(true);
    expect(usaBoletimTempoReal(2027)).toBe(true);
  });

  it("mantem a fila para 2025 e anos anteriores", () => {
    expect(usaBoletimTempoReal("2025")).toBe(false);
    expect(usaBoletimTempoReal("2024")).toBe(false);
    expect(usaBoletimTempoReal("")).toBe(false);
    expect(usaBoletimTempoReal(undefined)).toBe(false);
  });
});
