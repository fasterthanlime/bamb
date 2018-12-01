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

  const { col, row } = move.placement;
  let card = game.cards[move.cardId];
  let underCard = game.stateGetCard(game.state, col, row);

  if (typeof card.value === "number") {
    if (underCard) {
      if (underCard.player != card.player) {
        console.log(`can't play over card of other player`);
        return state;
      }

      if (underCard.value < card.value) {
        console.log(`can only swap with lower-value card`);
        return state;
      }
    }

    // cool, let's try to place it!
    let previousState = state;
    {
      let state = game.stateAdvanceTurn(previousState);
      if (underCard) {
        // place under card back into deck
        state = game.stateTransformBoard(state, board =>
          game.boardSetCard(board, move.placement, undefined)
        );
        state = game.stateTransformDeck(state, move.player, deck =>
          game.deckAddCard(deck, underCard.id)
        );
      }

      // remove card from deck & place it on board
      state = game.stateTransformDeck(state, move.player, deck =>
        game.deckRemoveCard(deck, move.cardId)
      );
      state = game.stateTransformBoard(state, board =>
        game.boardSetCard(board, move.placement, move.cardId)
      );
      return state;
    }
  } else if (typeof card.value === "string") {
    console.log(`playing modifier card ${card.value}`);
    if (!underCard) {
    }
  }

  return state;
}
