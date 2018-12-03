import { GameBaseMessage } from "./game-base";
import { ScoredMove } from "./ai/list-moves";

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
  pass?: boolean;
}

export interface CardSpec {
  player: number;
  value: any;
  id: string;
}

export interface Card {
  spec: CardSpec;
  container: PIXI.Container;
  placement: CardPlacement;
  targetPos: PIXI.Point;
  dragging?: {
    data: PIXI.interaction.InteractionData;
    pos: PIXI.Point;
    over?: CellContainer;
  };
}

export type BoardContainer = PIXI.Container & {
  highlights: PIXI.Graphics[];
};

export type CardContainer = PIXI.Container & {
  card: Card;
};

export type CellContainer = PIXI.Container & {
  cell: {
    col: number;
    row: number;
  };
};

export type UIContainer = PIXI.Container & {
  visible: boolean;
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

export interface SumsGraphics {
  container: PIXI.Container;
  cols: PIXI.Text[];
  rows: PIXI.Text[];
}

export type DecksGraphics = DeckGraphics[];

export interface DeckGraphics {
  container: PIXI.Container;
  bg: PIXI.DisplayObject;
  text: PIXI.Text;
  clock: PIXI.Text;
}
