import {
  Card,
  GameState,
  CellState,
  DeckState,
  BoardState,
  BoardPlacement,
  Move,
} from "./types";
import { emptyBoard } from "./transforms";
import { propagate } from "./propagate";
import { layout } from "./layout";
import { createDisplayObjects } from "./create-display-objects";

interface GameCards {
  [cardId: string]: Card;
}

export interface GameSettings {
  numCols: number;
  numRows: number;
}

export class Game {
  app: PIXI.Application;
  numCols: number;
  numRows: number;
  state: GameState;
  cards: GameCards;
  container: PIXI.Container;
  displayObjects: {
    board: PIXI.Container;
    decks: PIXI.Container[];
    cards: PIXI.Container;
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
    for (let i = 0; this.numRows; i++) {
      sum += this.stateGetCardValue(state, i, row);
    }
    return sum;
  }

  stateSumCol(state: GameState, col: number): number {
    let sum = 0;
    for (let i = 0; this.numCols; i++) {
      sum += this.stateGetCardValue(state, col, i);
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
    state: GameState,
    player: number,
    f: (deckState: DeckState) => DeckState
  ): GameState {
    let previousState = state;
    {
      let state = {
        ...previousState,
        decks: [...previousState.decks],
      };
      state.decks[player] = f(state.decks[player]);
      return state;
    }
  }

  stateTransformBoard(
    state: GameState,
    f: (board: BoardState) => BoardState
  ): GameState {
    return { ...state, board: f(state.board) };
  }

  cellsRemoveCard(cells: CellState[], cardId: string): CellState[] {
    let previousCells = cells;
    {
      let cells = [...previousCells];
      for (let i = 0; i < cells.length; i++) {
        if (cells[i].cardId == cardId) {
          cells[i] = {};
        }
      }
      return cells;
    }
  }

  cellsSet(cells: CellState[], idx: number, cell: CellState): CellState[] {
    let previousCells = cells;
    {
      let cells = [...previousCells];
      cells[idx] = cell;
      return cells;
    }
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

  boardSetCard(
    previousBoard: BoardState,
    placement: BoardPlacement,
    cardId: string
  ): BoardState {
    let board = { ...previousBoard };
    const { col, row } = placement;
    let idx = this.cellIndex(col, row);
    board.cells = this.cellsTransform(board.cells, idx, cell => {
      if (cell.cardId) {
        board.trashedCardIds = [...board.trashedCardIds, cell.cardId];
      }
      return { cardId };
    });
    return board;
  }

  stateAdvanceTurn(state: GameState): GameState {
    return { ...state, currentPlayer: 1 - state.currentPlayer };
  }

  stateApplyMove(state: GameState, move: Move): GameState {
    // first, check that we're playing from the current player's hand
    let hasCard = false;
    const currentDeck = state.decks[state.currentPlayer];
    for (const dc of currentDeck.cells) {
      if (dc.cardId == move.cardId) {
        // yes, we are!
        hasCard = true;
        break;
      }
    }

    if (!hasCard) {
      console.error(
        `${move.cardId} is not in deck for player ${state.currentPlayer}`
      );
      return state;
    }

    // second, make sure the target is empty
    {
      const { col, row } = move.placement;
      if (this.stateGetCard(state, col, row)) {
        console.error(`already has a card at ${col}, ${row}`);
        return state;
      }
    }

    let previousState = state;
    {
      let state = this.stateAdvanceTurn(previousState);
      // remove card from deck
      state = this.stateTransformDeck(state, move.player, deck =>
        this.deckRemoveCard(deck, move.cardId)
      );
      // place card on board
      state = this.stateTransformBoard(state, board =>
        this.boardSetCard(board, move.placement, move.cardId)
      );
      return state;
    }
  }

  applyMove(move: Move) {
    this.state = this.stateApplyMove(this.state, move);
    propagate(this);
    layout(this);
  }
}
