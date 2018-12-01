import { Game } from "./game";
import { CellContainer, CardContainer, Card } from "./types";
import { DropShadowFilter } from "@pixi/filter-drop-shadow";
import * as uuidv4 from "uuid/v4";

const playerColors = [0xec7d75, 0x75c3ec];

const shadowFilter = new DropShadowFilter();
shadowFilter.alpha = 0.16;
shadowFilter.distance = 1;
shadowFilter.blur = 1;

// Create display objects is called right after a new game is started
export function createDisplayObjects(game: Game) {
  game.container = new PIXI.Container();

  const borderRadius = 16;
  const cardSide = 74;
  const cardPadding = 10;
  const deckWidth = (cardSide + cardPadding) * 7 + cardPadding;
  const deckHeight = cardSide + 2 * cardPadding;
  const deckVertPadding = 8;
  const boardWidth = game.numCols * (cardSide + cardPadding);
  const boardHeight = game.numCols * (cardSide + cardPadding);
  game.dimensions = {
    borderRadius,
    deckWidth,
    deckHeight,
    deckVertPadding,
    cardSide,
    cardPadding,
    boardWidth,
    boardHeight,
  };

  {
    // DO NOT REORDER THIS - order matters
    const decks = createDecks(game);
    const cards = createCards(game);
    const trash = createTrash(game);
    const board = createBoard(game);
    game.displayObjects = { decks, cards, trash, board };
  }
}

function createDecks(game: Game): PIXI.Container[] {
  const D = game.dimensions;

  const decks = [];
  for (const player of [0, 1]) {
    let deck = new PIXI.Container();
    {
      let rect = new PIXI.Graphics();

      rect.beginFill(0x999999);

      rect.drawRoundedRect(0, 0, D.deckWidth, D.deckHeight, D.borderRadius);
      deck.addChild(rect);
    }
    game.container.addChild(deck);
    decks.push(deck);
  }
  return decks;
}

function createCards(game: Game): PIXI.Container {
  const D = game.dimensions;
  let cards = new PIXI.Container();
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
      game.dragTarget = card;

      this.alpha = 0.5;
      parent.removeChild(this);
      parent.addChild(this);
    }

    function onDragEnd(this: CardContainer) {
      const { card } = this;
      const { over } = card.dragging;
      if (over) {
        const { col, row } = over.cell;
        game.applyMove({
          player: game.state.currentPlayer,
          cardId: card.id,
          placement: { col, row },
        });
      }
      card.dragging = null;
      game.dragTarget = null;
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
        game.cards[cardId] = card;
        game.state.decks[player].cells.push({
          cardId,
        });
        let cardGfx = new PIXI.Graphics();
        cardGfx.beginFill(playerColors[player]);
        {
          cardGfx.filters = [shadowFilter];
        }
        cardGfx.drawRoundedRect(
          -D.cardSide / 2,
          -D.cardSide / 2,
          D.cardSide,
          D.cardSide,
          D.borderRadius
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

        cards.addChild(cardContainer);
      }
    }
  }
  game.container.addChild(cards);
  return cards;
}

function createBoard(game: Game): PIXI.Container {
  const D = game.dimensions;

  const board = new PIXI.Container();
  {
    function onMouseOver(
      this: CellContainer,
      event: PIXI.interaction.InteractionEvent
    ) {
      if (game.dragTarget) {
        console.log(`has drag target, currently over `, this.cell);
        const { col, row } = this.cell;
        const cs = game.stateGetCell(game.state, col, row);
        console.log(`cs = `, cs);
        game.dragTarget.dragging.over = this;
      }
    }

    for (let i = 0; i < game.numCols; i++) {
      for (let j = 0; j < game.numRows; j++) {
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
          -D.cardSide / 2,
          -D.cardSide / 2,
          D.cardSide,
          D.cardSide,
          D.borderRadius
        );
        let x = D.cardSide / 2 + D.cardPadding;
        x += i * (D.cardSide + D.cardPadding);
        let y = D.cardSide / 2 + D.cardPadding;
        y += j * (D.cardSide + D.cardPadding);
        cellContainer.addChild(cellGfx);
        cellContainer.position.set(x, y);
        board.addChild(cellContainer);

        cellContainer.interactive = true;
        cellContainer.addListener("pointerover", onMouseOver);
      }
    }
  }
  game.container.addChild(board);
  return board;
}

function createTrash(game: Game): PIXI.Container {
  const trash = new PIXI.Container();
  {
    let text = new PIXI.Text("trash");
    trash.addChild(text);
  }
  return trash;
}
