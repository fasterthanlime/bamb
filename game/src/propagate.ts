import { Game, PlayerKind } from "./game";
import { computeScore } from "./ai/compute-score";
import { play } from "./rules/play";
import { nullConsequences } from "./rules/consequences";
import { placeCard } from "./rules/place-card";
import { playerColors } from "./create-display-objects";

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
  let currentPlayer = game.players[game.state.currentPlayer];
  if (currentPlayer.kind == PlayerKind.Human) {
    const currentDeck = game.state.decks[game.state.currentPlayer].cells;
    for (const c of currentDeck) {
      if (c.cardId) {
        draggableCardIds[c.cardId] = true;
      }
    }
  }

  for (const cardId of Object.keys(game.cards)) {
    const card = game.cards[cardId];
    card.container.interactive = draggableCardIds[card.spec.id];
  }

  let setSum = (textObj: PIXI.Text, sum: any) => {
    textObj.text = `${sum}`;
    textObj.style.fontSize = 28;
    textObj.alpha = 1;
    if (sum === "x") {
      textObj.style.fill = "red";
    } else if (sum === game.maxSum) {
      textObj.style.fill = "orange";
    } else {
      textObj.alpha = 0;
      textObj.style.fill = "black";
    }
  };

  // clear highlights by default
  for (const highlight of game.displayObjects.board.highlights) {
    highlight.alpha = 0;
    // highlight.tint = 0xffdc00; // yellow
    highlight.tint = 0xffffff;
  }

  {
    for (let row = 0; row < game.numRows; row++) {
      let textObj = game.displayObjects.sums.rows[row];
      setSum(textObj, 0);
    }
    for (let col = 0; col < game.numCols; col++) {
      let textObj = game.displayObjects.sums.cols[col];
      setSum(textObj, 0);
    }
  }

  if (game.dragTarget && game.dragTarget.dragging.over) {
    const card = game.dragTarget;
    const drop = game.dragTarget.dragging.over;
    let nextState = placeCard(
      game,
      game.state,
      {
        cardId: card.spec.id,
        placement: { col: drop.cell.col, row: drop.cell.row },
        player: game.state.currentPlayer,
      },
      nullConsequences,
    );

    if (nextState === game.state) {
      // invalid move, highlight invalid cell
      {
        const { col, row } = drop.cell;
        let highlight =
          game.displayObjects.board.highlights[game.cellIndex(col, row)];
        highlight.tint = 0xff0000;
        highlight.alpha = 1;
      }

      for (let col = 0; col < game.numCols; col++) {
        let textObj = game.displayObjects.sums.cols[col];
        setSum(textObj, 0);
      }
      for (let row = 0; row < game.numRows; row++) {
        let textObj = game.displayObjects.sums.rows[row];
        setSum(textObj, 0);
      }
    } else {
      // valid move, highlight target cell
      {
        const { col, row } = drop.cell;
        let highlight =
          game.displayObjects.board.highlights[game.cellIndex(col, row)];
        highlight.alpha = 1;
      }

      for (let col = 0; col < game.numCols; col++) {
        const sum = game.boardSumCol(nextState.board, col);
        let textObj = game.displayObjects.sums.cols[col];
        setSum(textObj, sum);

        if (sum === game.maxSum) {
          for (let row = 0; row < game.numRows; row++) {
            let highlight =
              game.displayObjects.board.highlights[game.cellIndex(col, row)];
            highlight.alpha = 1;
          }
        }
      }

      for (let row = 0; row < game.numRows; row++) {
        const sum = game.boardSumRow(nextState.board, row);
        let textObj = game.displayObjects.sums.rows[row];
        setSum(textObj, sum);

        if (sum === game.maxSum) {
          for (let col = 0; col < game.numCols; col++) {
            let highlight =
              game.displayObjects.board.highlights[game.cellIndex(col, row)];
            highlight.alpha = 1;
          }
        }
      }
    }
  } else if (game.phase.transitionPhase) {
    let tp = game.phase.transitionPhase;

    for (const col of tp.cons.colsCleared) {
      for (let row = 0; row < game.numRows; row++) {
        let highlight =
          game.displayObjects.board.highlights[game.cellIndex(col, row)];
        highlight.alpha = 1;
      }
    }

    for (const row of tp.cons.rowsCleared) {
      for (let col = 0; col < game.numCols; col++) {
        let highlight =
          game.displayObjects.board.highlights[game.cellIndex(col, row)];
        highlight.alpha = 1;
      }
    }
  }

  let dex = game.displayObjects.decks;
  let scores = [0, 0];
  for (const player of [0, 1]) {
    scores[player] = computeScore(game, game.state, player);
  }

  for (const player of [0, 1]) {
    let score = scores[player];
    let otherScore = scores[1 - player];
    let t = dex[player].text;
    t.text = `${score} pts`;
    if (score > otherScore) {
      t.tint = playerColors[player];
      t.scale.set(1, 1);
    } else {
      t.tint = 0xaaaaaa;
      t.scale.set(0.7, 0.7);
    }
  }

  if (game.phase.movePhase) {
    if (currentPlayer.kind == PlayerKind.AI) {
      // let cp = game.state.currentPlayer;
      // let dex = game.displayObjects.decks;
      // dex[1 - cp].text.text = "AI's thinking...";
      console.warn(`Sending processAI request...`);
      game.sendWorkerMessage({
        task: "processAI",
        gameMessage: game.toMessage(),
      });
    }
  }
}
