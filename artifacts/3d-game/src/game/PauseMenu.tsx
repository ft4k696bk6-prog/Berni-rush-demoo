import { useEffect, useState } from "react";
import { BarChart3, Coins, Crosshair, Gauge, Play, Save, Settings, ShoppingBag, SlidersHorizontal, Smartphone, Swords, Trophy, X } from "lucide-react";
import { useGameStore } from "./useGameStore";
import { QualityLevel, STAT_LABELS, StatKey } from "./types";
import { SHOP_CATEGORIES, SHOP_UPGRADES, shopUpgradeCost, shopUpgradeLevel } from "./shop";
import { WEAPON_CONFIG, WEAPON_ORDER } from "./weapons";

type PauseTab = "stats" | "shop" | "records";

const STAT_ORDER: StatKey[] = ["strength", "superpower", "vitality", "luck", "dodge", "speed"];

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = Math.floor(totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export default function PauseMenu() {
  const [tab, setTab] = useState<PauseTab>("stats");
  const phase = useGameStore(s => s.phase);
  const resumeGame = useGameStore(s => s.resumeGame);
  const saveGame = useGameStore(s => s.saveGame);
  const exitToMenu = useGameStore(s => s.exitToMenu);
  const refreshRecords = useGameStore(s => s.refreshRecords);
  const buyWeapon = useGameStore(s => s.buyWeapon);
  const buyShopUpgrade = useGameStore(s => s.buyShopUpgrade);
  const equipWeapon = useGameStore(s => s.equipWeapon);
  const setQuality = useGameStore(s => s.setQuality);
  const score = useGameStore(s => s.score);
  const stage = useGameStore(s => s.stage);
  const playerLevel = useGameStore(s => s.playerLevel);
  const xp = useGameStore(s => s.xp);
  const xpToNext = useGameStore(s => s.xpToNext);
  const coins = useGameStore(s => s.coins);
  const coinsCollected = useGameStore(s => s.coinsCollected);
  const totalKills = useGameStore(s => s.totalKills);
  const gameTime = useGameStore(s => s.gameTime);
  const stats = useGameStore(s => s.stats);
  const ownedWeapons = useGameStore(s => s.ownedWeapons);
  const currentWeapon = useGameStore(s => s.currentWeapon);
  const shopUpgrades = useGameStore(s => s.shopUpgrades);
  const records = useGameStore(s => s.records);
  const quality = useGameStore(s => s.quality);
  const mobileLookSensitivity = useGameStore(s => s.mobileLookSensitivity);
  const mobileLookDeadzone = useGameStore(s => s.mobileLookDeadzone);
  const setMobileLookSensitivity = useGameStore(s => s.setMobileLookSensitivity);
  const setMobileLookDeadzone = useGameStore(s => s.setMobileLookDeadzone);

  useEffect(() => {
    if (phase === "paused") refreshRecords();
  }, [phase, refreshRecords]);

  if (phase !== "paused") return null;

  const qualityOptions: QualityLevel[] = ["low", "medium", "high"];

  return (
    <div className="pause-overlay">
      <div className="pause-shell">
        <header className="pause-header">
          <div>
            <span>PAUSED</span>
            <h2>BERNI RUSH</h2>
          </div>
          <button className="icon-button" type="button" onClick={resumeGame} aria-label="Resume">
            <X size={22} />
          </button>
        </header>

        <nav className="pause-actions">
          <button type="button" onClick={resumeGame}><Play size={18} /> Wznow</button>
          <button type="button" onClick={saveGame}><Save size={18} /> Zapisz</button>
          <button type="button" onClick={() => setTab("stats")} className={tab === "stats" ? "active" : ""}><BarChart3 size={18} /> Statystyki</button>
          <button type="button" onClick={() => setTab("shop")} className={tab === "shop" ? "active" : ""}><ShoppingBag size={18} /> Sklep</button>
          <button type="button" onClick={() => setTab("records")} className={tab === "records" ? "active" : ""}><Trophy size={18} /> Rekordy</button>
          <button type="button" onClick={exitToMenu}><X size={18} /> Wyjdz</button>
        </nav>

        <main className="pause-content">
          {tab === "stats" && (
            <section className="pause-panel stats-view">
              <div className="stat-cells">
                <div><span>Score</span><b>{score.toString().padStart(6, "0")}</b></div>
                <div><span>Level</span><b>{stage}</b></div>
                <div><span>Hero LVL</span><b>{playerLevel}</b></div>
                <div><span>XP</span><b>{xp}/{xpToNext}</b></div>
                <div><span>Kills</span><b>{totalKills}</b></div>
                <div><span>Coins</span><b>{coinsCollected}</b></div>
                <div><span>Time</span><b>{formatTime(gameTime)}</b></div>
                <div><span>Weapon</span><b>{WEAPON_CONFIG[currentWeapon].shortName}</b></div>
              </div>

              <div className="character-stats">
                {STAT_ORDER.map(stat => (
                  <div key={stat}>
                    <span>{STAT_LABELS[stat].label}</span>
                    <b>{stats[stat]}</b>
                    <small>{STAT_LABELS[stat].description}</small>
                  </div>
                ))}
              </div>
            </section>
          )}

          {tab === "shop" && (
            <section className="pause-panel shop-view">
              <div className="shop-balance"><Coins size={18} /> {coins} coins</div>
              <h3 className="shop-section-title">Weapons</h3>
              <div className="weapon-grid">
                {WEAPON_ORDER.map(id => {
                  const weapon = WEAPON_CONFIG[id];
                  const owned = ownedWeapons.includes(id);
                  const equipped = currentWeapon === id;
                  return (
                    <article key={id} className={equipped ? "weapon-card equipped" : "weapon-card"}>
                      <div className="weapon-card-head">
                        <Swords size={18} style={{ color: weapon.color }} />
                        <strong>{weapon.name}</strong>
                      </div>
                      <p>{weapon.description}</p>
                      <div className="weapon-stats">
                        <span>DMG {weapon.damage}</span>
                        <span>RATE {weapon.fireRate}</span>
                        <span>RANGE {weapon.range}</span>
                        <span>{weapon.special}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => owned ? equipWeapon(id) : buyWeapon(id)}
                        disabled={!owned && coins < weapon.price}
                      >
                        {equipped ? "Equipped" : owned ? "Equip" : `${weapon.price} coins`}
                      </button>
                    </article>
                  );
                })}
              </div>

              <h3 className="shop-section-title">Run Upgrades</h3>
              <div className="upgrade-shop">
                {SHOP_CATEGORIES.map(category => (
                  <section key={category} className="upgrade-category">
                    <h4>{category}</h4>
                    {Object.values(SHOP_UPGRADES).filter(item => item.category === category).map(item => {
                      const level = shopUpgradeLevel(shopUpgrades, item.id);
                      const capped = level >= item.maxLevel;
                      const cost = shopUpgradeCost(shopUpgrades, item.id);
                      return (
                        <article key={item.id} className="shop-upgrade-card" style={{ borderColor: `${item.color}55` }}>
                          <div>
                            <strong>{item.name}</strong>
                            <span>{item.maxLevel >= 90 ? "repeatable" : `LV ${level}/${item.maxLevel}`}</span>
                          </div>
                          <p>{item.description}</p>
                          <button type="button" onClick={() => buyShopUpgrade(item.id)} disabled={capped || coins < cost}>
                            {capped ? "MAX" : `${cost} coins`}
                          </button>
                        </article>
                      );
                    })}
                  </section>
                ))}
              </div>
            </section>
          )}

          {tab === "records" && (
            <section className="pause-panel records-view">
              <div className="record-row"><Trophy size={18} /><span>Best score</span><b>{records.bestScore.toString().padStart(6, "0")}</b></div>
              <div className="record-row"><Gauge size={18} /><span>Highest level</span><b>{records.highestStage}</b></div>
              <div className="record-row"><Gauge size={18} /><span>Highest hero LVL</span><b>{records.highestPlayerLevel}</b></div>
              <div className="record-row"><Swords size={18} /><span>Most kills</span><b>{records.mostKills}</b></div>
              <div className="record-row"><Coins size={18} /><span>Most coins</span><b>{records.mostCoins}</b></div>
              <div className="record-row"><BarChart3 size={18} /><span>Longest run</span><b>{formatTime(records.longestTime)}</b></div>
            </section>
          )}
        </main>

        <footer className="quality-row">
          <div className="quality-block">
            <span><Settings size={16} /> Quality</span>
            <div>
              {qualityOptions.map(option => (
                <button key={option} type="button" className={quality === option ? "active" : ""} onClick={() => setQuality(option)}>
                  {option.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="mobile-controls-block">
            <strong><Smartphone size={15} /> Mobile Aim</strong>
            <label>
              <span><Crosshair size={14} /> Look speed</span>
              <b>{mobileLookSensitivity.toFixed(2)}x</b>
            </label>
            <input
              type="range"
              min={0.35}
              max={1.35}
              step={0.05}
              value={mobileLookSensitivity}
              onChange={event => setMobileLookSensitivity(Number(event.currentTarget.value))}
              aria-label="Mobile look speed"
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
          </div>
        </footer>
      </div>
    </div>
  );
}
