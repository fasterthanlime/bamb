import * as PIXI from "pixi.js";
import * as uuidv4 from "uuid/v4";
import "./main.css";

interface CardDeckPosition {
  player: number;
  slot: number;
}

interface CardPosition {
  deckPosition?: CardDeckPosition;
}

interface Card {
  player: number;
  value: any;
  id: string;
  container: PIXI.Container;
  pos: CardPosition;
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

  let playerColors = [0xff8888, 0x8888ff];

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

  let cardsContainer = new PIXI.Container();
  let cards: { [key: string]: Card } = {};
  {
    function onDragStart(event) {
      // store a reference to the data
      // the reason for this is because of multitouch
      // we want to track the movement of this particular touch
      this.data = event.data;
      this.alpha = 0.5;
      this.dragging = true;
      let parent = this.parent;
      parent.removeChild(this);
      parent.addChild(this);
    }

    function onDragEnd() {
      this.alpha = 1;
      this.dragging = false;
      // set the interaction data to null
      this.data = null;
      layout();
    }

    function onDragMove() {
      if (this.dragging) {
        var newPosition = this.data.getLocalPosition(this.parent);
        this.x = newPosition.x;
        this.y = newPosition.y;
      }
    }

    const allValues = [[1, 2, 3, 4, 5, "L", "U"], [1, 2, 3, 4, 5, "R", "D"]];
    for (const player of [0, 1]) {
      const values = allValues[player];
      for (let i = 0; i < 7; i++) {
        let cardContainer = new PIXI.Container();
        let cardId = uuidv4();
        let card: Card = {
          player,
          value: values[i],
          id: cardId,
          container: cardContainer,
          pos: {
            deckPosition: {
              player,
              slot: i,
            },
          },
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

  let layout = () => {
    let { width, height } = app.renderer;

    {
      let [p1Deck, p2Deck] = decks;
      p1Deck.position.set(width * 0.5 - deckWidth * 0.5, deckVertPadding);

      p2Deck.position.set(
        width * 0.5 - deckWidth * 0.5,
        height - deckHeight - deckVertPadding
      );
    }

    for (const cardId of Object.keys(cards)) {
      const card = cards[cardId];
      if (card.pos.deckPosition) {
        const dpos = card.pos.deckPosition;
        const deck = decks[dpos.player];

        let y = deck.position.y + cardPadding + cardSide / 2;
        let x = deck.position.x + cardPadding + cardSide / 2;
        x += dpos.slot * (cardSide + cardPadding);
        card.container.position.set(x, y);
      }
    }
  };
  layout();

  window.addEventListener("resize", () => {
    app.renderer.resize(window.innerWidth, window.innerHeight);
    layout();
  });

  document.body.appendChild(app.view);
  app.start();
}

document.addEventListener("DOMContentLoaded", () => {
  main();
});
