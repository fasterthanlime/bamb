import draw from "./sfx/draw.ogg";
import deal from "./sfx/deal.ogg";

let trackPath = (path: string) => {
  return path.replace(/^\//, "");
};

import { Howl, Howler } from "howler";

import * as _ from "underscore";

export class Blepper {
  dealSfx: Howl[];
  drawSfx: Howl[];

  constructor() {
    this.dealSfx = [new Howl({ src: trackPath(deal) })];

    this.drawSfx = [new Howl({ src: trackPath(draw) })];
  }

  playDealSfx() {
    _.sample<Howl>(this.dealSfx).play();
  }

  playDrawSfx() {
    _.sample<Howl>(this.drawSfx).play();
  }
}
