import { GameState } from "../types";
import { ScoredMove, listMoves } from "./list-moves";
import { play } from "../rules/play";
import { Game } from "../game";
import { reduce, isEmpty } from "underscore";

export class TreeNode {
  move: ScoredMove | null;
  state: GameState;
  player: number;
  children: TreeNode[];

  constructor(
    game: Game,
    move: ScoredMove | null,
    prevState: GameState,
    depth: number,
  ) {
    this.move = move;
    this.player = prevState.currentPlayer;
    this.state = move ? play(game, prevState, move.move) : prevState;
    this.children = [];

    if (depth > 0) {
      const moves = listMoves(game, this.state, this.state.currentPlayer);
      for (const move of moves) {
        this.children.push(new TreeNode(game, move, this.state, depth - 1));
      }
    }
  }

  countNodes() {
    return reduce(this.children, (m, c) => m + c.countNodes(), 1);
  }

  countLeafNodes() {
    if (isEmpty(this.children)) {
      return 1;
    } else {
      return reduce(this.children, (m, c) => m + c.countLeafNodes(), 0);
    }
  }
}
