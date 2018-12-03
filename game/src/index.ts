import * as PIXI from "pixi.js";
import { Game, PlayerKind } from "./game";
import { layout } from "./layout";
import "./main.css";
import { step } from "./step";
import * as FontFaceObserver from "fontfaceobserver";
import { WorkerOutgoingMessage } from "./types-worker";

const gameSettings = {
  numCols: 4,
  numRows: 3,
  maxSum: 10,
  players: [
    { name: "red", kind: PlayerKind.AI },
    { name: "blue", kind: PlayerKind.Human },
  ],
};

function main() {
  const app = new PIXI.Application({
    width: window.innerWidth,
    height: window.innerHeight,
    antialias: true,
  });
  // app.renderer.backgroundColor = 0xfff1f1f1;
  app.renderer.backgroundColor = 0x36393f;

  const worker = new Worker("worker.js");
  let game = new Game(app, worker, gameSettings);

  app.stage.addChild(game.container);

  window.addEventListener("resize", () => {
    app.renderer.resize(window.innerWidth, window.innerHeight);
    layout(game, true);
  });

  PIXI.ticker.shared.autoStart = true;
  PIXI.ticker.shared.add((delta: number) => {
    if (game.shouldRestart) {
      console.log("restarted");
      app.stage.removeChild(game.container);
      game = new Game(app, worker, gameSettings);
      app.stage.addChild(game.container);
    }

    step(game, delta);
  });

  document.body.appendChild(app.view);
  app.start();

  worker.onmessage = function(this: Worker, ev: MessageEvent) {
    let msg = ev.data as WorkerOutgoingMessage;

    if (msg.task === "processAI") {
      console.warn(`Got processAI response!`);
      let { result } = msg;
      if (result.move) {
        game.applyMove(result.move.move);
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
  await new FontFaceObserver("FontAwesome").load();
  main();
});
