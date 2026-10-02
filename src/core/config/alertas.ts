import { Modal, notification } from "antd";
import { getAntdModal, getAntdNotification } from "./antd-static-api";

const exibirAlerta = (tipo: "success" | "error" | "warning", mensagem: string) => {
  const titulos = {
    success: "Sucesso",
    error: "Erro",
    warning: "Aviso",
  };

  const config = {
    message: titulos[tipo],
    description: mensagem,
    duration: 6,
    className: `alerta-${tipo === "success" ? "sucesso" : tipo === "error" ? "erro" : "aviso"}`,
  };

  const api = getAntdNotification();
  if (api?.[tipo]) {
    api[tipo](config);
    return;
  }

  notification[tipo](config);
};

export const sucesso = (mensagem: string) => exibirAlerta("success", mensagem);

export const erro = (mensagem: string) => exibirAlerta("error", mensagem);

export const exibirErrosApi = (falha: unknown) => {
  const resposta = falha as {
    response?: { data?: { mensagens?: string[] } };
  };
  const mensagens = resposta.response?.data?.mensagens;
  if (mensagens?.length) {
    mensagens.forEach((mensagem) => erro(mensagem));
    return;
  }
  erro("Ocorreu um erro interno.");
};

export const confirmar = (titulo: string, texto: string) => {
  return new Promise<boolean>((resolve) => {
    const config = {
      title: titulo,
      content: texto,
      okText: "Confirmar",
      cancelText: "Cancelar",
      onOk: () => resolve(true),
      onCancel: () => resolve(false),
    };

    const modalApi = getAntdModal();
    if (modalApi?.confirm) {
      modalApi.confirm(config);
      return;
    }

    Modal.confirm(config);
  });
};
