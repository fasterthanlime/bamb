import { GameBase } from "./game-base";
import { calculateBestMove } from "./ai/process";
import { WorkerOutgoingMessage } from "./types-worker";

// see https://developer.mozilla.org/en-US/docs/Web/API/DedicatedWorkerGlobalScope/postMessage
// we wouldn't need this workaround if we could have a separate typescript config just for
// the worker.
declare function postMessage(messagse: any);

onmessage = function(this: Window, ev: MessageEvent) {
  let data = ev.data;
  if (data.task === "processAI") {
    const game = new GameBase();
    game.fromMessage(data.gameMessage);
    let result = calculateBestMove(game, game.state);

    let msg: WorkerOutgoingMessage = {
      task: "processAI",
      result,
    };
    postMessage(msg);
  }
};
