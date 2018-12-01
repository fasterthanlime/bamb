import * as PIXI from "pixi.js";
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
  cardIds: string[];
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
  let cardPadding = 8;
  let deckWidth = (cardSide + cardPadding) * 7 + cardPadding;
  let deckHeight = cardSide + 2 * cardPadding;
  let deckVertPadding = 8;
  let fontSize = 14;

  let numCols = 4;
  let numRows = 4;

  let playerColors = [0xff8888, 0x8888ff];
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

  let gameState: GameState = {
    board: emptyBoard(numCols, numRows),
    decks: [{ cardIds: [] }, { cardIds: [] }],
  };

  const decks = [];
  for (const player of [0, 1]) {
    let deck = new PIXI.Container();
    {
      let rect = new PIXI.Graphics();
      rect.lineStyle(2, 0x999999, 1);
      rect.beginFill(0xaaaaaa);
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
        dragTarget.dragging.over = this;
      } else {
        console.warn(`no drag target! currently over `, this.cell);
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
  let cards: { [key: string]: Card } = {};
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
        card.placement = {
          boardPlacement: {
            col,
            row,
          },
        };
        layout();
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
          placement: {
            deckPlacement: {
              player,
              slot: i,
            },
          },
          targetPos: new PIXI.Point(0, 0),
        };
        cards[cardId] = card;
        let cardGfx = new PIXI.Graphics();
        cardGfx.lineStyle(1, 0xffffff, 1);
        cardGfx.beginFill(playerColors[player]);
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

  let layout = () => {
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
    }
  };
  layout();

  window.addEventListener("resize", () => {
    app.renderer.resize(window.innerWidth, window.innerHeight);
    layout();
  });

  const alpha = 0.2;

  PIXI.ticker.shared.autoStart = true;
  PIXI.ticker.shared.add((delta: number) => {
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
