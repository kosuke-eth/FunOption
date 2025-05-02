import Header from "../components/layout/Header";
import Body from "../components/layout/Body";
import History from "components/features/history";
import { OptionOrderHistoryProvider } from "providers/OptionOrderHistoryProvider";

export default function HistoryPage() {
  return (
    <div>
      <Header />
      <Body>
        <OptionOrderHistoryProvider>
          <History />
        </OptionOrderHistoryProvider>
      </Body>
    </div>
  );
}
