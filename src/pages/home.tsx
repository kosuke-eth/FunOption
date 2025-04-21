import Header from "../components/layout/Header";
import Body from "../components/layout/Body";
import Home from "../components/features/home";

export default function HomePage() {
  return (
    <div>
      <Header />
      <Body>
        <Home />
      </Body>
    </div>
  );
}
