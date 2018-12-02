import * as _ from "underscore";
import { ScoredMove, listMoves } from "./list-moves";
import { Game } from "../game";
import { GameState, Move } from "../types";
import { Node } from "./mcts";
import { play } from "../rules/play";

function calculateBestMove(game: Game, rootState: GameState): ScoredMove {
  let rootNode = new Node(game, null, null, rootState);
  let itermax = 500;
  for (let i = 0; i < itermax; i++) {
    let node = rootNode;
    let state = rootState;

    //===========================
    // Select
    //===========================
    while (_.isEmpty(node.untriedMoves) && !_.isEmpty(node.childNodes)) {
      // node is fully expanded and non-terminal
      node = node.select();
      state = play(game, state, node.move.move);
    }

    //===========================
    // Expand
    //===========================
    if (!_.isEmpty(node.untriedMoves)) {
      // if we can expand (state/node is non-terminal)
      let m = _.sample<ScoredMove>(node.untriedMoves);
      state = play(game, state, m.move);
      node = node.addChild(game, m, state);
    }

    //===========================
    // Rollout - this can often be made orders of magnitude quicker
    // using a state.GetRandomMove() function
    //===========================
    {
      let moves = listMoves(game, state, state.currentPlayer);
      // while state is non-terminal
      while (!_.isEmpty(moves)) {
        state = play(game, state, _.sample<ScoredMove>(moves).move);
        moves = listMoves(game, state, state.currentPlayer);
      }
    }

    //===========================
    // Backpropagate
    //===========================
    while (node) {
      node.update(game.stateGetResult(state, node.playerJustMoved));
      node = node.parentNode;
    }
  }

  // rootNode.print();
  console.log(
    `Human has ${(
      (100 * rootNode.wins) /
      rootNode.visits
    ).toFixed()}% chance of winning`,
  );

  return _.sample<ScoredMove>(
    listMoves(game, rootState, rootState.currentPlayer),
  );
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