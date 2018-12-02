import { max, size, isEmpty } from "underscore";
import { listMoves, ScoredMove } from "./list-moves";
import { Game } from "../game";
import { GameState, Move } from "../types";
import { TreeNode } from "./tree-node";

function calculateBestMove(game: Game, state: GameState): ScoredMove {
  let player = state.currentPlayer;

  let tree = new TreeNode(game, null, state, 3);
  console.log(
    `Computed tree, ${tree.countNodes()} nodes, ${tree.countLeafNodes()} leaf nodes`,
  );

  let moves = listMoves(game, state, player);
  console.log(`Player ${player} has ${size(moves)} moves available`);
  if (isEmpty(moves)) {
    return null;
  }

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
