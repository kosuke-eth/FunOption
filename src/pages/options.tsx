import Header from "../components/layout/Header";
import Body from "../components/layout/Body";
import OptionsVisualization from "../components/OptionsVisualization/OptionsVisualization";

export default function OptionsPage() {
  return (
    <div>
      <Header />
      <Body>
        <OptionsVisualization />
      </Body>
    </div>
  );
}
