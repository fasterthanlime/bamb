import { BoardState, GameState, Card } from "./types";

export let emptyBoard = (cols: number, rows: number) => {
  let bs: BoardState = {
    cells: [],
    trashedCardIds: [],
  };
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      bs.cells.push({});
    }
  }
  return bs;
};
