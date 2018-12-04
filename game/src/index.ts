import * as PIXI from "pixi.js";
import { Game, PlayerKind, GameSettings } from "./game";
import { layout } from "./layout";
import "./main.css";
import { step } from "./step";
import * as FontFaceObserver from "fontfaceobserver";
import * as howler from "howler";

import track1 from "./songs/track1.ogg";
import { Icon, fontFamily } from "./create-display-objects";
import { GameScript } from "./script";
import { tutorialScript } from "./tutorial";
import { makeMainUI } from "./main-ui";
let trackPath = (path: string) => {
  return path.replace(/^\//, "");
};

export interface AppState {
  settings: AppSettings;
  appUI: PIXI.Container;
  game: Game;
  startGame(gameSettings: GameSettings);
  saveSettings();
}

interface AppSettings {
  music: boolean;
}

let defaultAppSettings: AppSettings = {
  music: true,
};

function main() {
  let settings = { ...defaultAppSettings };
  let loadSettings = () => {
    let storedSettingsPayload = localStorage.getItem("settings");
    if (storedSettingsPayload) {
      try {
        let storedSettings: Partial<AppSettings>;
        storedSettings = JSON.parse(storedSettingsPayload);
        for (const k of Object.keys(storedSettings)) {
          settings[k] = storedSettings[k];
        }
      } catch (e) {
        console.error(`Could not load settings: `, e);
      }
    }
  };
  let saveSettings = () => {
    localStorage.setItem("settings", JSON.stringify(settings));
  };

  loadSettings();
  howler.Howler.mute(!settings.music);
  let bgm = new howler.Howl({
    src: [trackPath(track1)],
    loop: true,
    autoplay: true,
    volume: 0.6,
  });

  const app = new PIXI.Application({
    width: window.innerWidth,
    height: window.innerHeight,
    antialias: true,
  });
  app.renderer.backgroundColor = 0x36393f;

  let gameContainer = new PIXI.Container();
  app.stage.addChild(gameContainer);

  let appUI = new PIXI.Container();
  app.stage.addChild(appUI);

  let appState: AppState;
  let startGame = (gameSettings: GameSettings) => {
    if (appState.game) {
      let game = appState.game;
      if (!game.phase.gameOverPhase) {
        let hasEmptyDeckCells = false;
        for (const player of [0, 1]) {
          for (const c of game.state.decks[player].cells) {
            if (!c.cardId) {
              hasEmptyDeckCells = true;
              break;
            }
          }
        }
        if (hasEmptyDeckCells) {
          if (!window.confirm("Abandon current game and start a new one?")) {
            return;
          }
        }
      }
      appState.game.destroy();
    }
    appState.game = new Game(app, gameSettings);
    gameContainer.addChild(appState.game.container);
  };

  appState = {
    appUI,
    game: null,
    saveSettings,
    settings,
    startGame,
  };

  window.addEventListener("resize", () => {
    app.renderer.resize(window.innerWidth, window.innerHeight);
    if (appState.game) {
      layout(appState.game, true);
    }
  });

  PIXI.ticker.shared.autoStart = true;
  PIXI.ticker.shared.add((delta: number) => {
    if (appState.game) {
      step(appState.game, delta);
    }
  });

  document.body.appendChild(app.view);
  makeMainUI(appState);
  app.start();
}

document.addEventListener("DOMContentLoaded", async () => {
  const splash = document.querySelector(".splash");
  const buttonPromise = new Promise((resolve, reject) => {
    splash.querySelector("button").addEventListener("click", () => {
      resolve();
    });
  });

  await new FontFaceObserver("Roboto").load();
  await new FontFaceObserver("FontAwesome").load();
  // TODO: re-enable when Chrome 71 lands I guess ?
  // await buttonPromise;
  splash.parentNode.removeChild(splash);
  main();
});
