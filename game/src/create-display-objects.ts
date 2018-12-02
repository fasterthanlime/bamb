import { Game } from "./game";
import {
  CellContainer,
  CardContainer,
  Card,
  SumsGraphics,
  UIContainer,
} from "./types";
import { DropShadowFilter } from "@pixi/filter-drop-shadow";
import * as uuidv4 from "uuid/v4";

const playerColors = [0xec7d75, 0x75c3ec];

export const fontFamily = "Roboto";
export const iconFontFamily = "FontAwesome";

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
  const cardsInDeck = 11;
  const deckWidth = (cardSide + cardPadding) * 11 + cardPadding;
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
    const sums = createSums(game);

    // UI modules
    const gameUI = createGameUI(game);
    // TODO: main menu
    //    const menuUI = createMenuUI(game);

    game.displayObjects = {
      decks,
      cards,
      trash,
      board,
      sums,
      ui: [gameUI],
    };
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
      event: PIXI.interaction.InteractionEvent,
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

    const allValues = [[1, 2, 3, 4, 5, 6, 7], [1, 2, 3, 4, 5, 6, 7]];
    for (const player of [0, 1]) {
      const values = allValues[player];
      for (let i = 0; i < values.length; i++) {
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
          D.borderRadius,
        );
        cardContainer.addChild(cardGfx);

        let text = new PIXI.Text(card.value, {
          fontSize: 30,
          fontFamily,
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
      event: PIXI.interaction.InteractionEvent,
    ) {
      if (game.dragTarget) {
        const { col, row } = this.cell;
        const cs = game.boardGetCell(game.state.board, col, row);
        game.dragTarget.dragging.over = this;
      }
    }

    function onMouseOut(
      this: CellContainer,
      event: PIXI.interaction.InteractionEvent,
    ) {
      if (game.dragTarget) {
        if (game.dragTarget.dragging.over == this) {
          game.dragTarget.dragging.over = null;
        }
      }
    }

    let cellSide = D.cardSide;
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
          -cellSide / 2,
          -cellSide / 2,
          cellSide,
          cellSide,
          D.borderRadius,
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
        cellContainer.addListener("pointerout", onMouseOut);
      }
    }
  }
  game.container.addChild(board);
  return board;
}

function createTrash(game: Game): PIXI.Container {
  const trash = new PIXI.Container();
  return trash;
}

function createSums(game: Game): SumsGraphics {
  const D = game.dimensions;

  const container = new PIXI.Container();
  let sums: SumsGraphics = {
    container,
    cols: [],
    rows: [],
  };

  for (let col = 0; col < game.numCols; col++) {
    let text = new PIXI.Text(`col ${col + 1}`, {
      fontSize: 20,
      fontFamily,
    });
    text.anchor.set(0.5, 0.5);
    text.position.set(
      D.cardSide / 2 + D.cardPadding + (D.cardSide + D.cardPadding) * col,
      -8,
    );
    container.addChild(text);
    sums.cols.push(text);
  }
  for (let row = 0; row < game.numCols; row++) {
    let text = new PIXI.Text(`row ${row + 1}`, {
      fontSize: 20,
      fontFamily,
    });
    text.anchor.set(0.5, 0.5);
    text.position.set(
      -24,
      D.cardSide / 2 + D.cardPadding + (D.cardSide + D.cardPadding) * row,
    );
    container.addChild(text);
    sums.rows.push(text);
  }
  game.container.addChild(container);
  return sums;
}

function createGameUI(game: Game): UIContainer {
  const D = game.dimensions;

  const uiContainer = new PIXI.Container();
  {
    let restartButton = new PIXI.Graphics();
    restartButton.beginFill(0xffffff);
    restartButton.drawRoundedRect(1250, 700, 50, 50, 10);
    restartButton.filters = [shadowFilter];

    restartButton.addChild(
      createIcon(1250, 700, 100, 100, Icon.Refresh, 25, [1]),
    );

    uiContainer.addChild(restartButton);

    uiContainer.interactive = true;
    uiContainer.addListener("pointerup", e => (game.shouldRestart = true));
  }

  game.container.addChild(uiContainer);
  return uiContainer;
}

enum Icon {
  Refresh = "",
}

function createIcon(
  x: number,
  y: number,
  w: number,
  h: number,
  icon: Icon,
  size: number,
  alignment: number[],
): PIXI.Text {
  let rBtnText = new PIXI.Text(icon, {
    fontFamily: iconFontFamily,
    fontSize: size,
    align: "center",
    fill: "#444444",
  });
  rBtnText.position.set(
    x + (size * (alignment[0] | 0)) / 2,
    y + (size * (alignment[1] | alignment[0] | 0)) / 2,
  );
  return rBtnText;
}
