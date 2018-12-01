import { Game } from "./game";

export function layout(game: Game, immediate = false) {
  let { width, height } = game.app.renderer;
  const D = game.dimensions;

  {
    let [p1Deck, p2Deck] = game.displayObjects.decks;
    p1Deck.position.set(width / 2 - D.deckWidth / 2, D.deckVertPadding);

    p2Deck.position.set(
      width / 2 - D.deckWidth / 2,
      height - D.deckHeight - D.deckVertPadding,
    );
  }

  const board = game.displayObjects.board;
  board.position.set(
    width / 2 - D.boardWidth / 2,
    height / 2 - D.boardHeight / 2,
  );

  game.displayObjects.sums.container.position.set(
    board.position.x,
    board.position.y,
  );

  {
    const trash = game.displayObjects.trash;
    trash.position.set(D.cardPadding + D.cardSide / 2, height / 2);
  }

  for (const cardId of Object.keys(game.cards)) {
    const card = game.cards[cardId];
    if (card.placement.deckPlacement) {
      const place = card.placement.deckPlacement;
      const deck = game.displayObjects.decks[place.player];

      let y = deck.position.y + D.cardPadding + D.cardSide / 2;
      let x = deck.position.x + D.cardPadding + D.cardSide / 2;
      x += place.slot * (D.cardSide + D.cardPadding);
      card.targetPos.set(x, y);
    } else if (card.placement.boardPlacement) {
      const place = card.placement.boardPlacement;
      let x = board.position.x + D.cardPadding + D.cardSide / 2;
      x += place.col * (D.cardSide + D.cardPadding);
      let y = board.position.y + D.cardPadding + D.cardSide / 2;
      y += place.row * (D.cardSide + D.cardPadding);
      card.targetPos.set(x, y);
    } else if (card.placement.trashPlacement) {
      const place = card.placement.trashPlacement;
      const trash = game.displayObjects.trash;
      card.targetPos.set(
        trash.position.x,
        trash.position.y + D.cardPadding * place.index,
      );
    }
    if (immediate) {
      let { x, y } = card.targetPos;
      card.container.position.set(x, y);
    }
  }
}
