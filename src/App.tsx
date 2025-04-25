import { Routes, Route, BrowserRouter } from "react-router-dom";
import HomePage from "pages/home";
import HistoryPage from "pages/history";
import OptionsPage from "pages/options";
import { OptionsDataProvider } from "./providers/OptionsDataProvider";

function App() {
  return (
    <OptionsDataProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/profile" element={<HistoryPage />} />
          <Route path="/options" element={<OptionsPage />} />
        </Routes>
      </BrowserRouter>
    </OptionsDataProvider>
  );
}

export default App;
