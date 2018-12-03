import * as _ from "underscore";
import { listMoves } from "./ai/list-moves";
import { createDisplayObjects } from "./create-display-objects";
import { GameBase } from "./game-base";
import { layout } from "./layout";
import { propagate } from "./propagate";
import { GameSnapshot, RecordingConsequences } from "./rules/consequences";
import { play } from "./rules/play";
import {
  BoardContainer,
  Card,
  CellContainer,
  DecksGraphics,
  GameState,
  Move,
  SumsGraphics,
  UIContainer,
} from "./types";
import { WorkerIncomingMessage, WorkerOutgoingMessage } from "./types-worker";
import { computeScore } from "./ai/compute-score";

export interface GameCards {
  [cardId: string]: Card;
}

export interface GameSettings {
  numCols: number;
  numRows: number;
  maxSum: number;
  players: Player[];
}

export enum PlayerKind {
  Human = "human",
  AI = "ai",
}

export interface Player {
  name: string;
  kind: PlayerKind;
  aiType?: "mcts" | "random";
}

export interface GamePhase {
  movePhase?: MovePhase;
  transitionPhase?: TransitionPhase;
  gameOverPhase?: GameOverPhase;
  mainMenuPhase?: MovePhase;
}

export interface MovePhase {}
export interface TransitionPhase {
  cons: RecordingConsequences;
  nextState: GameState;
}
export interface GameOverPhase {
  scores: number[];
}

export class Game extends GameBase {
  worker: Worker;
  app: PIXI.Application;
  container: PIXI.Container;
  displayObjects: {
    board: BoardContainer;
    decks: DecksGraphics;
    cards: PIXI.Container;
    trash: PIXI.Container;
    sums: SumsGraphics;
    gameUI: UIContainer;
    menuUI: UIContainer;
  };
  dimensions: {
    borderRadius: number;
    cardSide: number;
    cardPadding: number;
    deckWidth: number;
    deckHeight: number;
    deckVertPadding: number;
    boardWidth: number;
    boardHeight: number;
  };
  cards: GameCards = {};
  dragTarget: Card;
  humanWinChance = 100;
  phase: GamePhase;
  currentSnapshot: GameSnapshot;
  shouldRestart: boolean;

  constructor(app: PIXI.Application, settings: GameSettings) {
    super();
    this.fromSettings(settings);
    this.worker = new Worker("worker.js");
    this.worker.onmessage = (ev: MessageEvent) => {
      let msg = ev.data as WorkerOutgoingMessage;

      if (msg.task === "processAI") {
        let { result } = msg;
        if (result.move) {
          this.applyMove(result.move);
        }
      } else {
        console.log(`Got message from worker: `, ev);
      }
    };
    this.app = app;

    // this.phase = {
    //   mainMenuPhase: {},
    // };
    this.phase = {
      movePhase: {},
    };
    createDisplayObjects(this);
    propagate(this);
    layout(this, true);
  }

  applyMove(move: Move) {
    let prevState = this.state;
    let cons = new RecordingConsequences();
    let nextState = play(this, prevState, move, cons);
    if (nextState === prevState) {
      return;
    }

    this.phase = {
      transitionPhase: {
        cons,
        nextState,
      },
    };
  }

  sendWorkerMessage(msg: WorkerIncomingMessage) {
    this.worker.postMessage(msg);
  }

  setDragTarget(card: Card) {
    let oldTarget = this.dragTarget;
    if (oldTarget) {
      let c = oldTarget.container;
      c.rotation = 0;
      c.scale.set(1, 1);
    }

    this.dragTarget = card;
    if (this.dragTarget) {
      let c = this.dragTarget.container;
      c.rotation = (8 / 180) * Math.PI;
      c.scale.set(0.8, 0.8);
    }
    propagate(this);
  }

  dragOver(cc: CellContainer) {
    if (!this.dragTarget) {
      return;
    }
    this.dragTarget.dragging.over = cc;
    propagate(this);
  }

  dragOut(cc: CellContainer) {
    if (!this.dragTarget) {
      return;
    }
    if (this.dragTarget && this.dragTarget.dragging.over === cc) {
      this.dragTarget.dragging.over = null;
      propagate(this);
    }
  }

  destroy() {
    this.worker.terminate();
    this.container.parent.removeChild(this.container);
  }

  checkEnd() {
    // are we in an end condition?
    let state = this.state;
    if (_.isEmpty(listMoves(this, state, state.currentPlayer))) {
      {
        let numCards = 0;
        for (const c of state.decks[state.currentPlayer].cells) {
          if (c.cardId) {
            numCards++;
          }
        }
      }

      // current player can't move, and..
      state = this.stateAdvanceTurn(state);
      if (_.isEmpty(listMoves(this, state, state.currentPlayer))) {
        {
          let numCards = 0;
          for (const c of state.decks[state.currentPlayer].cells) {
            if (c.cardId) {
              numCards++;
            }
          }
        }
        // other player can't move either!
        this.phase = {
          gameOverPhase: {
            scores: [
              computeScore(this, this.state, 0),
              computeScore(this, this.state, 1),
            ],
          },
        };
        console.log(
          `Game over (on ${this.state.currentPlayer}'s turn') results: `,
          this.phase.gameOverPhase.scores,
        );
        propagate(this);
        layout(this);
      }
    }
  }
}
