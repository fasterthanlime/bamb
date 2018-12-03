import * as PIXI from "pixi.js";
import { Game, PlayerKind, GameSettings } from "./game";
import { layout } from "./layout";
import "./main.css";
import { step } from "./step";
import * as FontFaceObserver from "fontfaceobserver";
import * as howler from "howler";
import track1 from "./songs/track1.ogg";

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

console.log("track 1: ", track1);

function main() {
  const bgm = new howler.Howl({
    src: [track1],
    loop: true,
    autoplay: true,
  });

  const app = new PIXI.Application({
    width: window.innerWidth,
    height: window.innerHeight,
    antialias: true,
  });
  app.renderer.backgroundColor = 0x36393f;

  let game = new Game(app, gameSettings);

  app.stage.addChild(game.container);

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
