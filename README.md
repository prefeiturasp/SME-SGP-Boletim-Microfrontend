# SME-SGP-Boletim-Microfrontend

Micro frontend da impressão de boletim, carregado pelo SGP via Module Federation na rota `/relatorios/diario-classe/boletim-simples`.

## Como rodar

```bash
npm install
npm run mf:dev
```

O `remoteEntry.js` fica em `http://localhost:5174/assets/remoteEntry.js`.

Copie `.env.example` para `.env` e preencha `VITE_SGP_API` com a mesma base do `REACT_APP_URL_API` do SGP. Dentro do SGP, a URL da API do host tem prioridade sobre essa variável.

## Module Federation

- Nome do remoto: `smeBoletim`
- Módulo exposto: `./Home` → tela de impressão de boletim
- Dependências compartilhadas com o SGP: `react`, `react-dom`, `react-redux`, `redux`, `@reduxjs/toolkit`, `react-router-dom`, `antd`

O token autenticado vem do Redux do SGP (`usuario.token`) e segue nas chamadas como `Authorization: Bearer`, no mesmo padrão da sondagem ao consultar a API do SGP.
