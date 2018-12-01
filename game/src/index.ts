import * as PIXI from "pixi.js";
import { DropShadowFilter } from "@pixi/filter-drop-shadow";
import * as uuidv4 from "uuid/v4";
import "./main.css";

interface DeckPlacement {
  player: number;
  slot: number;
}

interface BoardPlacement {
  col: number;
  row: number;
}

interface CardPlacement {
  deckPlacement?: DeckPlacement;
  boardPlacement?: BoardPlacement;
}

interface Move {
  player: number;
  cardId: string;
  placement: BoardPlacement;
}

interface Card {
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

type CardContainer = PIXI.Container & {
  card: Card;
};

type CellContainer = PIXI.Container & {
  cell: {
    col: number;
    row: number;
  };
};

interface GameState {
  currentPlayer: number;
  board: BoardState;
  decks: DeckState[];
}

interface BoardState {
  cells: CellState[];
}

interface CellState {
  cardId?: string;
}

interface DeckState {
  cells: CellState[];
}

function main() {
  const app = new PIXI.Application({
    width: window.innerWidth,
    height: window.innerHeight,
    antialias: true,
  });
  app.renderer.backgroundColor = 0xfff1f1f1;

  let borderRadius = 16;
  let cardSide = 74;
  let cardPadding = 10;
  let deckWidth = (cardSide + cardPadding) * 7 + cardPadding;
  let deckHeight = cardSide + 2 * cardPadding;
  let deckVertPadding = 8;
  let fontSize = 14;

  let numCols = 4;
  let numRows = 4;

  let playerColors = [0xEC7D75, 0x75C3EC];
  let dragTarget: Card = null;

  let emptyBoard = (cols: number, rows: number) => {
    let bs: BoardState = {
      cells: [],
    };
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        bs.cells.push({});
      }
    }
    return bs;
  };

  let state: GameState = {
    currentPlayer: 0,
    board: emptyBoard(numCols, numRows),
    decks: [{ cells: [] }, { cells: [] }],
  };
  let cards: { [key: string]: Card } = {};

  let stateCellIndex = (state: GameState, col: number, row: number) => {
    return col + row * numCols;
  };

  let stateGetCell = (state: GameState, col: number, row: number) => {
    return state.board.cells[stateCellIndex(state, col, row)];
  };

  let stateApplyMove = (state: GameState, move: Move): GameState => {
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
      const targetCell = stateGetCell(state, col, row);
      if (targetCell.cardId) {
        console.error(`already has a card at ${col}, ${row}`);
        return state;
      }
    }

    console.log(`Should apply move for real!`);
    let newState = { ...state };
    newState.currentPlayer = 1 - newState.currentPlayer;
    newState.board = { ...newState.board };
    let board = newState.board;
    board.cells = [...board.cells];
    {
      const { col, row } = move.placement;
      let index = stateCellIndex(state, col, row);
      console.log(`moving card to index `, index);
      board.cells[index] = { cardId: move.cardId };
    }
    newState.decks = [...newState.decks];
    let deck = newState.decks[move.player];
    deck.cells = [...deck.cells];
    for (let i = 0; i < deck.cells.length; i++) {
      if (deck.cells[i].cardId == move.cardId) {
        console.log(`clearing deck index `, i);
        deck.cells[i] = {};
      }
    }
    return newState;
  };

  let applyMove = (move: Move) => {
    let newState = stateApplyMove(state, move);
    if (newState !== state) {
      state = newState;
      propagate();
      layout();
    }
  };

  const decks = [];
  for (const player of [0, 1]) {
    let deck = new PIXI.Container();
    {
      let rect = new PIXI.Graphics();

      rect.beginFill(0x999999);

      rect.drawRoundedRect(0, 0, deckWidth, deckHeight, borderRadius);
      deck.addChild(rect);
    }
    app.stage.addChild(deck);
    decks.push(deck);
  }

  const board = new PIXI.Container();
  let boardWidth = numCols * (cardSide + cardPadding);
  let boardHeight = numCols * (cardSide + cardPadding);
  {
    function onMouseOver(
      this: CellContainer,
      event: PIXI.interaction.InteractionEvent
    ) {
      if (dragTarget) {
        console.log(`has drag target, currently over `, this.cell);
        const { col, row } = this.cell;
        const cs = stateGetCell(state, col, row);
        console.log(`cs = `, cs);
        dragTarget.dragging.over = this;
      }
    }

    for (let i = 0; i < numCols; i++) {
      for (let j = 0; j < numRows; j++) {
        const cellContainer = new PIXI.Container() as CellContainer;
        cellContainer.cell = {
          col: i,
          row: j,
        };
        const cellGfx = new PIXI.Graphics();
        cellGfx.alpha = 0.5;
        cellGfx.beginFill(0xaaaaaa, 0);
        cellGfx.lineStyle(1, 0x000000, 1);
        cellGfx.drawRoundedRect(
          -cardSide / 2,
          -cardSide / 2,
          cardSide,
          cardSide,
          borderRadius
        );
        let x = cardSide / 2 + cardPadding;
        x += i * (cardSide + cardPadding);
        let y = cardSide / 2 + cardPadding;
        y += j * (cardSide + cardPadding);
        cellContainer.addChild(cellGfx);
        cellContainer.position.set(x, y);
        board.addChild(cellContainer);

        cellContainer.interactive = true;
        cellContainer.addListener("pointerover", onMouseOver);
      }
    }
  }

  let cardsContainer = new PIXI.Container();
  {
    function onDragStart(
      this: CardContainer,
      event: PIXI.interaction.InteractionEvent
    ) {
      const { card } = this;
      const parent = this.parent;

      card.dragging = {
        data: event.data,
        pos: new PIXI.Point(this.position.x, this.position.y),
      };
      dragTarget = card;

      this.alpha = 0.5;
      parent.removeChild(this);
      parent.addChild(this);
    }

    function onDragEnd(this: CardContainer) {
      const { card } = this;
      const { over } = card.dragging;
      if (over) {
        const { col, row } = over.cell;
        applyMove({
          player: state.currentPlayer,
          cardId: card.id,
          placement: { col, row },
        });
      }
      card.dragging = null;
      dragTarget = null;
      this.alpha = 1;
    }

    function onDragMove(this: CardContainer) {
      const { card } = this;
      if (card.dragging) {
        card.dragging.pos = card.dragging.data.getLocalPosition(this.parent);
      }
    }

    const allValues = [[1, 2, 3, 4, 5, "L", "U"], [1, 2, 3, 4, 5, "R", "D"]];
    for (const player of [0, 1]) {
      const values = allValues[player];
      for (let i = 0; i < 7; i++) {
        let cardContainer = new PIXI.Container() as CardContainer;
        let cardId = uuidv4();
        let card: Card = {
          player,
          value: values[i],
          id: cardId,
          container: cardContainer,
          placement: {},
          targetPos: new PIXI.Point(0, 0),
        };
        cards[cardId] = card;
        state.decks[player].cells.push({
          cardId,
        });
        let cardGfx = new PIXI.Graphics();
        cardGfx.beginFill(playerColors[player]);
        cardGfx.filters = [new DropShadowFilter()];
        cardGfx.drawRoundedRect(
          -cardSide / 2,
          -cardSide / 2,
          cardSide,
          cardSide,
          borderRadius
        );
        cardContainer.addChild(cardGfx);

        let text = new PIXI.Text(card.value, {
          fontSize: 30,
          fill: "white",
          align: "center",
        });
        text.anchor.set(0.5, 0.5);
        cardContainer.addChild(text);

        cardContainer.interactive = true;
        cardContainer.buttonMode = true;
        cardContainer.card = card;
        cardContainer
          .on("pointerdown", onDragStart)
          .on("pointerup", onDragEnd)
          .on("pointerupoutside", onDragEnd)
          .on("pointermove", onDragMove);

        cardsContainer.addChild(cardContainer);
      }
    }
  }
  app.stage.addChild(cardsContainer);

  app.stage.addChild(board);

  let propagate = () => {
    for (const player of [0, 1]) {
      const { cells } = state.decks[player];
      for (let i = 0; i < cells.length; i++) {
        const cell = cells[i];
        if (cell.cardId) {
          const card = cards[cell.cardId];
          card.placement = {
            deckPlacement: {
              player,
              slot: i,
            },
          };
        }
      }
    }

    for (let col = 0; col < numCols; col++) {
      for (let row = 0; row < numRows; row++) {
        const cell = stateGetCell(state, col, row);
        if (cell.cardId) {
          const card = cards[cell.cardId];
          card.placement = {
            boardPlacement: { col, row },
          };
        }
      }
    }
  };

  let layout = (immediate = false) => {
    let { width, height } = app.renderer;

    {
      let [p1Deck, p2Deck] = decks;
      p1Deck.position.set(width / 2 - deckWidth / 2, deckVertPadding);

      p2Deck.position.set(
        width / 2 - deckWidth / 2,
        height - deckHeight - deckVertPadding
      );
    }

    board.position.set(
      width / 2 - boardWidth / 2,
      height / 2 - boardHeight / 2
    );

    for (const cardId of Object.keys(cards)) {
      const card = cards[cardId];
      if (card.placement.deckPlacement) {
        const dpos = card.placement.deckPlacement;
        const deck = decks[dpos.player];

        let y = deck.position.y + cardPadding + cardSide / 2;
        let x = deck.position.x + cardPadding + cardSide / 2;
        x += dpos.slot * (cardSide + cardPadding);
        card.targetPos.set(x, y);
      } else if (card.placement.boardPlacement) {
        const bpos = card.placement.boardPlacement;
        let x = board.position.x + cardPadding + cardSide / 2;
        x += bpos.col * (cardSide + cardPadding);
        let y = board.position.y + cardPadding + cardSide / 2;
        y += bpos.row * (cardSide + cardPadding);
        card.targetPos.set(x, y);
      }
      if (immediate) {
        let { x, y } = card.targetPos;
        card.container.position.set(x, y);
      }
    }
  };
  propagate();
  layout(true);

  window.addEventListener("resize", () => {
    app.renderer.resize(window.innerWidth, window.innerHeight);
    layout(true);
  });

  const alpha = 0.2;

  PIXI.ticker.shared.autoStart = true;
  PIXI.ticker.shared.add((delta: number) => {
    for (const player of [0, 1]) {
      const deck = decks[player];
      if (player == state.currentPlayer) {
        deck.alpha = deck.alpha * (1 - alpha) + 1 * alpha;
      } else {
        deck.alpha = deck.alpha * (1 - alpha) + 0 * alpha;
      }
    }

    for (const cardId of Object.keys(cards)) {
      const card = cards[cardId];
      if (card.dragging) {
        let { x, y } = card.dragging.pos;
        card.container.position.set(x, y);
      } else {
        let [x, y] = [
          card.container.position.x * (1 - alpha) + card.targetPos.x * alpha,
          card.container.position.y * (1 - alpha) + card.targetPos.y * alpha,
        ];
        card.container.position.set(x, y);
      }
    }
  });

  document.body.appendChild(app.view);
  app.start();
}

document.addEventListener("DOMContentLoaded", () => {
  main();
});
