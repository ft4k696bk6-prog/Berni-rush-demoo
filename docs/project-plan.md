# Project Plan: Berni Rush

## English

### Project Goal

I built a browser-based 3D arena action game that runs in the browser and demonstrates real gameplay systems: class selection, combat, enemy waves, progression, upgrades, skins, saves, and mobile-friendly controls.

### Problem and Users

I planned this project around players who want a quick survival-action loop without installation. From a portfolio perspective, the goal is to show engineering beyond static UI: real-time state, 3D rendering, input handling, balancing, asset management, persistence, and performance decisions.

### Functional Scope

I planned the project scope around:

- Real-time 3D arena gameplay in the browser.
- Playable classes such as Knight, Ranger, Mage, Assassin, Tank, and Miner.
- Enemy waves with scaling health, speed, damage, rewards, elite enemies, and boss encounters.
- Combat systems including melee attacks, projectiles, dash moves, power attacks, enemy projectiles, pickups, and floating combat text.
- Player progression with coins, records, selected class, selected skin, unlocks, permanent upgrades, run perks, and weapon choices.
- Save data persisted in the browser.
- Touch and keyboard controls.
- Mobile rendering quality adjustments for smoother play.
- Portfolio-ready deployment on Vercel.

### Architecture and Technical Decisions

- I chose React and TypeScript for UI and application structure.
- I chose Three.js through `@react-three/fiber` and `@react-three/drei` for 3D rendering.
- I chose Zustand for game state so combat, progression, UI, and save data can be managed outside individual scene components.
- I separated gameplay rules, balancing values, UI, save logic, and 3D scene concerns to keep the game extendable.
- I used asset folders for characters, enemies, and environments, including licensed/CC0 assets where appropriate.
- I adapted render quality for mobile-like devices to keep the game playable across hardware.
- I kept the game as a deployable web artifact inside a workspace structure.

### Delivery Phases

1. Game foundation: workspace, Vite artifact, React scene setup, Three.js rendering, and basic arena.
2. Player loop: class selection, movement, camera, health, attacks, dash, and run state.
3. Combat systems: melee/projectile rules, hit detection, enemy attacks, pickups, rewards, and combat feedback.
4. Enemy and wave design: enemy types, scaling, elite units, boss encounters, spawning safety, and balancing.
5. Progression: coins, records, skins, unlocks, permanent upgrades, run perks, weapons, and save persistence.
6. Mobile and readability pass: touch controls, aim joystick feel, projectile readability, enemy model clarity, and render cost reduction.
7. Deployment and portfolio polish: README, live demo, tester coin code, and final stabilization.

### What Has Been Delivered

In the repository I delivered a playable 3D browser game prototype with the core loop, class system, enemies, upgrades, saves, assets, mobile control work, and Vercel deployment. The later commits cover improvements around terrain and horizon visuals, mobile aim feel, render stutter, projectile readability, enemy models, tester economy tools, and portfolio documentation.

### Acceptance Criteria

- Player can choose a class and start a run.
- Movement and combat work with keyboard and touch controls.
- Enemy waves spawn and scale over time.
- Player can deal and receive damage, collect rewards, and complete or lose runs.
- Coins, records, selected class/skin, and unlocks persist between sessions.
- Upgrade, perk, weapon, and skin systems affect gameplay or progression.
- The game remains readable during combat, including projectiles, enemies, impact effects, and UI.
- The deployed build runs in a browser without local setup.

### Testing and Verification

- Run `pnpm run typecheck` to verify workspace TypeScript.
- Run `pnpm --filter @workspace/3d-game run build` to verify the deployed game build.
- Manually test class selection, movement, attacks, dashing, projectiles, enemy waves, bosses, pickups, upgrades, skins, and save persistence.
- Test desktop keyboard controls and mobile/touch controls.
- Verify the game scene is not blank, assets load correctly, and the player can complete the first combat loop.
- Check performance/readability on a mobile-sized viewport.

### What This Project Shows

This project shows interactive systems engineering: real-time game state, 3D rendering, controls, progression, balancing, persistence, and performance tradeoffs. It shows that I can structure a complex browser experience where UI, simulation, and assets all need to work together.

### Future Improvements

- Add sound design and music.
- Add more enemy behaviors and arena variety.
- Add a first-time onboarding/tutorial pass.
- Add stronger automated tests around pure combat and balance functions.
- Add leaderboard or shareable run summaries.

---

## Polski

### Cel projektu

Zbudowałem przeglądarkową grę 3D typu arena action, która działa bez instalacji i pokazuje realne systemy gameplayowe: wybór klasy, walkę, fale przeciwników, progres, ulepszenia, skiny, zapisy i sterowanie mobilne.

### Problem i użytkownicy

Projekt zaplanowałem dla graczy, którzy chcą szybkiej pętli survival-action w przeglądarce. Z perspektywy portfolio celem jest pokazanie inżynierii wykraczającej poza statyczny UI: stan w czasie rzeczywistym, renderowanie 3D, obsługa wejścia, balans, assety, persistencja i decyzje wydajnościowe.

### Zakres funkcjonalny

Zakres projektu rozpisałem na:

- Rozgrywkę 3D w czasie rzeczywistym w przeglądarce.
- Grywalne klasy: Knight, Ranger, Mage, Assassin, Tank i Miner.
- Fale przeciwników ze skalowaniem życia, prędkości, obrażeń, nagród, elit i bossów.
- System walki: melee, pociski, dash, power attacks, pociski przeciwników, pickupy i floating combat text.
- Progres gracza: monety, rekordy, wybrana klasa, wybrany skin, odblokowania, stałe ulepszenia, perki runu i wybór broni.
- Dane zapisywane w przeglądarce.
- Sterowanie dotykowe i klawiaturą.
- Dostosowanie jakości renderowania dla urządzeń mobilnych.
- Wdrożenie portfolio na Vercel.

### Architektura i decyzje techniczne

- React i TypeScript dla UI oraz struktury aplikacji.
- Three.js przez `@react-three/fiber` i `@react-three/drei` do renderowania 3D.
- Zustand jako stan gry, żeby walka, progres, UI i zapisy nie były zamknięte w pojedynczych komponentach sceny.
- Rozdzielenie reguł gry, balansu, UI, zapisów i sceny 3D, żeby projekt dało się rozwijać bez przepisywania całości.
- Foldery assetów dla postaci, przeciwników i środowiska, razem z licencjami/assetami CC0 tam, gdzie to potrzebne.
- Dostosowanie jakości renderowania na urządzeniach mobilnych, żeby gra była grywalna na różnym sprzęcie.
- Gra jako deployowalny web artifact w strukturze workspace.

### Etapy realizacji

1. Fundament gry: workspace, artifact Vite, scena React/Three.js i podstawowa arena.
2. Pętla gracza: wybór klasy, ruch, kamera, zdrowie, ataki, dash i stan runu.
3. Walka: melee/pociski, hit detection, ataki przeciwników, pickupy, nagrody i feedback.
4. Przeciwnicy i fale: typy przeciwników, skalowanie, elity, bossowie, bezpieczne spawnowanie i balans.
5. Progres: monety, rekordy, skiny, odblokowania, stałe ulepszenia, perki, bronie i zapis.
6. Mobile/readability pass: sterowanie dotykowe, aim joystick, czytelność pocisków, modele przeciwników i koszt renderowania.
7. Deployment i portfolio polish: README, live demo, tester coin code i finalna stabilizacja.

### Co zostało zrobione

W repozytorium dowiozłem grywalny prototyp gry 3D w przeglądarce z główną pętlą, klasami, przeciwnikami, ulepszeniami, zapisami, assetami, pracą nad sterowaniem mobilnym i deploymentem Vercel. Późniejsze commity obejmują poprawę terenu i horyzontu, aim joysticka, render stutter, czytelności pocisków, modeli przeciwników, narzędzi ekonomii testowej i dokumentacji portfolio.

### Kryteria akceptacji

- Gracz może wybrać klasę i rozpocząć run.
- Ruch i walka działają na klawiaturze i sterowaniu dotykowym.
- Fale przeciwników spawnują się i skalują w czasie.
- Gracz może zadawać i otrzymywać obrażenia, zbierać nagrody oraz wygrać/przegrać run.
- Monety, rekordy, wybrana klasa/skin i odblokowania zostają między sesjami.
- Ulepszenia, perki, bronie i skiny wpływają na gameplay lub progres.
- Walka pozostaje czytelna: pociski, przeciwnicy, efekty trafienia i UI.
- Wdrożona wersja działa w przeglądarce bez lokalnej konfiguracji.

### Testowanie i weryfikacja

- Uruchomić `pnpm run typecheck`, żeby sprawdzić TypeScript w workspace.
- Uruchomić `pnpm --filter @workspace/3d-game run build`, żeby sprawdzić build gry.
- Ręcznie sprawdzić wybór klasy, ruch, ataki, dash, pociski, fale, bossów, pickupy, ulepszenia, skiny i zapis.
- Przetestować sterowanie desktopowe i mobile/touch.
- Zweryfikować, że scena nie jest pusta, assety się ładują i gracz może przejść pierwszą pętlę walki.
- Sprawdzić wydajność i czytelność na mobilnym rozmiarze ekranu.

### Co pokazuje ten projekt

Tym projektem pokazuję inżynierię systemów interaktywnych: stan gry w czasie rzeczywistym, renderowanie 3D, sterowanie, progres, balans, persistencję i kompromisy wydajnościowe. Pokazuje umiejętność ułożenia złożonego doświadczenia w przeglądarce, gdzie UI, symulacja i assety muszą działać razem.

### Możliwe dalsze kroki

- Dodać efekty dźwiękowe i muzykę.
- Rozbudować zachowania przeciwników i różnorodność aren.
- Dodać onboarding/tutorial dla pierwszego uruchomienia.
- Dodać testy automatyczne czystych funkcji walki i balansu.
- Dodać leaderboard albo udostępniane podsumowania runów.
