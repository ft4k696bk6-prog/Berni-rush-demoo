import { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import {
  Coins,
  Crosshair,
  Gauge,
  Hand,
  Pickaxe,
  Play,
  RotateCcw,
  Save,
  Settings,
  Shield,
  ShieldPlus,
  ShoppingBag,
  Skull,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  Swords,
  Trophy,
  Zap,
} from "lucide-react";
import { CharacterAssetModel } from "./AssetModels";
import {
  CLASS_DEFINITIONS,
  CLASS_ORDER,
  SKIN_DEFINITIONS,
  SKIN_ORDER,
  formatSkinBonus,
  skinFitsClass,
} from "./loadout";
import { useGameStore } from "./useGameStore";
import { hasSavedGame } from "./saveSystem";
import { QualityLevel, SkinId } from "./types";

type MenuView = "home" | "class" | "skins" | "upgrades" | "settings";
type SkinFilter = "available" | "locked";

function ClassIcon({ icon, size = 20 }: { icon: string; size?: number }) {
  if (icon === "crosshair") return <Crosshair size={size} />;
  if (icon === "sparkles") return <Sparkles size={size} />;
  if (icon === "dagger") return <Zap size={size} />;
  if (icon === "shield-plus") return <ShieldPlus size={size} />;
  if (icon === "pickaxe") return <Pickaxe size={size} />;
  if (icon === "coins") return <Coins size={size} />;
  if (icon === "swords") return <Swords size={size} />;
  if (icon === "gauge") return <Gauge size={size} />;
  return <Shield size={size} />;
}

function SkinPreview({ skinId }: { skinId: SkinId }) {
  return (
    <div className="skin-preview">
      <Canvas dpr={[1, 1.35]} camera={{ position: [0, 1.0, 7.2], fov: 34 }} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={1.1} />
        <directionalLight position={[3, 5, 4]} intensity={2.2} />
        <pointLight position={[-2, 2, 3]} intensity={1.8} color="#7dfcff" />
        <Suspense fallback={null}>
          <CharacterAssetModel skinId={skinId} preview rotatePreview />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default function MenuScreen() {
  const phase = useGameStore(s => s.phase);
  const score = useGameStore(s => s.score);
  const stage = useGameStore(s => s.stage);
  const totalKills = useGameStore(s => s.totalKills);
  const coinsCollected = useGameStore(s => s.coinsCollected);
  const bossesDefeated = useGameStore(s => s.bossesDefeated);
  const walletCoins = useGameStore(s => s.walletCoins);
  const records = useGameStore(s => s.records);
  const selectedClassId = useGameStore(s => s.selectedClassId);
  const selectedSkinId = useGameStore(s => s.selectedSkinId);
  const unlockedSkinIds = useGameStore(s => s.unlockedSkinIds);
  const quality = useGameStore(s => s.quality);
  const mobileLookSensitivity = useGameStore(s => s.mobileLookSensitivity);
  const mobileLookDeadzone = useGameStore(s => s.mobileLookDeadzone);
  const mobileLeftHanded = useGameStore(s => s.mobileLeftHanded);
  const startGame = useGameStore(s => s.startGame);
  const restartGame = useGameStore(s => s.restartGame);
  const loadGame = useGameStore(s => s.loadGame);
  const selectClass = useGameStore(s => s.selectClass);
  const selectSkin = useGameStore(s => s.selectSkin);
  const buySkin = useGameStore(s => s.buySkin);
  const setQuality = useGameStore(s => s.setQuality);
  const setMobileLookSensitivity = useGameStore(s => s.setMobileLookSensitivity);
  const setMobileLookDeadzone = useGameStore(s => s.setMobileLookDeadzone);
  const setMobileLeftHanded = useGameStore(s => s.setMobileLeftHanded);
  const [view, setView] = useState<MenuView>("home");
  const [skinFilter, setSkinFilter] = useState<SkinFilter>("available");
  const [hasSave, setHasSave] = useState(false);
  const [previewSkinId, setPreviewSkinId] = useState(selectedSkinId);

  useEffect(() => {
    setHasSave(hasSavedGame());
    if (phase === "gameover") setView("home");
  }, [phase]);

  useEffect(() => {
    setPreviewSkinId(selectedSkinId);
  }, [selectedSkinId]);

  if (phase === "playing" || phase === "paused" || phase === "upgrade") return null;

  const isGameOver = phase === "gameover";
  const selectedClass = CLASS_DEFINITIONS[selectedClassId];
  const selectedSkin = SKIN_DEFINITIONS[selectedSkinId];
  const compatibleSkinIds = SKIN_ORDER.filter(id => skinFitsClass(id, selectedClassId));
  const compatibleAvailableSkinIds = compatibleSkinIds.filter(id => unlockedSkinIds.includes(id));
  const compatibleLockedSkinIds = compatibleSkinIds.filter(id => !unlockedSkinIds.includes(id));
  const visibleSkinIds = skinFilter === "available" ? compatibleAvailableSkinIds : compatibleLockedSkinIds;
  const fallbackPreviewSkinId = compatibleSkinIds.includes(previewSkinId)
    ? previewSkinId
    : compatibleAvailableSkinIds[0] ?? compatibleLockedSkinIds[0] ?? selectedSkinId;
  const previewSkin = SKIN_DEFINITIONS[fallbackPreviewSkinId] ?? selectedSkin;
  const qualityOptions: QualityLevel[] = ["low", "medium", "high"];
  const newRecord = isGameOver && score > 0 && score >= records.bestScore;

  return (
    <div className="menu-screen">
      <div className="menu-stage loadout-menu">
        <header className="menu-header">
          <div className="title-block">
            <h1 className="brand-title"><span>Berni</span><em>Rush</em></h1>
          </div>
          <div className="profile-balance">
            <Coins size={18} />
            <strong>{walletCoins}</strong>
            <span>bank coins</span>
          </div>
        </header>

        {isGameOver && (
          <section className="death-summary">
            <div>
              <strong>GAME OVER</strong>
              {newRecord && <span>NEW RECORD</span>}
            </div>
            <div className="death-grid">
              <p><Trophy size={16} /> Wave <b>{stage}</b></p>
              <p><Skull size={16} /> Kills <b>{totalKills}</b></p>
              <p><Coins size={16} /> Run coins <b>{coinsCollected}</b></p>
              <p><Shield size={16} /> Bosses <b>{bossesDefeated}</b></p>
              <p><Gauge size={16} /> Score <b>{score.toString().padStart(6, "0")}</b></p>
              <p><Trophy size={16} /> Best <b>{records.bestScore.toString().padStart(6, "0")}</b></p>
            </div>
          </section>
        )}

        <nav className="menu-tabs">
          <button type="button" className={view === "home" ? "active" : ""} onClick={() => setView("home")}><Play size={18} /> Play</button>
          <button type="button" className={view === "class" ? "active" : ""} onClick={() => setView("class")}><Shield size={18} /> Class</button>
          <button type="button" className={view === "skins" ? "active" : ""} onClick={() => setView("skins")}><ShoppingBag size={18} /> Character</button>
          <button type="button" className={view === "upgrades" ? "active" : ""} onClick={() => setView("upgrades")}><Trophy size={18} /> Upgrades</button>
          <button type="button" className={view === "settings" ? "active" : ""} onClick={() => setView("settings")}><Settings size={18} /> Settings</button>
        </nav>

        {view === "home" && (
          <main className="menu-home">
            <section className="loadout-current">
              <div>
                <ClassIcon icon={selectedClass.icon} size={24} />
                <span>Class</span>
                <strong style={{ color: selectedClass.color }}>{selectedClass.displayName}</strong>
                <small>{selectedClass.description}</small>
              </div>
              <div>
                <ClassIcon icon={selectedSkin.icon} size={24} />
                <span>Skin</span>
                <strong>{selectedSkin.displayName}</strong>
                <small>{formatSkinBonus(selectedSkin)}</small>
              </div>
            </section>

            <div className="menu-actions">
              <button type="button" onClick={isGameOver ? restartGame : startGame}>
                {isGameOver ? <RotateCcw size={20} /> : <Play size={20} />}
                {isGameOver ? "PLAY AGAIN" : "PLAY"}
              </button>
              {hasSave && !isGameOver && (
                <button type="button" onClick={loadGame}>
                  <Save size={20} />
                  CONTINUE
                </button>
              )}
            </div>
          </main>
        )}

        {view === "class" && (
          <main className="class-select-view">
            <div className="class-grid">
              {CLASS_ORDER.map(id => {
                const klass = CLASS_DEFINITIONS[id];
                const selected = selectedClassId === id;
                return (
                  <button
                    type="button"
                    key={id}
                    className={selected ? "class-card selected" : "class-card"}
                    onClick={() => selectClass(id)}
                    style={{ borderColor: selected ? klass.color : undefined }}
                  >
                    <i style={{ color: klass.color }}><ClassIcon icon={klass.icon} size={24} /></i>
                    <strong>{klass.displayName}</strong>
                    <span>{klass.description}</span>
                    <b>{klass.attackType.replaceAll("_", " ")}</b>
                  </button>
                );
              })}
            </div>
          </main>
        )}

        {view === "skins" && (
          <main className="skin-select-view">
            <section className="skin-shop-section">
              <header className="skin-shop-header">
                <div>
                  <span>Compatible with</span>
                  <strong style={{ color: selectedClass.color }}>{selectedClass.displayName}</strong>
                </div>
                <nav className="skin-filter-tabs">
                  <button type="button" className={skinFilter === "available" ? "active" : ""} onClick={() => setSkinFilter("available")}>
                    Available <b>{compatibleAvailableSkinIds.length}</b>
                  </button>
                  <button type="button" className={skinFilter === "locked" ? "active" : ""} onClick={() => setSkinFilter("locked")}>
                    Locked <b>{compatibleLockedSkinIds.length}</b>
                  </button>
                </nav>
              </header>

              <div className="skin-shop-grid">
              {visibleSkinIds.map(id => {
                const skin = SKIN_DEFINITIONS[id];
                const unlocked = unlockedSkinIds.includes(id);
                const equipped = selectedSkinId === id;
                return (
                  <article
                    key={id}
                    className={`skin-card ${equipped ? "equipped" : ""} ${!unlocked ? "locked" : ""}`}
                    onPointerEnter={() => setPreviewSkinId(id)}
                    onClick={() => setPreviewSkinId(id)}
                  >
                    <div>
                      <ClassIcon icon={skin.icon} size={18} />
                      <strong>{skin.displayName}</strong>
                    </div>
                    <span>{skin.rarity} - {formatSkinBonus(skin)}</span>
                    <small>{unlocked ? "Ready for this class" : "Unlock for this class"}</small>
                    <button
                      type="button"
                      disabled={!unlocked && walletCoins < skin.unlockCost}
                      onClick={() => unlocked ? selectSkin(id) : buySkin(id)}
                    >
                      {equipped ? "Equipped" : unlocked ? "Equip" : `${skin.unlockCost} coins`}
                    </button>
                  </article>
                );
              })}
              </div>
              {visibleSkinIds.length === 0 && (
                <div className="skin-empty-state">
                  <strong>{skinFilter === "available" ? "No available skins yet" : "Everything compatible is unlocked"}</strong>
                  <span>{skinFilter === "available" ? "Switch to Locked to buy a new look for this class." : "Pick from Available and jump into the run."}</span>
                </div>
              )}
            </section>
            <aside className="skin-preview-panel">
              <SkinPreview skinId={previewSkin.id} />
              <strong>{previewSkin.displayName}</strong>
              <span>{previewSkin.compatibleClasses.join(" / ")}</span>
            </aside>
          </main>
        )}

        {view === "upgrades" && (
          <main className="progress-view">
            <div><Trophy size={20} /><span>Best score</span><b>{records.bestScore.toString().padStart(6, "0")}</b></div>
            <div><Gauge size={20} /><span>Highest wave</span><b>{records.highestStage}</b></div>
            <div><Skull size={20} /><span>Most kills</span><b>{records.mostKills}</b></div>
            <div><Coins size={20} /><span>Most coins in run</span><b>{records.mostCoins}</b></div>
            <div><Shield size={20} /><span>Boss record</span><b>{records.mostBossesDefeated}</b></div>
            <div><ShoppingBag size={20} /><span>Unlocked skins</span><b>{unlockedSkinIds.length}/{SKIN_ORDER.length}</b></div>
          </main>
        )}

        {view === "settings" && (
          <main className="settings-view">
            <section>
              <span>Effects quality</span>
              <div className="quality-pills">
                {qualityOptions.map(option => (
                  <button key={option} type="button" className={quality === option ? "active" : ""} onClick={() => setQuality(option)}>
                    {option.toUpperCase()}
                  </button>
                ))}
              </div>
            </section>
            <section className="mobile-controls-block mobile-settings-card">
              <strong><Smartphone size={15} /> Mobile controls</strong>
              <p>Recommended for arena combat: landscape orientation, left thumb to move, right thumb to aim and fire.</p>
              <label>
                <span><Crosshair size={14} /> Aim speed</span>
                <b>{mobileLookSensitivity.toFixed(2)}x</b>
              </label>
              <input
                type="range"
                min={0.35}
                max={1.35}
                step={0.05}
                value={mobileLookSensitivity}
                onChange={event => setMobileLookSensitivity(Number(event.currentTarget.value))}
                aria-label="Mobile aim speed"
              />
              <label>
                <span><SlidersHorizontal size={14} /> Deadzone</span>
                <b>{Math.round(mobileLookDeadzone * 100)}%</b>
              </label>
              <input
                type="range"
                min={0.05}
                max={0.28}
                step={0.01}
                value={mobileLookDeadzone}
                onChange={event => setMobileLookDeadzone(Number(event.currentTarget.value))}
                aria-label="Mobile aim deadzone"
              />
              <button type="button" className={mobileLeftHanded ? "active" : ""} onClick={() => setMobileLeftHanded(!mobileLeftHanded)}>
                <Hand size={14} /> {mobileLeftHanded ? "Left-handed layout" : "Right-handed layout"}
              </button>
            </section>
          </main>
        )}
      </div>
    </div>
  );
}
