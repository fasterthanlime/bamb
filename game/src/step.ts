import { quickPlay } from "./constants";
import { Game, PlayerKind } from "./game";
import { layout } from "./layout";
import { propagate } from "./propagate";
import { GameSnapshot } from "./rules/consequences";

const alpha = 0.15;

// Step is called every tick
export function step(game: Game, delta: number) {
  let loopScale = (o: PIXI.DisplayObject) => {
    let scale = o.scale.x;
    scale += delta * 0.005;
    if (scale > 1) {
      scale = 0.75;
    }
    o.scale.set(scale, scale);
  };

  if (game.phase.transitionPhase) {
    const tp = game.phase.transitionPhase;
    const { cons, nextState } = tp;
    let firstNonZeroSnap: GameSnapshot;
    for (const snap of cons.snaps) {
      if (snap.millis > 0) {
        firstNonZeroSnap = snap;
        break;
      }
    }

    if (firstNonZeroSnap) {
      if (game.currentSnapshot != firstNonZeroSnap) {
        game.currentSnapshot = firstNonZeroSnap;
        game.state = firstNonZeroSnap.state;
        propagate(game);
        layout(game);
      }

      let msElapsed = (delta * 1000) / 60;
      firstNonZeroSnap.millis -= msElapsed;
      if (quickPlay) {
        firstNonZeroSnap.millis = 0;
      }
    } else {
      game.state = nextState;
      game.phase = {
        movePhase: {},
      };
      game.currentSnapshot = null;
      game.checkEnd();
      game.tutorialNext(true);
      propagate(game);
      layout(game);
    }
  }

  {
    for (let row = 0; row < game.numRows; row++) {
      let textObj = game.displayObjects.sums.rows[row];
      loopScale(textObj);
    }
    for (let col = 0; col < game.numCols; col++) {
      let textObj = game.displayObjects.sums.cols[col];
      loopScale(textObj);
    }
  }

  for (const player of [0, 1]) {
    const deck = game.displayObjects.decks[player];
    let targetAlpha = 1;

    if (game.phase.movePhase) {
      if (player == game.state.currentPlayer) {
        targetAlpha = 0.2;
      }
    }
    deck.bg.alpha = deck.bg.alpha * (1 - alpha) + targetAlpha * alpha;
  }

  for (const cardId of Object.keys(game.cards)) {
    const card = game.cards[cardId];
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

  for (const player of [0, 1]) {
    const clock = game.displayObjects.decks[player].clock;
    clock.alpha = 0;
  }

  const csi = game.currentScriptItem();
  if (game.phase.movePhase && !csi) {
    let player = game.state.currentPlayer;
    let currentPlayer = game.players[player];
    if (currentPlayer.kind === PlayerKind.AI) {
      const clock = game.displayObjects.decks[player].clock;
      clock.alpha = 1;
      let scale = clock.scale.x;
      scale += delta * 0.005;
      if (scale > 1) {
        scale = 0.7;
      }
      clock.scale.set(scale, scale);
    }
  }

  if (csi) {
    let forward = game.displayObjects.tutorialUI.forward;
    if (csi.move) {
      forward.alpha = -1000;
    } else {
      loopScale(forward);
      forward.alpha = lerp(forward.alpha, 1, 0.1);
    }
  }
}

function lerp(a: number, b: number, t: number): number {
  return a * (1 - t) + b * t;
}
