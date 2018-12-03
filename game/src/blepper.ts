import pickUp1 from "./sfx/pickup1.ogg";
import pickUp2 from "./sfx/pickup2.ogg";
import pickUp3 from "./sfx/pickup3.ogg";
import pickUp4 from "./sfx/pickup4.ogg";
import drop1 from "./sfx/drop1.ogg";
import drop2 from "./sfx/drop2.ogg";
import drop3 from "./sfx/drop3.ogg";
import drop4 from "./sfx/drop4.ogg";
let trackPath = (path: string) => {
  return path.replace(/^\//, "");
};

import { Howl, Howler } from "howler";

import * as _ from "underscore";

export class Blepper {
  dropSfx: Howl[];
  pickUpSfx: Howl[];

  constructor() {
    this.dropSfx = [
      new Howl({ src: trackPath(drop1) }),
      new Howl({ src: trackPath(drop2) }),
      new Howl({ src: trackPath(drop3) }),
      new Howl({ src: trackPath(drop4) }),
    ];

    this.pickUpSfx = [
      new Howl({ src: trackPath(pickUp1) }),
      new Howl({ src: trackPath(pickUp2) }),
      new Howl({ src: trackPath(pickUp3) }),
      new Howl({ src: trackPath(pickUp4) }),
    ];
  }

  playDropSfx() {
    _.sample<Howl>(this.dropSfx).play();
  }

  playPickUpSfx() {
    _.sample<Howl>(this.dropSfx).play();
  }
}
