import { Game } from "./game";

const alpha = 0.05;

// Step is called every tick
export function step(game: Game, delta: number) {
  for (const player of [0, 1]) {
    const deck = game.displayObjects.decks[player];
    if (player == game.state.currentPlayer) {
      deck.alpha = deck.alpha * (1 - alpha) + 1 * alpha;
    } else {
      deck.alpha = deck.alpha * (1 - alpha) + 0 * alpha;
    }
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
