import { Routes, Route, BrowserRouter } from "react-router-dom";
import HistoryPage from "pages/history";
import OptionsPage from "pages/options";
import { OptionsDataProvider } from "./providers/OptionsDataProvider";
import { SnackbarProvider } from "components/SnackbarProvider";
import { OptionTradesProvider } from "providers/OptionTradesProvider";

function App() {
  return (
    <OptionsDataProvider>
      <SnackbarProvider>
        <OptionTradesProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<OptionsPage />} />
              <Route path="/profile" element={<HistoryPage />} />
            </Routes>
          </BrowserRouter>
        </OptionTradesProvider>
      </SnackbarProvider>
    </OptionsDataProvider>
  );
}

export default App;
