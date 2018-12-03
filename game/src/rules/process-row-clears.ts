import { GameState } from "../types";
import { Game } from "../game";
import { Consequences } from "./consequences";
import { GameBase } from "../game-base";

export function processRowClears(
  game: GameBase,
  oldState: GameState,
  newState: GameState,
  cons: Consequences,
): GameState {
  const newZones = computeHotZones(game, newState);

  let rowsToClear = [];
  let colsToClear = [];
  for (const row of newZones.hotRows) {
    rowsToClear.push(row);
    cons.clearedRow(row);
  }
  for (const col of newZones.hotCols) {
    colsToClear.push(col);
    cons.clearedCol(col);
  }

  let state = newState;
  if (rowsToClear.length > 0 || colsToClear.length > 0) {
    for (const col of colsToClear) {
      cons.snapshot({
        state,
        text: `column ${col} clears`,
        millis: 700,
        clearedCol: { col },
      });

      for (let row = 0; row < game.numRows; row++) {
        const card = game.boardGetCard(state.board, col, row);
        if (card) {
          state = game.stateTransformBoard(state, board =>
            game.boardTrashCard(board, card.id),
          );
          state = game.stateTransformBoard(state, board =>
            game.boardSetCard(board, { col, row }, undefined),
          );
          cons.lostCard(card.player);
          cons.snapshot({
            state,
            text: `${game.playerName(card.player)} loses ${card.value}`,
            millis: 200,
            clearedCol: { col },
          });
        }
      }
    }
    for (const row of rowsToClear) {
      cons.snapshot({
        state,
        text: `row ${row} clears`,
        millis: 700,
        clearedRow: { row },
      });

      for (let col = 0; col < game.numCols; col++) {
        const card = game.boardGetCard(state.board, col, row);
        if (card) {
          state = game.stateTransformBoard(state, board =>
            game.boardTrashCard(board, card.id),
          );
          state = game.stateTransformBoard(state, board =>
            game.boardSetCard(board, { col, row }, undefined),
          );
          cons.lostCard(card.player);
          cons.snapshot({
            state,
            text: `${game.playerName(card.player)} loses ${card.value}`,
            millis: 200,
            clearedRow: { row },
          });
        }
      }
    }
  }
  return state;
}

interface HotZones {
  hotRows: number[];
  hotCols: number[];
}

export function computeHotZones(game: GameBase, state: GameState): HotZones {
  let zones: HotZones = {
    hotRows: [],
    hotCols: [],
  };
  for (let row = 0; row < game.numRows; row++) {
    if (game.boardSumRow(state.board, row) == game.maxSum) {
      zones.hotRows.push(row);
    }
  }
  for (let col = 0; col < game.numCols; col++) {
    if (game.boardSumCol(state.board, col) == game.maxSum) {
      zones.hotCols.push(col);
    }
  }
  return zones;
}
