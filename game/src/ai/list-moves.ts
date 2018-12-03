import { GameBase } from "../game-base";
import { GameState, Move } from "../types";
import * as cloneDeep from "clone-deep";
import { canPlay } from "../rules/can-play";

export function listMoves(
  game: GameBase,
  state: GameState,
  player: number,
): Move[] {
  let moves: Move[] = [];
  let deck = state.decks[player];

  let move: Move = {
    cardId: 0,
    player: state.currentPlayer,
    placement: { col: 0, row: 0 },
  };

  // goes over all the deck cards
  for (let deckCard of deck.cells) {
    if (!deckCard.cardId) {
      continue;
    }
    let card = game.cardSpecs[deckCard.cardId];
    move.cardId = card.id;

    // checks the entire board to see if it can be placed
    for (let col = 0; col < game.numCols; col++) {
      for (let row = 0; row < game.numRows; row++) {
        move.placement.col = col;
        move.placement.row = row;

        // simulate playing this card
        if (canPlay(game, state, move)) {
          moves.push(cloneDeep(move));
        }
      }
    }
  }

  return moves;
}
