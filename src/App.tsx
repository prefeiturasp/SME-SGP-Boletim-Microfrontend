import { ConfigProvider } from "antd";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { createMockStore } from "./mocks/mockStore";
import Boletim from "./paginas/boletim/boletim";

const mockStore = createMockStore();

const App = () => (
  <Provider store={mockStore}>
    <ConfigProvider>
      <BrowserRouter>
        <Boletim />
      </BrowserRouter>
    </ConfigProvider>
  </Provider>
);

export default App;
