import * as PIXI from "pixi.js";

function main() {
  const app = new PIXI.Application({
    antialias: true
  });
  app.renderer.backgroundColor = 0xfff1f1f1;

  let text = new PIXI.Text("WebGL sacrifices!!!");
  text.position.set(30, 30);
  app.stage.addChild(text);

  document.body.appendChild(app.view);
  app.start();
}

document.addEventListener("DOMContentLoaded", () => {
  main();
});
