import * as PIXI from "pixi.js";
import { Game } from "./game";
import { layout } from "./layout";
import "./main.css";
import { step } from "./step";

function main() {
  const app = new PIXI.Application({
    width: window.innerWidth,
    height: window.innerHeight,
    antialias: true,
  });
  app.renderer.backgroundColor = 0xfff1f1f1;

  let game = new Game(app, {
    numCols: 3,
    numRows: 3,
    maxSum: 7,
  });

  app.stage.addChild(game.container);

  window.addEventListener("resize", () => {
    app.renderer.resize(window.innerWidth, window.innerHeight);
    layout(game, true);
  });

  PIXI.ticker.shared.autoStart = true;
  PIXI.ticker.shared.add((delta: number) => {
    step(game, delta);
  });

  document.body.appendChild(app.view);
  app.start();
}

document.addEventListener("DOMContentLoaded", () => {
  main();
});
