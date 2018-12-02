import { Game } from "../game";
import { GameState } from "../types";

export function computeScore(
  game: Game,
  state: GameState,
  player: number,
): number {
  let tilesOwned = 0;
  let valueOwned = 0;

  for (const cell of state.board.cells) {
    if (!cell.cardId) {
      continue;
    }

    let card = game.cards[cell.cardId];
    if (card.player == player) {
      tilesOwned++;
      valueOwned += card.value;
    }
  }

  return tilesOwned + valueOwned / 100;
}
