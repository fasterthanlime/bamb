import { GameBase } from "../game-base";
import { GameState, Move } from "../types";
import { dirToColRow } from "./place-card";

export function canPlay(
  game: GameBase,
  prevState: GameState,
  move: Move,
): boolean {
  if (move.pass) {
    // let's just make sure the deck is emptyo
    return true;
  }

  const { col, row } = move.placement;
  let card = game.cardSpecs[move.cardId];
  let underCard = game.boardGetCard(prevState.board, col, row);

  if (typeof card.value === "number") {
    if (underCard) {
      if (underCard.player != card.player) {
        // can't play over card of other player
        return false;
      }

      if (underCard.value < card.value) {
        // can only swap with lower-value card
        return false;
      }
    }
  } else if (typeof card.value === "string") {
    if (!underCard) {
      // can't play modifier card on blank space
      return false;
    }

    let [dcol, drow] = dirToColRow(card.value);
    let [newCol, newRow] = [col + dcol, row + drow];
    if (newCol < 0) {
      // can't drop cards off left edge of board
      return false;
    }
    if (newCol >= game.numCols) {
      // can't drop cards off right edge of board
      return false;
    }
    if (newRow < 0) {
      // can't drop cards off top edge of board
      return false;
    }
    if (newRow >= game.numRows) {
      // can't drop cards off bottom edge of board
      return false;
    }
  }
  return true;
}
