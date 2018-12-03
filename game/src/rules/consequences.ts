import { GameState } from "../types";

export interface GameSnapshot {
  state: GameState;
  millis: number;
  clearedRow?: {
    row: number;
  };
  clearedCol?: {
    col: number;
  };
}

export interface Consequences {
  clearedRow(row: number);
  clearedCol(col: number);
  snapshot(f: () => GameSnapshot);
}

export class RecordingConsequences implements Consequences {
  rowsCleared: number[] = [];
  colsCleared: number[] = [];
  snaps: GameSnapshot[] = [];

  constructor() {}

  clearedRow(row: number) {
    this.rowsCleared.push(row);
  }

  clearedCol(col: number) {
    this.colsCleared.push(col);
  }

  snapshot(f: () => GameSnapshot) {
    this.snaps.push(f());
  }
}

export class NullConsequences implements Consequences {
  clearedRow(row: number) {}
  clearedCol(col: number) {}
  snapshot(f: () => GameSnapshot) {}
}

export const nullConsequences = new NullConsequences();
