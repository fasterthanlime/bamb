export interface DeckPlacement {
  player: number;
  slot: number;
}

export interface BoardPlacement {
  col: number;
  row: number;
}

export interface TrashPlacement {
  index: number;
}

export interface CardPlacement {
  deckPlacement?: DeckPlacement;
  boardPlacement?: BoardPlacement;
  trashPlacement?: TrashPlacement;
}

export interface Move {
  player: number;
  cardId: string;
  placement: BoardPlacement;
}

export interface Card {
  player: number;
  value: any;
  id: string;
  container: PIXI.Container;
  placement: CardPlacement;
  targetPos: PIXI.Point;
  dragging?: {
    data: PIXI.interaction.InteractionData;
    pos: PIXI.Point;
    over?: CellContainer;
  };
}

export type CardContainer = PIXI.Container & {
  card: Card;
};

export type CellContainer = PIXI.Container & {
  cell: {
    col: number;
    row: number;
  };
};

export interface GameState {
  currentPlayer: number;
  board: BoardState;
  decks: DeckState[];
}

export interface BoardState {
  cells: CellState[];
  trashedCardIds: string[];
}

export interface CellState {
  cardId?: string;
}

export interface DeckState {
  cells: CellState[];
}
