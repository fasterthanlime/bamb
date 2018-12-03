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
let trackPath = (path: string) => {
  return path.replace(/^\//, "");
};

let tutorialScript = (): GameScript => ({
  items: [
    {
      text: "Welcome to the tutorial!\nClick this box to continue.",
    },
    {
      text: "To begin, drag the 2 from your deck to the board",
      move: {
        value: 2,
        player: 0,
        placement: { col: 1, row: 1 },
      },
    },
    {
      text: "Good! You have a 2 on the board, so you have 2 points.",
    },
    {
      text: "Now it's the computer's turn. Click this box to continue.",
    },
    {
      move: {
        value: 5,
        player: 1,
        placement: { col: 2, row: 1 },
      },
    },
    {
      text: "The computer now has a higher score, but not for long...",
    },
    {
      text:
        "Whenever the cards in a row or column add up to 8,\nthey're all discarded.",
    },
    {
      text:
        "Let's use that to your advantage.\nPlay your 1 to bring the row total to 8.",
      move: {
        value: 1,
        player: 0,
        placement: { col: 0, row: 1 },
      },
    },
    {
      text:
        "The whole row has been cleared!\nYou both have 0 points, but the computer 'lost' 5 points,\nand you only lost 3.",
    },
    {
      move: {
        value: 2,
        player: 1,
        placement: { col: 2, row: 2 },
      },
    },
    {
      text: "You can get rid of that 2 immediately with your 6.",
    },
    {
      text: "Playing your 6 on that column will clear it.\nGo ahead, do it!",
      move: {
        value: 6,
        player: 0,
        placement: { col: 2, row: 1 },
      },
    },
    {
      text:
        "Good! However, that was a *bad* trade.\nYou sacrified 6 points to make the opponent lose 2.",
    },
    {
      text:
        "(Sorry, I'm just a tutorial)\nA rule of thumb: play low cards to eliminate high cards.",
    },
    {
      move: {
        value: 1,
        player: 1,
        placement: { col: 0, row: 0 },
      },
    },
    {
      text:
        "We don't want to use our 7 to get rid of that 1.\nLet's just play our 5 somewhere else.",
      move: {
        value: 5,
        player: 0,
        placement: { col: 3, row: 2 },
      },
    },
  ],
});

const gameSettings: GameSettings = {
  numCols: 4,
  numRows: 3,
  maxSum: 8,
  players: [
    { name: "red", kind: PlayerKind.AI },
    { name: "blue", kind: PlayerKind.Human },
    // { name: "blue", kind: PlayerKind.AI, aiType: "random" },
  ],
  script: tutorialScript(),
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
      alert("Drag cards to the ");
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
  // TODO: re-enable when Chrome 71 lands I guess ?
  // await buttonPromise;
  splash.parentNode.removeChild(splash);
  main();
});
