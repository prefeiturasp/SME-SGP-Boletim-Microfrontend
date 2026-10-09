import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SelectCampo from "./SelectCampo";

vi.mock("antd", () => ({
  Spin: ({ children }: { children: React.ReactNode }) => children,
  Select: ({
    id,
    value,
    options,
    onChange,
  }: {
    id: string;
    value?: string;
    options: { value: string; label: string }[];
    onChange: (value?: string) => void;
  }) => (
    <select
      id={id}
      value={value || ""}
      onChange={(event) => onChange(event.target.value || undefined)}
    >
      <option value="">Selecione</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
}));

describe("SelectCampo", () => {
  it("exibe as opcoes e comunica a selecao", () => {
    const onChange = vi.fn();
    render(
      <SelectCampo
        id="campo"
        label="Campo"
        opcoes={[{ valor: "1", texto: "Primeira" }]}
        placeholder="Selecione"
        onChange={onChange}
      />,
    );

    fireEvent.change(screen.getByLabelText("Campo"), {
      target: { value: "1" },
    });

    expect(screen.getByRole("option", { name: "Primeira" })).toBeTruthy();
    expect(onChange).toHaveBeenCalledWith("1");
  });

  it("comunica valor vazio ao limpar a selecao", () => {
    const onChange = vi.fn();
    render(
      <SelectCampo
        id="campo"
        label="Campo"
        opcoes={[{ valor: "1", texto: "Primeira" }]}
        valor="1"
        placeholder="Selecione"
        onChange={onChange}
      />,
    );

    fireEvent.change(screen.getByLabelText("Campo"), {
      target: { value: "" },
    });

    expect(onChange).toHaveBeenCalledWith("");
  });
});
