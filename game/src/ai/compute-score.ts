import { GameState, CellState } from "../types";
import { GameBase } from "../game-base";

export function computeScore(
  game: GameBase,
  state: GameState,
  player: number,
): number {
  let valueOwned = 0;

  let countCell = (cell: CellState) => {
    if (!cell.cardId) {
      return;
    }

    let card = game.cardSpecs[cell.cardId];
    if (card.player == player && typeof card.value === "number") {
      valueOwned += card.value;
    }
  };

  for (const cell of state.board.cells) {
    countCell(cell);
  }

  return valueOwned;
}
