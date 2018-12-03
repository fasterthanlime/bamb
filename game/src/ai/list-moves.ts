import { GameBase } from "../game-base";
import { nullConsequences } from "../rules/consequences";
import { play } from "../rules/play";
import { GameState, Move } from "../types";
import { computeScore } from "./compute-score";

export function listMoves(
  game: GameBase,
  state: GameState,
  player: number,
): Move[] {
  let moves: Move[] = [];
  let deck = state.decks[player];

  // goes over all the deck cards
  for (let deckCard of deck.cells) {
    if (!deckCard.cardId) {
      continue;
    }
    let card = game.cardSpecs[deckCard.cardId];

    // checks the entire board to see if it can be placed
    for (let col = 0; col < game.numCols; col++) {
      for (let row = 0; row < game.numRows; row++) {
        let move = {
          cardId: card.id,
          player: state.currentPlayer,
          placement: { col, row },
        };

        // simulate playing this card
        let newState = play(game, state, move, nullConsequences);
        if (newState == state) {
          // not a legal move, keep searching
          continue;
        }

        moves.push(move);
      }
    }
  }

  return moves;
}
