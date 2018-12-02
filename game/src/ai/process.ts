import * as _ from "underscore";
import { Game } from "../game";
import { GameBase } from "../game-base";
import { nullConsequences } from "../rules/consequences";
import { play } from "../rules/play";
import { GameState } from "../types";
import { listMoves, ScoredMove } from "./list-moves";
import { Node } from "./mcts";

export interface AIStats {
  humanChance: number;
}

export interface AIResult {
  stats: AIStats;
  move: ScoredMove;
}

export function calculateBestMove(
  game: GameBase,
  rootState: GameState,
): AIResult {
  let result: AIResult = {
    stats: {
      humanChance: 0,
    },
    move: null,
  };
  let rootNode = new Node(game, null, null, rootState);
  console.log(`AI is thinking...`);
  let itermax = 100;
  for (let i = 0; i < itermax; i++) {
    let node = rootNode;
    let state = rootState;

    //===========================
    // Select
    //===========================
    while (_.isEmpty(node.untriedMoves) && !_.isEmpty(node.childNodes)) {
      // node is fully expanded and non-terminal
      node = node.select();
      state = play(game, state, node.move.move, nullConsequences);
    }

    //===========================
    // Expand
    //===========================
    if (!_.isEmpty(node.untriedMoves)) {
      // if we can expand (state/node is non-terminal)
      let m = _.sample<ScoredMove>(node.untriedMoves);
      state = play(game, state, m.move, nullConsequences);
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
        state = play(
          game,
          state,
          _.sample<ScoredMove>(moves).move,
          nullConsequences,
        );
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

  let humanChance = (100 * rootNode.wins) / rootNode.visits;
  console.log(`Human has ${humanChance.toFixed()}% chance of winning`);
  result.stats.humanChance = humanChance;

  // return most visited node
  let sortedMoves = _.sortBy(rootNode.childNodes, c => c.visits);
  let bestNode = _.last(sortedMoves);
  if (bestNode) {
    result.move = bestNode.move;
  }
  return result;
}
