import { GameState } from "../types";
import { ScoredMove, listMoves } from "./list-moves";
import * as _ from "underscore";
import { GameBase } from "../game-base";

export class Node {
  move: ScoredMove | null;
  parentNode: Node | null;
  playerJustMoved: number;

  childNodes: Node[];
  wins: number;
  visits: number;
  untriedMoves: ScoredMove[];

  constructor(
    game: GameBase,
    move: ScoredMove | null,
    parent: Node | null,
    state: GameState,
  ) {
    this.move = move;
    this.parentNode = parent;
    this.childNodes = [];
    this.wins = 0;
    this.visits = 0;
    this.untriedMoves = listMoves(game, state, state.currentPlayer);
    this.playerJustMoved = 1 - state.currentPlayer;
  }

  select(): Node {
    // Use the UCB1 formula to select a child node.
    let sortedChildren = _.sortBy(
      this.childNodes,
      c =>
        c.wins / c.visits + Math.sqrt((2 * Math.log(this.visits)) / c.visits),
    );
    return _.last(sortedChildren);
  }

  addChild(game: GameBase, m: ScoredMove, s: GameState): Node {
    let n = new Node(game, m, this, s);
    this.untriedMoves = _.reject(this.untriedMoves, el => el === m);
    this.childNodes.push(n);
    return n;
  }

  update(result: number) {
    this.visits++;
    this.wins += result;
  }

  print() {
    console.groupCollapsed(
      `[${this.playerJustMoved}] ${this.wins}/${this.visits}`,
    );
    for (const c of this.childNodes) {
      c.print();
    }
    console.groupEnd();
  }
}
