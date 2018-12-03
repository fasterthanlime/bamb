import * as PIXI from "pixi.js";
import { Game, PlayerKind, GameSettings } from "./game";
import { layout } from "./layout";
import "./main.css";
import { step } from "./step";
import * as FontFaceObserver from "fontfaceobserver";
import * as howler from "howler";

import track1 from "./songs/track1.ogg";
import { Icon, fontFamily } from "./create-display-objects";
let trackPath = (path: string) => {
  return path.replace(/^\//, "");
};

const gameSettings: GameSettings = {
  numCols: 4,
  numRows: 3,
  maxSum: 8,
  players: [
    { name: "red", kind: PlayerKind.AI },
    { name: "blue", kind: PlayerKind.Human },
    // { name: "blue", kind: PlayerKind.AI, aiType: "random" },
  ],
};

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

  let buttonCaption: PIXI.Text;
  {
    buttonCaption = new PIXI.Text("", {
      fontFamily,
      fontSize: 22,
      fill: "white",
    });
    buttonCaption.position.set(20, 70);
    appUI.addChild(buttonCaption);
  }

  let muteIcon: PIXI.Text;
  let updateMuteIcon = () => {
    if (muteIcon && muteIcon.parent) {
      muteIcon.parent.removeChild(muteIcon);
    }
    muteIcon = new PIXI.Text(settings.music ? Icon.VolumeUp : Icon.VolumeMute, {
      fontFamily: "FontAwesome",
      fontSize: 34,
      fill: "white",
    });
    muteIcon.interactive = true;
    muteIcon.on("pointerover", () => {
      buttonCaption.text = settings.music ? "Disable sound" : "Enable sound";
      buttonCaption.position.x = muteIcon.position.x;
    });
    muteIcon.on("pointerout", () => {
      buttonCaption.text = "";
    });
    muteIcon.on("pointerup", () => {
      settings.music = !settings.music;
      saveSettings();
      howler.Howler.mute(!settings.music);
      updateMuteIcon();
    });
    muteIcon.position.set(20, 20);
    appUI.addChild(muteIcon);
  };
  updateMuteIcon();

  let newGameButton: PIXI.Text;
  {
    newGameButton = new PIXI.Text(Icon.PlusCircle, {
      fontFamily: "FontAwesome",
      fontSize: 34,
      fill: "white",
    });
    newGameButton.interactive = true;
    newGameButton.on("pointerover", () => {
      buttonCaption.text = "New game";
      buttonCaption.position.x = newGameButton.position.x;
    });
    newGameButton.on("pointerout", () => {
      buttonCaption.text = "";
    });
    newGameButton.on("pointerup", () => {
      if (!game.phase.gameOverPhase) {
        if (!window.confirm("Are you sure?")) {
          return;
        }
      }
      game.shouldRestart = true;
    });
    newGameButton.position.set(20 + 60, 20);
    appUI.addChild(newGameButton);
  }

  let ruleButton: PIXI.Text;
  {
    ruleButton = new PIXI.Text(Icon.Book, {
      fontFamily: "FontAwesome",
      fontSize: 34,
      fill: "white",
    });
    ruleButton.interactive = true;
    ruleButton.on("pointerover", () => {
      buttonCaption.text = "Rule book";
      buttonCaption.position.x = ruleButton.position.x;
    });
    ruleButton.on("pointerout", () => {
      buttonCaption.text = "";
    });
    ruleButton.on("pointerup", () => {
      alert("TODO");
    });
    ruleButton.position.set(20 + 60 + 60, 20);
    appUI.addChild(ruleButton);
  }

  let tutorialButton: PIXI.Text;
  {
    tutorialButton = new PIXI.Text(Icon.GraduationCap, {
      fontFamily: "FontAwesome",
      fontSize: 34,
      fill: "white",
    });
    tutorialButton.interactive = true;
    tutorialButton.on("pointerover", () => {
      buttonCaption.text = "Tutorial";
      buttonCaption.position.x = tutorialButton.position.x;
    });
    tutorialButton.on("pointerout", () => {
      buttonCaption.text = "";
    });
    tutorialButton.on("pointerup", () => {
      alert("TODO");
    });
    tutorialButton.position.set(20 + 60 + 60 + 60, 20);
    appUI.addChild(tutorialButton);
  }

  let game = new Game(app, gameSettings);
  gameContainer.addChild(game.container);

  window.addEventListener("resize", () => {
    app.renderer.resize(window.innerWidth, window.innerHeight);
    layout(game, true);
  });

  PIXI.ticker.shared.autoStart = true;
  PIXI.ticker.shared.add((delta: number) => {
    if (game.shouldRestart) {
      console.log("restarted");
      game.destroy();
      game = new Game(app, gameSettings);
      app.stage.addChild(game.container);
    }

    step(game, delta);
  });

  document.body.appendChild(app.view);
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
  await buttonPromise;
  splash.parentNode.removeChild(splash);
  main();
});
