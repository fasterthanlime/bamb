import * as FontFaceObserver from "fontfaceobserver";
import * as howler from "howler";
import * as PIXI from "pixi.js";
import { Game, GameSettings } from "./game";
import { layout } from "./layout";
import { backgroundColor, makeMainUI } from "./main-ui";
import "./main.css";
import track1 from "./songs/track1.ogg";
import { step } from "./step";

let trackPath = (path: string) => {
  return path.replace(/^\//, "");
};

export enum AppPhase {
  MainMenu = "main-menu",
  Game = "game",
  Pause = "pause",
  GameOver = "game-over",
  Credits = "credits",
}

export interface GameResults {
  scores: number[];
}

export interface AppState {
  phase: AppPhase;
  settings: AppSettings;
  appUI: PIXI.Container;
  game: Game;
  startGame(gameSettings: GameSettings);
  endGame();
  setPhase(phase: AppPhase);
  saveSettings();
  pixiApp: PIXI.Application;
  results?: GameResults;
}

interface AppSettings {
  music: boolean;
  playedTutorial: boolean;
  allTimeWins: number;
  allTimeLosses: number;
}

let defaultAppSettings: AppSettings = {
  music: false,
  playedTutorial: false,
  allTimeWins: 0,
  allTimeLosses: 0,
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
  app.renderer.backgroundColor = backgroundColor;

  let gameContainer = new PIXI.Container();
  app.stage.addChild(gameContainer);

  let appUI = new PIXI.Container();
  app.stage.addChild(appUI);

  let confirmGame = () => {
    let game = appState.game;
    if (game && !game.phase.gameOverPhase) {
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
        if (
          !window.confirm("Are you sure you want to abandon your current game?")
        ) {
          return false;
        }
      }
    }
    return true;
  };

  let appState: AppState;
  let endGame = () => {
    if (appState.game) {
      if (confirmGame()) {
        appState.game.destroy();
        appState.game = null;
        appState.setPhase(AppPhase.MainMenu);
      } else {
        appState.setPhase(AppPhase.Game);
      }
    }
  };
  let startGame = (gameSettings: GameSettings) => {
    endGame();
    appState.game = new Game(app, gameSettings);
    appState.results = null;
    appState.game.onGameOver = gr => {
      if (gr.scores[1] > gr.scores[0]) {
        settings.allTimeWins++;
      } else if (gr.scores[1] < gr.scores[0]) {
        settings.allTimeLosses++;
      }
      appState.saveSettings();

      appState.results = gr;
      appState.setPhase(AppPhase.GameOver);
    };
    gameContainer.addChild(appState.game.container);
    appState.setPhase(AppPhase.Game);
    makeMainUI(appState);
  };

  appState = {
    appUI,
    game: null,
    saveSettings,
    settings,
    startGame,
    endGame,
    pixiApp: app,
    phase: AppPhase.MainMenu,
    setPhase: (phase: AppPhase) => {
      appState.phase = phase;
      makeMainUI(appState);
    },
  };

  window.addEventListener("resize", () => {
    app.renderer.resize(window.innerWidth, window.innerHeight);
    if (appState.game) {
      layout(appState.game, true);
    }
    makeMainUI(appState);
  });

  PIXI.ticker.shared.autoStart = true;
  PIXI.ticker.shared.add((delta: number) => {
    if (appState.phase === AppPhase.Game && appState.game) {
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
