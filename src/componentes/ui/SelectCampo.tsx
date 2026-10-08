import { Select, Spin } from "antd";

export interface OpcaoSelect {
  valor: string;
  texto: string;
}

interface SelectCampoProps {
  id: string;
  label: string;
  opcoes: OpcaoSelect[];
  valor?: string;
  onChange: (valor: string) => void;
  disabled?: boolean;
  placeholder: string;
  carregando?: boolean;
  showSearch?: boolean;
  allowClear?: boolean;
}

const SelectCampo = ({
  id,
  label,
  opcoes,
  valor,
  onChange,
  disabled,
  placeholder,
  carregando,
  showSearch,
  allowClear = false,
}: SelectCampoProps) => {
  return (
    <div className="campo">
      <label className="campo-label" htmlFor={id}>
        {label}
      </label>
      <Spin spinning={!!carregando} size="small" wrapperClassName="campo-spin">
        <Select
          id={id}
          className="campo-select"
          value={valor || undefined}
          placeholder={placeholder}
          disabled={disabled}
          showSearch={showSearch}
          allowClear={allowClear}
          notFoundContent="Sem dados"
          optionFilterProp="label"
          onChange={(valorSelecionado) => onChange(valorSelecionado || "")}
          options={opcoes.map((item) => ({
            value: String(item.valor),
            label: item.texto,
          }))}
        />
      </Spin>
    </div>
  );
};

export default SelectCampo;
