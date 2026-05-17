import { lazy, Suspense } from "react";
import "./index.css";

const Game = lazy(() => import("./game/Game"));

function App() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#0d1f1b",
        color: "#f4f7ed",
        fontFamily: "Inter, system-ui, sans-serif",
        fontWeight: 800,
        letterSpacing: 0,
      }}>
        Berni Rush
      </div>
    }>
      <Game />
    </Suspense>
  );
}

export default App;
