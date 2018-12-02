import { GameState } from "../types";
import { Game } from "../game";
import { Consequences } from "./consequences";

export function processRowClears(
  game: Game,
  oldState: GameState,
  newState: GameState,
  cons: Consequences,
): GameState {
  const newZones = computeHotZones(game, newState);

  let rowsToClear = [];
  let colsToClear = [];
  for (const row of newZones.hotRows) {
    rowsToClear.push(row);
    cons.rowsCleared.push(row);
  }
  for (const col of newZones.hotCols) {
    colsToClear.push(col);
    cons.rowsCleared.push(col);
  }

  let state = newState;
  if (rowsToClear.length > 0 || colsToClear.length > 0) {
    for (const col of colsToClear) {
      for (let row = 0; row < game.numRows; row++) {
        const card = game.boardGetCard(state.board, col, row);
        if (card) {
          state = game.stateTransformBoard(state, board =>
            game.boardTrashCard(board, card.id),
          );
        }
        state = game.stateTransformBoard(state, board =>
          game.boardSetCard(board, { col, row }, undefined),
        );
      }
    }
    for (const row of rowsToClear) {
      for (let col = 0; col < game.numCols; col++) {
        const card = game.boardGetCard(state.board, col, row);
        if (card) {
          state = game.stateTransformBoard(state, board =>
            game.boardTrashCard(board, card.id),
          );
        }
        state = game.stateTransformBoard(state, board =>
          game.boardSetCard(board, { col, row }, undefined),
        );
      }
    }
  }
  return state;
}

interface HotZones {
  hotRows: number[];
  hotCols: number[];
}

export function computeHotZones(game: Game, state: GameState): HotZones {
  let zones: HotZones = {
    hotRows: [],
    hotCols: [],
  };
  for (let row = 0; row < game.numRows; row++) {
    if (game.boardSumRow(state.board, row) > game.maxSum) {
      zones.hotRows.push(row);
    }
  }
  for (let col = 0; col < game.numCols; col++) {
    if (game.boardSumCol(state.board, col) > game.maxSum) {
      zones.hotCols.push(col);
    }
  }
  return zones;
}
