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
        console.error(`can't play over card of other player`);
        return state;
      }

      if (underCard.value < card.value) {
        console.error(`can only swap with lower-value card`);
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
      console.error(`can't play modifier card on blank space`);
      return state;
    }

    let [dcol, drow] = dirToColRow(card.value);
    let [newCol, newRow] = [col + dcol, row + drow];
    if (newCol < 0) {
      console.error(`can't drop cards off left edge of board`);
      return state;
    }
    if (newCol >= game.numCols) {
      console.error(`can't drop cards off right edge of board`);
      return state;
    }
    if (newRow < 0) {
      console.error(`can't drop cards off top edge of board`);
      return state;
    }
    if (newRow >= game.numRows) {
      console.error(`can't drop cards off bottom edge of board`);
      return state;
    }

    console.log(`Would move from ${col},${row} to ${newCol},${newRow}`);

    let previousState = state;
    {
      let state = game.stateAdvanceTurn(previousState);

      // remove card from deck & place it into trash
      state = game.stateTransformDeck(state, move.player, deck =>
        game.deckRemoveCard(deck, move.cardId)
      );
      state = game.stateTransformBoard(state, board =>
        game.boardTrashCard(board, move.cardId)
      );
      return state;
    }
  }

  return state;
}

function dirToColRow(value: string): number[] {
  switch (value) {
    case "L":
      return [-1, 0];
    case "R":
      return [1, 0];
    case "U":
      return [0, -1];
    case "D":
      return [0, 1];
    default:
      throw new Error(`dirToColRow called on non-dir ${value}`);
  }
}
