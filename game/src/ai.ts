import { max, size } from "underscore";
import { listMoves, ScoredMove } from "./ai/list-moves";
import { Game } from "./game";
import { GameState } from "./types";

function calculateBestMove(game: Game, state: GameState): ScoredMove {
  let player = state.currentPlayer;
  let moves = listMoves(game, state, player);
  console.log(`Player ${player} has ${size(moves)} moves available`);
  let bestMove = max(moves, x => x.score);
  return bestMove;
}

export function processAI(game: Game) {
  let move = calculateBestMove(game, game.state);

  if (move) {
    game.applyMove(move.move);
  } else {
    console.log("AI could not come up with a move");
    // game end
  }
}
