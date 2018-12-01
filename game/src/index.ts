import * as PIXI from "pixi.js";
import "./main.css";

function main() {
  const app = new PIXI.Application({
    width: window.innerWidth,
    height: window.innerHeight,
    antialias: true,
  });
  app.renderer.backgroundColor = 0xfff1f1f1;

  let deckWidth = 600;
  let deckHeight = 70;
  let deckVertPadding = 8;
  let fontSize = 14;

  let p1Deck = new PIXI.Container();
  {
    let rect = new PIXI.Graphics();
    rect.beginFill(0xff4444);
    rect.drawRoundedRect(0, 0, deckWidth, deckHeight, 4);
    p1Deck.addChild(rect);

    let text = new PIXI.Text("Player 1", {
      fontSize,
      fill: "white",
      align: "center",
    });
    text.position.set(4, 4);
    p1Deck.addChild(text);
  }
  app.stage.addChild(p1Deck);

  let p2Deck = new PIXI.Container();
  {
    let rect = new PIXI.Graphics();
    rect.beginFill(0x4444ff);
    rect.drawRoundedRect(0, 0, deckWidth, deckHeight, 4);
    p2Deck.addChild(rect);

    let text = new PIXI.Text("Player 2", {
      fontSize,
      fill: "white",
      align: "center",
    });
    text.position.set(4, 4);
    p2Deck.addChild(text);
  }
  app.stage.addChild(p2Deck);

  let layout = () => {
    let { width, height } = app.renderer;
    p1Deck.position.set(width * 0.5 - deckWidth * 0.5, deckVertPadding);

    p2Deck.position.set(
      width * 0.5 - deckWidth * 0.5,
      height - deckHeight - deckVertPadding
    );
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
