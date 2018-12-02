import { GameBase } from "./game-base";
import { calculateBestMove } from "./ai/process";
import { WorkerOutgoingMessage } from "./types";

onmessage = function(this: Window, ev: MessageEvent) {
  let data = ev.data;
  if (data.task === "processAI") {
    const game = new GameBase();
    game.fromMessage(data.gameMessage);
    let move = calculateBestMove(game, game.state);

    let msg: WorkerOutgoingMessage = {
      task: "processAI",
      move,
    };
    this.postMessage(msg, null);
  }
};
