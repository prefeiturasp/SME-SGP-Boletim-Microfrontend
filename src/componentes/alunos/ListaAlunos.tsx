import { Table } from "antd";
import { useEffect, useState } from "react";
import { exibirErrosApi } from "../../core/config/alertas";
import {
  buscarAlunos,
  type AlunoBoletim,
  type DadosFiltroBoletim,
} from "../../services/boletimService";

interface ListaAlunosProps {
  filtro: DadosFiltroBoletim;
  onSelecionar: (codigos: string[]) => void;
}

const ListaAlunos = ({ filtro, onSelecionar }: ListaAlunosProps) => {
  const [carregando, setCarregando] = useState(false);
  const [linhas, setLinhas] = useState<AlunoBoletim[]>([]);
  const [selecionados, setSelecionados] = useState<string[]>([]);

  useEffect(() => {
    if (!filtro.filtroEhValido) return;

    let ativo = true;
    setSelecionados([]);
    onSelecionar([]);
    setCarregando(true);

    buscarAlunos(filtro)
      .then((items) => {
        if (!ativo) return;
        setLinhas(items);
      })
      .catch((error) => {
        if (!ativo) return;
        setLinhas([]);
        exibirErrosApi(error);
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });

    return () => {
      ativo = false;
    };
  }, [filtro, onSelecionar]);

  return (
    <div className="lista-alunos">
      <Table
        id="lista-alunos"
        rowKey="codigo"
        bordered
        size="middle"
        loading={carregando}
        pagination={false}
        locale={{ emptyText: "Sem dados" }}
        dataSource={linhas}
        rowSelection={{
          selectedRowKeys: selecionados,
          onChange: (chaves) => {
            const codigos = chaves.map(String);
            setSelecionados(codigos);
            onSelecionar(codigos);
          },
        }}
        columns={[
          { title: "Número", dataIndex: "numeroChamada" },
          { title: "Nome", dataIndex: "nome" },
        ]}
      />
    </div>
  );
};

export default ListaAlunos;
