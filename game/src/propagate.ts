import { Game } from "./game";

// Translates `game.state` into `game.cards`,
// usually running after playing a move.
export function propagate(game: Game) {
  for (const player of [0, 1]) {
    const { cells } = game.state.decks[player];
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      if (cell.cardId) {
        const card = game.cards[cell.cardId];
        card.placement = {
          deckPlacement: {
            player,
            slot: i,
          },
        };
      }
    }
  }

  for (let col = 0; col < game.numCols; col++) {
    for (let row = 0; row < game.numRows; row++) {
      const cell = game.stateGetCell(game.state, col, row);
      if (cell.cardId) {
        const card = game.cards[cell.cardId];
        card.placement = {
          boardPlacement: { col, row },
        };
      }
    }
  }

  for (let i = 0; i < game.state.board.trashedCardIds.length; i++) {
    let cardId = game.state.board.trashedCardIds[i];
    const card = game.cards[cardId];
    card.placement = {
      trashPlacement: {
        index: i,
      },
    };

    {
      let parent = card.container.parent;
      parent.removeChild(card.container);
      parent.addChild(card.container);
    }
  }

  let draggableCardIds = {};
  const currentDeck = game.state.decks[game.state.currentPlayer].cells;
  for (const c of currentDeck) {
    if (c.cardId) {
      draggableCardIds[c.cardId] = true;
    }
  }

  for (const cardId of Object.keys(game.cards)) {
    const card = game.cards[cardId];
    card.container.interactive = draggableCardIds[card.id];
  }
}
