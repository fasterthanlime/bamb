import { GameState } from "./types";
import { Game } from "./game";

export function stateApplyEffects(game: Game, state: GameState): GameState {
  if (state.currentPlayer != 0) {
    // nothing to do
    return state;
  }

  let rowsToClear = [];
  let colsToClear = [];
  for (let row = 0; row < game.numRows; row++) {
    if (game.stateSumRow(state, row) > game.maxSum) {
      rowsToClear.push(row);
    }
  }
  for (let col = 0; col < game.numCols; col++) {
    if (game.stateSumCol(state, col) > game.maxSum) {
      colsToClear.push(col);
    }
  }

  console.log(
    `${rowsToClear.length} rows to clear, ${colsToClear.length} cols to clear`
  );
  if (rowsToClear.length > 0 || colsToClear.length > 0) {
    for (const col of colsToClear) {
      for (let row = 0; row < game.numRows; row++) {
        const card = game.stateGetCard(state, col, row);
        if (card) {
          state = game.stateTransformBoard(state, board =>
            game.boardTrashCard(board, card.id)
          );
        }
        state = game.stateTransformBoard(state, board =>
          game.boardSetCard(board, { col, row }, undefined)
        );
      }
    }
    for (const row of rowsToClear) {
      for (let col = 0; col < game.numCols; col++) {
        const card = game.stateGetCard(state, col, row);
        if (card) {
          state = game.stateTransformBoard(state, board =>
            game.boardTrashCard(board, card.id)
          );
        }
        state = game.stateTransformBoard(state, board =>
          game.boardSetCard(board, { col, row }, undefined)
        );
      }
    }
  }
  return state;
}
