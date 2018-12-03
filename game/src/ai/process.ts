import * as _ from "underscore";
import { Game } from "../game";
import { GameBase } from "../game-base";
import { nullConsequences } from "../rules/consequences";
import { play } from "../rules/play";
import { GameState, Move } from "../types";
import { listMoves } from "./list-moves";
import { Node } from "./mcts";
import { timeMax } from "../constants";

export interface AIStats {
  humanChance: number;
}

export interface AIResult {
  stats: AIStats;
  move: Move;
}

export function calculateBestMove(
  game: GameBase,
  rootState: GameState,
): AIResult {
  {
    let ps = game.players[game.state.currentPlayer];
    if (ps.aiType === "random") {
      let randomMove = _.sample<Move>(
        listMoves(game, game.state, game.state.currentPlayer),
      );
      let move = randomMove || game.passMove(rootState);
      return {
        move,
        stats: { humanChance: -1 },
      };
    }
  }

  let result: AIResult = {
    stats: {
      humanChance: 0,
    },
    move: game.passMove(rootState),
  };
  let rootNode = new Node(game, null, null, rootState);
  let startTime = Date.now();
  // console.log(`AI is thinking for ${timeMax}ms...`);
  let numIters = 0;
  while (Date.now() - startTime < timeMax) {
    numIters++;
    let node = rootNode;
    let state = rootState;

    //===========================
    // Select
    //===========================
    while (_.isEmpty(node.untriedMoves) && !_.isEmpty(node.childNodes)) {
      // node is fully expanded and non-terminal
      node = node.select();
      state = play(game, state, node.move, nullConsequences);
    }

    //===========================
    // Expand
    //===========================
    if (!_.isEmpty(node.untriedMoves)) {
      // if we can expand (state/node is non-terminal)
      let m = _.sample<Move>(node.untriedMoves);
      state = play(game, state, m, nullConsequences);
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
        state = play(game, state, _.sample<Move>(moves), nullConsequences);
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

  console.log(`Did ${numIters} iteractions`);

  let humanChance = (100 * rootNode.wins) / rootNode.visits;
  // console.log(`Human has ${humanChance.toFixed()}% chance of winning`);
  result.stats.humanChance = humanChance;

  // return most visited node
  let sortedMoves = _.sortBy(rootNode.childNodes, c => c.visits);
  let bestNode = _.last(sortedMoves);
  if (bestNode) {
    result.move = bestNode.move;
  }
  return result;
}
