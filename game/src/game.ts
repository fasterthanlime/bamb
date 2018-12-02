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
} from "./types";
import { emptyBoard } from "./transforms";
import { propagate } from "./propagate";
import { layout } from "./layout";
import { createDisplayObjects } from "./create-display-objects";
import { play } from "./rules/play";
import { RecordingConsequences } from "./rules/consequences";

interface GameCards {
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

export class Game {
  app: PIXI.Application;
  numCols: number;
  numRows: number;
  maxSum: number;
  state: GameState;
  cards: GameCards;
  container: PIXI.Container;
  displayObjects: {
    board: PIXI.Container;
    decks: DecksGraphics;
    cards: PIXI.Container;
    trash: PIXI.Container;
    sums: SumsGraphics;
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
  dragTarget: Card;
  players: Player[];
  humanWinChance = 100;

  constructor(app: PIXI.Application, settings: GameSettings) {
    this.app = app;
    const { numCols, numRows } = settings;
    this.numCols = numCols;
    this.numRows = numRows;
    this.maxSum = settings.maxSum;
    if (settings.players.length !== 2) {
      throw new Error("game only supports 2 players");
    }
    this.players = settings.players;
    this.state = {
      currentPlayer: 0,
      board: emptyBoard(numCols, numRows),
      decks: [{ cells: [] }, { cells: [] }],
    };
    this.cards = {};
    createDisplayObjects(this);
    propagate(this);
    layout(this, true);
  }

  cellIndex(col: number, row: number): number {
    return col + row * this.numCols;
  }

  boardGetCell(state: BoardState, col: number, row: number): CellState {
    return state.cells[this.cellIndex(col, row)];
  }

  boardSumRow(state: BoardState, row: number): number {
    let sum = 0;
    for (let col = 0; col < this.numCols; col++) {
      sum += this.boardGetCardValue(state, col, row);
    }
    return sum;
  }

  boardSumCol(state: BoardState, col: number): number {
    let sum = 0;
    for (let row = 0; row < this.numRows; row++) {
      sum += this.boardGetCardValue(state, col, row);
    }
    return sum;
  }

  boardGetCard = (state: BoardState, col: number, row: number): Card => {
    const { cardId } = this.boardGetCell(state, col, row);
    if (cardId) {
      return this.cards[cardId];
    }
    return null;
  };

  boardGetCardValue(state: BoardState, col: number, row: number): number {
    let card = this.boardGetCard(state, col, row);
    if (card) {
      return card.value;
    }
    return 0;
  }

  stateTransformDeck(
    prevState: GameState,
    player: number,
    f: (deckState: DeckState) => DeckState,
  ): GameState {
    let state = {
      ...prevState,
      decks: [...prevState.decks],
    };
    state.decks[player] = f(state.decks[player]);
    return state;
  }

  stateTransformBoard(
    state: GameState,
    f: (board: BoardState) => BoardState,
  ): GameState {
    return { ...state, board: f(state.board) };
  }

  cellsRemoveCard(prevCells: CellState[], cardId: string): CellState[] {
    let cells = [...prevCells];
    for (let i = 0; i < cells.length; i++) {
      if (cells[i].cardId == cardId) {
        cells[i] = {};
      }
    }
    return cells;
  }

  cellsSet(prevCells: CellState[], idx: number, cell: CellState): CellState[] {
    let cells = [...prevCells];
    cells[idx] = cell;
    return cells;
  }

  cellsTransform(
    cells: CellState[],
    idx: number,
    f: (cell: CellState) => CellState,
  ): CellState[] {
    return this.cellsSet(cells, idx, f(cells[idx]));
  }

  deckRemoveCard(deck: DeckState, cardId: string): DeckState {
    return { ...deck, cells: this.cellsRemoveCard(deck.cells, cardId) };
  }

  deckAddCard(prevDeck: DeckState, cardId: string): DeckState {
    let deck = { ...prevDeck };
    deck.cells = [...deck.cells];
    for (let i = 0; i < deck.cells.length; i++) {
      if (!deck.cells[i].cardId) {
        deck.cells[i] = { cardId };
        break;
      }
    }
    return deck;
  }

  boardTrashCard(prevBoard: BoardState, cardId: string): BoardState {
    let board = { ...prevBoard };
    board.trashedCardIds = [...board.trashedCardIds, cardId];
    return board;
  }

  boardSetCard(
    prevBoard: BoardState,
    placement: BoardPlacement,
    cardId: string,
  ): BoardState {
    let board = { ...prevBoard };
    const { col, row } = placement;
    let idx = this.cellIndex(col, row);
    board.cells = this.cellsTransform(board.cells, idx, cell => {
      return cardId ? { cardId } : {};
    });
    return board;
  }

  stateAdvanceTurn(state: GameState): GameState {
    return { ...state, currentPlayer: 1 - state.currentPlayer };
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

    this.state = nextState;
    propagate(this);
    layout(this);
  }

  stateGetResult(state: GameState, player: number): number {
    let scores = [0, 0];
    for (const c of state.board.cells) {
      if (!c.cardId) {
        continue;
      }
      const card = this.cards[c.cardId];
      scores[card.player] += 100;
      scores[card.player] += card.value;
    }
    let ourScore = scores[player];
    let theirScore = scores[1 - player];

    if (ourScore > theirScore) {
      // win
      return 1;
    }

    if (ourScore < theirScore) {
      // loss
      return 0;
    }

    // draw
    return 0.5;
  }

  playerName(player: number): string {
    return this.players[player].name;
  }

  describeCard(card: Card): string {
    return `${this.playerName(card.player)} ${card.value}`;
  }
}
