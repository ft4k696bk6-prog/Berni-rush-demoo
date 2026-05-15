import Scene from "./Scene";
import HUD from "./HUD";
import MenuScreen from "./MenuScreen";
import "./game.css";

export default function Game() {
  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", background: "#050010" }}>
      <Scene />
      <HUD />
      <MenuScreen />
    </div>
  );
}
