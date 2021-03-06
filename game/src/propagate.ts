import { Game, PlayerKind } from "./game";
import { computeScore } from "./ai/compute-score";
import { play } from "./rules/play";
import { nullConsequences } from "./rules/consequences";
import { placeCard } from "./rules/place-card";
import { playerColors, Icon, fontFamily } from "./create-display-objects";
import { Move } from "./types";

// Translates `game.state` into `game.cards`,
// usually running after playing a move.
export function propagate(game: Game) {
  let csi = game.currentScriptItem();
  game.displayObjects.tutorialUI.interactive = csi && !!csi.text;

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
    if (csi) {
      if (csi.move) {
        const currentDeck = game.state.decks[game.state.currentPlayer].cells;
        for (const c of currentDeck) {
          if (c.cardId) {
            let card = game.cardSpecs[c.cardId];
            if (card.value === csi.move.value) {
              draggableCardIds[c.cardId] = true;
            }
          }
        }
      }
    } else {
      const currentDeck = game.state.decks[game.state.currentPlayer].cells;
      for (const c of currentDeck) {
        if (c.cardId) {
          draggableCardIds[c.cardId] = true;
        }
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
    textObj.style.fontFamily = fontFamily;
    textObj.alpha = 1;
    if (typeof sum === "string") {
      textObj.style.fill = "white";
      textObj.style.fontSize = 32;
      textObj.style.fontFamily = "FontAwesome";
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

  let highlightCleared = () => {
    const card = game.dragTarget;
    if (!card) {
      return;
    }
    const drop = game.dragTarget.dragging.over;
    if (!drop) {
      return;
    }
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
      // invalid move, nothing to do
    } else {
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
  };

  if (game.phase.transitionPhase) {
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
  } else if (csi && csi.move) {
    let { col, row } = csi.move.placement;
    let highlight =
      game.displayObjects.board.highlights[game.cellIndex(col, row)];
    highlight.alpha = 1;

    if (game.dragTarget && game.dragTarget.dragging.over) {
      {
        const cell = game.dragTarget.dragging.over.cell;
        if (cell.col == col && cell.row == row) {
          highlightCleared();
        } else {
          // invalid move, highlight invalid cell
          let highlight =
            game.displayObjects.board.highlights[
              game.cellIndex(cell.col, cell.row)
            ];
          highlight.tint = 0xff0000;
          highlight.alpha = 1;
        }
      }
    }
  } else if (game.dragTarget && game.dragTarget.dragging.over) {
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
    } else {
      // valid move, highlight target cell
      {
        const { col, row } = drop.cell;
        let highlight =
          game.displayObjects.board.highlights[game.cellIndex(col, row)];
        highlight.alpha = 1;
      }
    }

    highlightCleared();
  }

  if (game.currentSnapshot) {
    if (game.currentSnapshot.clearedCol) {
      let cc = game.currentSnapshot.clearedCol;
      let textObj = game.displayObjects.sums.cols[cc.col];
      setSum(textObj, Icon.ArrowDown);
    }
    if (game.currentSnapshot.clearedRow) {
      let cr = game.currentSnapshot.clearedRow;
      let textObj = game.displayObjects.sums.rows[cr.row];
      setSum(textObj, Icon.ArrowRight);
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
    if (score >= otherScore) {
      t.tint = playerColors[player];
      t.scale.set(1, 1);
    } else {
      t.tint = 0xaaaaaa;
      t.scale.set(0.7, 0.7);
    }
  }

  let tui = game.displayObjects.tutorialUI;
  if (csi) {
    if (csi.text) {
      tui.alpha = 1;
    }
  } else {
    tui.alpha = 0;
  }

  if (game.phase.movePhase) {
    if (currentPlayer.kind == PlayerKind.AI) {
      if (csi) {
        if (csi.move) {
          let deck = game.state.decks[game.state.currentPlayer];
          let cardId: any;
          for (const c of deck.cells) {
            if (c.cardId) {
              let card = game.cardSpecs[c.cardId];
              if (card.value === csi.move.value) {
                cardId = card.id;
                break;
              }
            }
          }
          let move: Move = {
            cardId,
            placement: csi.move.placement,
            player: game.state.currentPlayer,
          };
          game.applyMove(move);
        }
      } else {
        if (!game.sentAIRequest) {
          game.sentAIRequest = true;
          console.warn("Sending processAI...");
          game.sendWorkerMessage({
            task: "processAI",
            gameMessage: game.toMessage(),
          });
        }
      }
    }
  }
}
