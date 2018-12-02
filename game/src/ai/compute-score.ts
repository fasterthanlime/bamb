import { GameState } from "../types";
import { GameBase } from "../game-base";

export function computeScore(
  game: GameBase,
  state: GameState,
  player: number,
): number {
  // let tilesOwned = 0;
  let valueOwned = 0;

  for (const cell of state.board.cells) {
    if (!cell.cardId) {
      continue;
    }

    let card = game.cardSpecs[cell.cardId];
    if (card.player == player) {
      // tilesOwned++;
      valueOwned += card.value;
    }
  }

  // return tilesOwned + valueOwned / 100;
  return valueOwned;
}
