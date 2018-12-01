import { GameState, Move } from "./types";
import { Game } from "./game";

export function stateApplyMove(
  game: Game,
  state: GameState,
  move: Move
): GameState {
  // first, check that we're playing from the current player's hand
  let hasCard = false;
  const currentDeck = state.decks[state.currentPlayer];
  for (const dc of currentDeck.cells) {
    if (dc.cardId == move.cardId) {
      // yes, we are!
      hasCard = true;
      break;
    }
  }

  if (!hasCard) {
    console.error(
      `${move.cardId} is not in deck for player ${state.currentPlayer}`
    );
    return state;
  }

  // second, make sure the target is empty
  // {
  //   const { col, row } = move.placement;
  //   if (game.stateGetCard(state, col, row)) {
  //     console.error(`already has a card at ${col}, ${row}`);
  //     return state;
  //   }
  // }

  let previousState = state;
  {
    let state = game.stateAdvanceTurn(previousState);
    // remove card from deck
    state = game.stateTransformDeck(state, move.player, deck =>
      game.deckRemoveCard(deck, move.cardId)
    );
    // place card on board
    state = game.stateTransformBoard(state, board =>
      game.boardSetCard(board, move.placement, move.cardId)
    );
    return state;
  }
}
