import { GameBaseMessage } from "./game-base";
import { ScoredMove } from "./ai/list-moves";
import { AIResult } from "./ai/process";

export interface WorkerIncomingMessage {
  task: "processAI";
  gameMessage: GameBaseMessage;
}

export interface WorkerOutgoingMessage {
  task: "processAI";
  result: AIResult;
}
