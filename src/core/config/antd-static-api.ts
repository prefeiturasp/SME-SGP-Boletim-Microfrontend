type NotificacaoApi = {
  success: (config: {
    message: string;
    description: string;
    duration: number;
    className: string;
  }) => void;
  error: (config: {
    message: string;
    description: string;
    duration: number;
    className: string;
  }) => void;
  warning: (config: {
    message: string;
    description: string;
    duration: number;
    className: string;
  }) => void;
};

type ModalApi = {
  confirm: (config: {
    title: string;
    content: string;
    okText: string;
    cancelText: string;
    onOk: () => void;
    onCancel: () => void;
  }) => void;
};

let notificationApi: NotificacaoApi | null = null;
let modalApi: ModalApi | null = null;

export const setAntdNotification = (api: NotificacaoApi | null): void => {
  notificationApi = api;
};

export const getAntdNotification = () => notificationApi;

export const setAntdModal = (api: ModalApi | null): void => {
  modalApi = api;
};

export const getAntdModal = () => modalApi;
