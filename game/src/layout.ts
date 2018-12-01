import { Game } from "./game";

export function layout(game: Game, immediate = false) {
  let { width, height } = game.app.renderer;
  const D = game.dimensions;

  {
    let [p1Deck, p2Deck] = game.displayObjects.decks;
    p1Deck.position.set(width / 2 - D.deckWidth / 2, D.deckVertPadding);

    p2Deck.position.set(
      width / 2 - D.deckWidth / 2,
      height - D.deckHeight - D.deckVertPadding
    );
  }

  const board = game.displayObjects.board;
  board.position.set(
    width / 2 - D.boardWidth / 2,
    height / 2 - D.boardHeight / 2
  );

  for (const cardId of Object.keys(game.cards)) {
    const card = game.cards[cardId];
    if (card.placement.deckPlacement) {
      const dpos = card.placement.deckPlacement;
      const deck = game.displayObjects.decks[dpos.player];

      let y = deck.position.y + D.cardPadding + D.cardSide / 2;
      let x = deck.position.x + D.cardPadding + D.cardSide / 2;
      x += dpos.slot * (D.cardSide + D.cardPadding);
      card.targetPos.set(x, y);
    } else if (card.placement.boardPlacement) {
      const bpos = card.placement.boardPlacement;
      let x = board.position.x + D.cardPadding + D.cardSide / 2;
      x += bpos.col * (D.cardSide + D.cardPadding);
      let y = board.position.y + D.cardPadding + D.cardSide / 2;
      y += bpos.row * (D.cardSide + D.cardPadding);
      card.targetPos.set(x, y);
    }
    if (immediate) {
      let { x, y } = card.targetPos;
      card.container.position.set(x, y);
    }
  }
}
