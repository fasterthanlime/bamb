import { Game } from "./game";
import {
  CellContainer,
  CardContainer,
  Card,
  SumsGraphics,
  DecksGraphics,
  UIContainer,
  BoardContainer,
} from "./types";
import { DropShadowFilter } from "@pixi/filter-drop-shadow";

// export const playerColors = [0x3d9970, 0x001f3f];
export const playerColors = [0x7fdbff, 0xff4136];

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
  const cardSide = 80;
  const cardPadding = 6;
  const cardsInDeck = 8;
  const deckWidth = (cardSide + cardPadding) * cardsInDeck + cardPadding;
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
      gameUI,
    };
  }
}

function createDecks(game: Game): DecksGraphics {
  const D = game.dimensions;

  const decks: DecksGraphics = [];
  for (const player of [0, 1]) {
    let deck = new PIXI.Container();
    let rect = new PIXI.Graphics();
    rect.beginFill(playerColors[player]);
    rect.drawRoundedRect(0, 0, D.deckWidth, D.deckHeight, D.borderRadius);
    deck.addChild(rect);

    let text = new PIXI.Text(`${game.playerName(player)}`, {
      fontSize: 32,
      fontFamily,
      fill: 0xffffff,
    });
    text.anchor.set(0.5, 0.5);
    text.position.set(-60, D.deckHeight / 2);
    deck.addChild(text);

    let clock = new PIXI.Text(Icon.Clock, {
      fontSize: 32,
      fontFamily: "FontAwesome",
      fill: 0xffffff,
    });
    clock.anchor.set(0.5, 0.5);
    clock.alpha = 0;
    clock.position.set(text.position.x, text.position.y + 60);
    deck.addChild(clock);

    decks.push({
      container: deck,
      bg: rect,
      text,
      clock,
    });
    game.container.addChild(deck);
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
      game.setDragTarget(card);

      this.alpha = 0.7;
      parent.removeChild(this);
      parent.addChild(this);
    }

    function onDragEnd(this: CardContainer) {
      const { card } = this;
      if (!card.dragging) {
        return;
      }
      const { over } = card.dragging;
      if (over) {
        const { col, row } = over.cell;
        game.applyMove({
          player: game.state.currentPlayer,
          cardId: card.spec.id,
          placement: { col, row },
        });
      }
      card.dragging = null;
      game.setDragTarget(null);
      this.alpha = 1;
    }

    function onDragMove(this: CardContainer) {
      const { card } = this;
      if (card.dragging) {
        card.dragging.pos = card.dragging.data.getLocalPosition(this.parent);
      }
    }

    for (const cardId of Object.keys(game.cardSpecs)) {
      const spec = game.cardSpecs[cardId];
      const cardContainer = new PIXI.Container() as CardContainer;
      const card: Card = {
        spec,
        container: cardContainer,
        placement: {},
        targetPos: new PIXI.Point(0, 0),
      };
      game.cards[cardId] = card;
      let cardGfx = new PIXI.Graphics();
      cardGfx.beginFill(playerColors[spec.player]);
      {
        // cardGfx.filters = [shadowFilter];
      }
      cardGfx.drawRoundedRect(
        -D.cardSide / 2,
        -D.cardSide / 2,
        D.cardSide,
        D.cardSide,
        D.borderRadius,
      );
      cardContainer.addChild(cardGfx);

      let text = new PIXI.Text(card.spec.value, {
        fontSize: 30,
        fontFamily,
        fill: "white",
        align: "center",
      });
      if (typeof card.spec.value === "string") {
        text.style.fontFamily = "FontAwesome";
        switch (card.spec.value) {
          case "L":
            text.text = Icon.ArrowLeft;
            break;
          case "R":
            text.text = Icon.ArrowRight;
            break;
          case "U":
            text.text = Icon.ArrowUp;
            break;
          case "D":
            text.text = Icon.ArrowDown;
            break;
        }
      }
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
  game.container.addChild(cards);
  return cards;
}

function createBoard(game: Game): BoardContainer {
  const D = game.dimensions;

  const board = new PIXI.Container() as BoardContainer;
  board.highlights = [];
  {
    function onMouseOver(
      this: CellContainer,
      event: PIXI.interaction.InteractionEvent,
    ) {
      game.dragOver(this);
    }

    function onMouseOut(
      this: CellContainer,
      event: PIXI.interaction.InteractionEvent,
    ) {
      game.dragOut(this);
    }

    let cellSide = D.cardSide;
    for (let row = 0; row < game.numRows; row++) {
      for (let col = 0; col < game.numCols; col++) {
        const cellContainer = new PIXI.Container() as CellContainer;
        cellContainer.cell = {
          col,
          row,
        };
        const cellGfx = new PIXI.Graphics();
        cellGfx.alpha = 0.5;
        cellGfx.beginFill(0xaaaaaa, 0);
        cellGfx.lineStyle(1, 0xffffff, 1);
        cellGfx.drawRoundedRect(
          -cellSide / 2,
          -cellSide / 2,
          cellSide,
          cellSide,
          D.borderRadius,
        );
        let x = D.cardSide / 2 + D.cardPadding;
        x += col * (D.cardSide + D.cardPadding);
        let y = D.cardSide / 2 + D.cardPadding;
        y += row * (D.cardSide + D.cardPadding);
        cellContainer.addChild(cellGfx);
        cellContainer.position.set(x, y);
        board.addChild(cellContainer);

        let highlightSide = cellSide + 4;
        let highlight = new PIXI.Graphics();
        highlight.tint = 0xff0000;
        highlight.beginFill(0xffffff, 0.2);
        highlight.drawRoundedRect(
          -highlightSide / 2,
          -highlightSide / 2,
          highlightSide,
          highlightSide,
          D.borderRadius,
        );
        highlight.position.set(x, y);
        board.addChild(highlight);
        board.highlights.push(highlight);

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
      -12,
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
    // restartButton.filters = [shadowFilter];

    restartButton.addChild(createIcon(0, 0, 100, 100, Icon.Refresh, 25, [1]));

    uiContainer.addChild(restartButton);

    uiContainer.interactive = true;
    uiContainer.addListener("pointerup", e => (game.shouldRestart = true));
  }

  game.container.addChild(uiContainer);
  return uiContainer;
}

enum Icon {
  Refresh = "",
  ArrowLeft = "\uf060",
  ArrowRight = "\uf061",
  ArrowUp = "\uf062",
  ArrowDown = "\uf063",
  Clock = "\uf017",
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
    // fill: "#444444",
    fill: "white",
  });
  rBtnText.position.set(
    x + (size * (alignment[0] | 0)) / 2,
    y + (size * (alignment[1] | alignment[0] | 0)) / 2,
  );
  return rBtnText;
}
