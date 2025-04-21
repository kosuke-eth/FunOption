import { Routes, Route, BrowserRouter } from "react-router-dom";
import HomePage from "pages/home";
import HistoryPage from "pages/history";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/profile" element={<HistoryPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
