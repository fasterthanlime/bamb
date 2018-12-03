import * as uuidv4 from "uuid/v4";
import { computeScore } from "./ai/compute-score";
import { GameSettings, Player } from "./game";
import { emptyBoard } from "./transforms";
import {
  BoardPlacement,
  BoardState,
  CardSpec,
  CellState,
  DeckState,
  GameState,
} from "./types";
import { ScoredMove } from "./ai/list-moves";

interface GameCardSpecs {
  [cardId: string]: CardSpec;
}

export interface GameBaseMessage {
  numCols: number;
  numRows: number;
  maxSum: number;
  state: GameState;
  cardSpecs: GameCardSpecs;
  players: Player[];
}

export class GameBase implements GameBaseMessage {
  numCols: number;
  numRows: number;
  maxSum: number;
  state: GameState;
  cardSpecs: GameCardSpecs;
  players: Player[];

  constructor() {}

  toMessage(): GameBaseMessage {
    const { numCols, numRows, maxSum, state, cardSpecs, players } = this;
    let msg: GameBaseMessage = {
      numCols,
      numRows,
      maxSum,
      state,
      cardSpecs,
      players,
    };
    return msg;
  }

  fromMessage(msg: GameBaseMessage) {
    this.numCols = msg.numCols;
    this.numRows = msg.numRows;
    this.maxSum = msg.maxSum;
    this.state = msg.state;
    this.cardSpecs = msg.cardSpecs;
    this.players = msg.players;
  }

  fromSettings(settings: GameSettings) {
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
    this.cardSpecs = {};
    const deckContents = [
      [1, 2, 3, 4, 5, 6, 7, "U", "D"],
      [1, 2, 3, 4, 5, 6, 7, "U", "D"],
    ];
    for (const player of [0, 1]) {
      const deckContent = deckContents[player];
      for (let i = 0; i < deckContent.length; i++) {
        let spec: CardSpec = {
          id: uuidv4(),
          player,
          value: deckContent[i],
        };
        this.cardSpecs[spec.id] = spec;
        this.state.decks[spec.player].cells.push({ cardId: spec.id });
      }
    }
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

  boardGetCard = (state: BoardState, col: number, row: number): CardSpec => {
    const { cardId } = this.boardGetCell(state, col, row);
    if (cardId) {
      return this.cardSpecs[cardId];
    }
    return null;
  };

  boardGetCardValue(state: BoardState, col: number, row: number): number {
    let card = this.boardGetCard(state, col, row);
    if (card && typeof card.value === "number") {
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

  stateGetResult(state: GameState, player: number): number {
    let scores = [0, 0];
    for (const player of [0, 1]) {
      scores[player] = computeScore(this, state, player);
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

  describeCard(card: CardSpec): string {
    return `${this.playerName(card.player)} ${card.value}`;
  }

  passMove(state: GameState): ScoredMove {
    return {
      move: {
        cardId: null,
        placement: null,
        player: state.currentPlayer,
        pass: true,
      },
      score: 0,
    };
  }
}
