import { GameState } from "../types";

export interface GameSnapshot {
  text: string;
  state: GameState;
  millis: number;
}

export interface Consequences {
  clearedRow(row: number);
  clearedCol(col: number);
  lostCard(player: number);
  snapshot(step: GameSnapshot);
}

export class RecordingConsequences implements Consequences {
  rowsCleared: number[] = [];
  colsCleared: number[] = [];
  lostCards: number[] = [];
  snaps: GameSnapshot[] = [];

  constructor() {}

  clearedRow(row: number) {
    this.rowsCleared.push(row);
  }

  clearedCol(col: number) {
    this.colsCleared.push(col);
  }

  lostCard(player: number) {
    this.lostCards[player]++;
  }

  snapshot(snap: GameSnapshot) {
    this.snaps.push(snap);
  }
}

export class NullConsequences implements Consequences {
  clearedRow(row: number) {}
  clearedCol(col: number) {}
  lostCard(player: number) {}
  snapshot(snap: GameSnapshot) {}
}

export const nullConsequences = new NullConsequences();
