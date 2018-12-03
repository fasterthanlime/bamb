import { BoardPlacement } from "./types";

export interface GameScript {
  items: ScriptItem[];
}

export interface ScriptItem {
  text?: string;
  move?: ScriptMove;
}

export interface ScriptMove {
  value: any;
  player: number;
  placement: BoardPlacement;
}
