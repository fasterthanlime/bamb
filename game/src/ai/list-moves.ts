import { Move, GameState } from "../types";
import { Game } from "../game";
import { stateApplyMove } from "../state-apply-move";
import { computeScore } from "./compute-score";

export interface ScoredMove {
  move: Move;
  score: number;
}

export function listMoves(
  game: Game,
  state: GameState,
  player: number,
): ScoredMove[] {
  let moves: ScoredMove[] = [];
  let deck = state.decks[player];

  // goes over all the deck cards
  for (let deckCard of deck.cells) {
    if (!deckCard.cardId) {
      continue;
    }
    let card = game.cards[deckCard.cardId];

    // checks the entire board to see if it can be placed
    for (let col = 0; col < game.numCols; col++) {
      for (let row = 0; row < game.numRows; row++) {
        let move = {
          cardId: card.id,
          player: state.currentPlayer,
          placement: { col, row },
        };

        // simulate playing this card
        let newState = stateApplyMove(game, state, move);
        if (newState == state) {
          // not a legal move, keep searching
          continue;
        }

        moves.push({
          move,
          score: computeScore(game, newState, player),
        });
      }
    }
  }

  return moves;
}
