import { GameState, Move } from "../types";
import { Game } from "../game";
import { Consequences } from "./consequences";
import { GameBase } from "../game-base";
import { canPlay } from "./can-play";

export function placeCard(
  game: GameBase,
  prevState: GameState,
  move: Move,
  cons: Consequences,
): GameState {
  if (!canPlay(game, prevState, move)) {
    return prevState;
  }

  if (move.pass) {
    return { ...prevState };
  }

  const { col, row } = move.placement;
  let card = game.cardSpecs[move.cardId];
  let underCard = game.boardGetCard(prevState.board, col, row);

  if (typeof card.value === "number") {
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

      cons.snapshot(() => ({
        millis: 500,
        text: `${game.playerName(move.player)} plays a ${
          card.value
        } on ${onWhat}`,
        state,
      }));

      if (underCard) {
        // place under card back into deck
        state = game.stateTransformDeck(state, move.player, deck =>
          game.deckAddCard(deck, underCard.id),
        );

        cons.snapshot(() => ({
          millis: 500,
          text: `${card.value} returns to ${game.playerName(
            move.player,
          )}'s deck`,
          state,
        }));
      }

      return state;
    }
  } else if (typeof card.value === "string") {
    let [dcol, drow] = dirToColRow(card.value);
    let [newCol, newRow] = [col + dcol, row + drow];

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

      cons.snapshot(() => ({
        state,
        millis: 500,
        text: `cards get swapped`,
      }));

      return state;
    }
  }

  return prevState;
}

export function dirToColRow(value: string): number[] {
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
