import { Game } from "./game";
import { GameSnapshot } from "./rules/consequences";
import { layout } from "./layout";
import { propagate } from "./propagate";

const alpha = 0.15;

// Step is called every tick
export function step(game: Game, delta: number) {
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
    } else {
      game.state = nextState;
      game.phase = {
        movePhase: {},
      };
      propagate(game);
      layout(game);
    }
  }

  for (const player of [0, 1]) {
    const deck = game.displayObjects.decks[player];
    let targetAlpha = 1;

    if (game.phase.movePhase) {
      if (player == game.state.currentPlayer) {
        targetAlpha = 0;
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
}
