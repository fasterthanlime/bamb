import {
  Card,
  GameState,
  CellState,
  DeckState,
  BoardState,
  BoardPlacement,
  Move,
  SumsGraphics,
} from "./types";
import { emptyBoard } from "./transforms";
import { propagate } from "./propagate";
import { layout } from "./layout";
import { createDisplayObjects } from "./create-display-objects";
import { stateApplyMove } from "./state-apply-move";
import { stateApplyEffects } from "./state-apply-effects";

interface GameCards {
  [cardId: string]: Card;
}

export interface GameSettings {
  numCols: number;
  numRows: number;
  maxSum: number;
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
    decks: PIXI.Container[];
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

  constructor(app: PIXI.Application, settings: GameSettings) {
    this.app = app;
    const { numCols, numRows } = settings;
    this.numCols = numCols;
    this.numRows = numRows;
    this.maxSum = settings.maxSum;
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

  stateGetCell(state: GameState, col: number, row: number): CellState {
    return state.board.cells[this.cellIndex(col, row)];
  }

  stateSumRow(state: GameState, row: number): number {
    let sum = 0;
    for (let col = 0; col < this.numCols; col++) {
      sum += this.stateGetCardValue(state, col, row);
    }
    return sum;
  }

  stateSumCol(state: GameState, col: number): number {
    let sum = 0;
    for (let row = 0; row < this.numRows; row++) {
      sum += this.stateGetCardValue(state, col, row);
    }
    return sum;
  }

  stateGetCard = (state: GameState, col: number, row: number): Card => {
    const { cardId } = this.stateGetCell(state, col, row);
    if (cardId) {
      return this.cards[cardId];
    }
    return null;
  };

  stateGetCardValue(state: GameState, col: number, row: number): number {
    let card = this.stateGetCard(state, col, row);
    if (card) {
      return card.value;
    }
    return 0;
  }

  stateTransformDeck(
    prevState: GameState,
    player: number,
    f: (deckState: DeckState) => DeckState
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
    f: (board: BoardState) => BoardState
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
    f: (cell: CellState) => CellState
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
    cardId: string
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
    let oldState = this.state;
    let newState = stateApplyMove(this, oldState, move);
    if (newState != oldState) {
      newState = stateApplyEffects(this, oldState, newState);
    }
    this.state = newState;
    propagate(this);
    layout(this);
  }
}
