import {
  Card,
  GameState,
  CellState,
  DeckState,
  BoardState,
  BoardPlacement,
  Move,
  SumsGraphics,
  DecksGraphics,
  UIContainer,
  CellContainer,
  BoardContainer,
} from "./types";
import { emptyBoard } from "./transforms";
import { propagate } from "./propagate";
import { layout } from "./layout";
import { createDisplayObjects } from "./create-display-objects";
import { play } from "./rules/play";
import { RecordingConsequences, GameSnapshot } from "./rules/consequences";
import { GameBase } from "./game-base";
import { WorkerIncomingMessage } from "./types-worker";

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
}

export interface GamePhase {
  movePhase?: MovePhase;
  transitionPhase?: TransitionPhase;
  gameOverPhase?: GameOverPhase;
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

  constructor(app: PIXI.Application, worker: Worker, settings: GameSettings) {
    super();
    this.fromSettings(settings);
    this.worker = worker;
    this.app = app;

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

    console.log(`For this turn, got ${cons.snaps.length} snapshots: `);
    for (const s of cons.snaps) {
      console.log(`+${s.millis}ms: ${s.text}`);
    }

    this.phase = {
      transitionPhase: {
        cons,
        nextState,
      },
    };
    this.state = nextState;
  }

  pass() {
    this.state = this.stateAdvanceTurn(this.state);
    propagate(this);
    layout(this);
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
      c.rotation = (10 / 180) * Math.PI;
      c.scale.set(0.9, 0.9);
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
}
