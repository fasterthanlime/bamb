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
      const cell = game.boardGetCell(game.state.board, col, row);
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

  let setSum = (textObj: PIXI.Text, sum: number) => {
    textObj.text = `${sum}`;
    if (sum > game.maxSum) {
      textObj.style.fill = "red";
      textObj.style.fontSize = 28;
    } else if (sum + 3 > game.maxSum) {
      textObj.style.fill = "orange";
      textObj.style.fontSize = 24;
    } else {
      textObj.style.fill = "green";
      textObj.style.fontSize = 20;
    }
  };

  for (let col = 0; col < game.numCols; col++) {
    const sum = game.boardSumCol(game.state.board, col);
    let textObj = game.displayObjects.sums.cols[col];
    setSum(textObj, sum);
  }

  for (let row = 0; row < game.numRows; row++) {
    const sum = game.boardSumRow(game.state.board, row);
    let textObj = game.displayObjects.sums.rows[row];
    setSum(textObj, sum);
  }
}
