import * as PIXI from "pixi.js";
import { Game, PlayerKind } from "./game";
import { layout } from "./layout";
import "./main.css";
import { step } from "./step";
import * as FontFaceObserver from "fontfaceobserver";
import { WorkerOutgoingMessage } from "./types";

function main() {
  const app = new PIXI.Application({
    width: window.innerWidth,
    height: window.innerHeight,
    antialias: true,
  });
  app.renderer.backgroundColor = 0xfff1f1f1;

  const worker = new Worker("worker.js");
  let game = new Game(app, worker, {
    numCols: 4,
    numRows: 4,
    maxSum: 7,
    players: [
      { name: "red", kind: PlayerKind.AI },
      { name: "blue", kind: PlayerKind.Human },
    ],
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

  worker.onmessage = function(this: Worker, ev: MessageEvent) {
    let msg = ev.data as WorkerOutgoingMessage;

    if (msg.task === "processAI") {
      console.warn(`Got processAI response!`);
      let { move } = msg;
      if (move) {
        game.applyMove(move.move);
      } else {
        console.log(`AI could not find move, passing`);
        game.pass();
      }
    } else {
      console.log(`Got message from worker: `, ev);
    }
  };
}

document.addEventListener("DOMContentLoaded", async () => {
  await new FontFaceObserver("Roboto").load();
  main();
});
