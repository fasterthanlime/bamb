import { GameState, Move } from "../types";
import { Game } from "../game";
import { Consequences } from "./consequences";
import { GameBase } from "../game-base";

export function placeCard(
  game: GameBase,
  prevState: GameState,
  move: Move,
  cons: Consequences,
): GameState {
  if (move.pass) {
    return { ...prevState };
  }

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
  let card = game.cardSpecs[move.cardId];
  let underCard = game.boardGetCard(game.state.board, col, row);

  if (typeof card.value === "number") {
    if (underCard) {
      if (underCard.player != card.player) {
        // can't play over card of other player
        return prevState;
      }

      if (underCard.value < card.value) {
        // can only swap with lower-value card
        return prevState;
      }
    }

    // cool, let's try to place it!
    {
      let state = prevState;

      // remove card from deck & place it on board
      let onWhat = "empty space";
      if (underCard) {
        onWhat = game.describeCard(underCard);
      }

      state = game.stateTransformDeck(state, move.player, deck =>
        game.deckRemoveCard(deck, move.cardId),
      );
      state = game.stateTransformBoard(state, board =>
        game.boardSetCard(board, move.placement, move.cardId),
      );

      cons.snapshot({
        millis: 500,
        text: `${game.playerName(move.player)} plays a ${
          card.value
        } on ${onWhat}`,
        state,
      });

      if (underCard) {
        // place under card back into deck
        state = game.stateTransformDeck(state, move.player, deck =>
          game.deckAddCard(deck, underCard.id),
        );

        cons.snapshot({
          millis: 500,
          text: `${card.value} returns to ${game.playerName(
            move.player,
          )}'s deck`,
          state,
        });
      }

      return state;
    }
  } else if (typeof card.value === "string") {
    if (!underCard) {
      // can't play modifier card on blank space
      return prevState;
    }

    let [dcol, drow] = dirToColRow(card.value);
    let [newCol, newRow] = [col + dcol, row + drow];
    if (newCol < 0) {
      // can't drop cards off left edge of board
      return prevState;
    }
    if (newCol >= game.numCols) {
      // can't drop cards off right edge of board
      return prevState;
    }
    if (newRow < 0) {
      // can't drop cards off top edge of board
      return prevState;
    }
    if (newRow >= game.numRows) {
      // can't drop cards off bottom edge of board
      return prevState;
    }

    {
      let state = prevState;

      // remove card from deck & place it into trash
      state = game.stateTransformDeck(state, move.player, deck =>
        game.deckRemoveCard(deck, move.cardId),
      );
      state = game.stateTransformBoard(state, board =>
        game.boardSetCard(board, move.placement, move.cardId),
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
      state = game.stateTransformBoard(state, board =>
        game.boardTrashCard(board, move.cardId),
      );

      cons.snapshot({
        state,
        millis: 500,
        text: `cards get swapped`,
      });

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
