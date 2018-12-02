import * as PIXI from "pixi.js";
import { Game, PlayerKind } from "./game";
import { layout } from "./layout";
import "./main.css";
import { step } from "./step";
import * as FontFaceObserver from "fontfaceobserver";

function main() {
  const app = new PIXI.Application({
    width: window.innerWidth,
    height: window.innerHeight,
    antialias: true,
  });
  app.renderer.backgroundColor = 0xfff1f1f1;

  let game = new Game(app, {
    numCols: 4,
    numRows: 4,
    maxSum: 7,
    players: [{ kind: PlayerKind.AI }, { kind: PlayerKind.Human }],
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

document.addEventListener("DOMContentLoaded", async () => {
  await new FontFaceObserver("Roboto").load();
  main();
});
