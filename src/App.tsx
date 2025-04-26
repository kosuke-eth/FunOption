import { Routes, Route, BrowserRouter } from "react-router-dom";
import HistoryPage from "pages/history";
import OptionsPage from "pages/options";
import { OptionsDataProvider } from "./providers/OptionsDataProvider";

function App() {
  return (
    <OptionsDataProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<OptionsPage />} />
          <Route path="/profile" element={<HistoryPage />} />
        </Routes>
      </BrowserRouter>
    </OptionsDataProvider>
  );
}

export default App;
