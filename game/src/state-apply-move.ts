import { GameState, Move } from "./types";
import { Game } from "./game";

export function stateApplyMove(
  game: Game,
  prevState: GameState,
  move: Move,
): GameState {
  // first, check that we're playing from the current player's hand
  let hasCard = false;
  const currentDeck = prevState.decks[prevState.currentPlayer];
  for (const dc of currentDeck.cells) {
    if (dc.cardId == move.cardId) {
      // yes, we are!
      hasCard = true;
      break;
    }
  }

  if (!hasCard) {
    console.error(
      `${move.cardId} is not in deck for player ${prevState.currentPlayer}`,
    );
    return prevState;
  }

  const { col, row } = move.placement;
  let card = game.cards[move.cardId];
  let underCard = game.boardGetCard(game.state.board, col, row);

  if (typeof card.value === "number") {
    if (underCard) {
      if (underCard.player != card.player) {
        console.error(`can't play over card of other player`);
        return prevState;
      }

      if (underCard.value < card.value) {
        console.error(`can only swap with lower-value card`);
        return prevState;
      }
    }

    // cool, let's try to place it!
    {
      let state = game.stateAdvanceTurn(prevState);
      if (underCard) {
        // place under card back into deck
        state = game.stateTransformBoard(state, board =>
          game.boardSetCard(board, move.placement, undefined),
        );
        state = game.stateTransformDeck(state, move.player, deck =>
          game.deckAddCard(deck, underCard.id),
        );
      }

      // remove card from deck & place it on board
      state = game.stateTransformDeck(state, move.player, deck =>
        game.deckRemoveCard(deck, move.cardId),
      );
      state = game.stateTransformBoard(state, board =>
        game.boardSetCard(board, move.placement, move.cardId),
      );
      return state;
    }
  } else if (typeof card.value === "string") {
    console.log(`playing modifier card ${card.value}`);
    if (!underCard) {
      console.error(`can't play modifier card on blank space`);
      return prevState;
    }

    let [dcol, drow] = dirToColRow(card.value);
    let [newCol, newRow] = [col + dcol, row + drow];
    if (newCol < 0) {
      console.error(`can't drop cards off left edge of board`);
      return prevState;
    }
    if (newCol >= game.numCols) {
      console.error(`can't drop cards off right edge of board`);
      return prevState;
    }
    if (newRow < 0) {
      console.error(`can't drop cards off top edge of board`);
      return prevState;
    }
    if (newRow >= game.numRows) {
      console.error(`can't drop cards off bottom edge of board`);
      return prevState;
    }

    console.log(`Would move from ${col},${row} to ${newCol},${newRow}`);

    {
      let state = game.stateAdvanceTurn(prevState);

      // remove card from deck & place it into trash
      state = game.stateTransformDeck(state, move.player, deck =>
        game.deckRemoveCard(deck, move.cardId),
      );
      state = game.stateTransformBoard(state, board =>
        game.boardTrashCard(board, move.cardId),
      );

      // perform a swaperoo!
      let neighborCard = game.boardGetCard(state.board, newCol, newRow);
      state = game.stateTransformBoard(state, board =>
        game.boardSetCard(
          board,
          move.placement,
          neighborCard ? neighborCard.id : null,
        ),
      );
      state = game.stateTransformBoard(state, board =>
        game.boardSetCard(board, { col: newCol, row: newRow }, underCard.id),
      );

      return state;
    }
  }

  return prevState;
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
