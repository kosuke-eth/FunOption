import Header from "../components/layout/Header";
import Body from "../components/layout/Body";
import History from "components/features/history";

// Removed OptionOrderHistoryProvider; using local OptionTradesProvider for history

export default function HistoryPage() {
  return (
    <div>
      <Header />
      <Body>
        <History />
      </Body>
    </div>
  );
}
