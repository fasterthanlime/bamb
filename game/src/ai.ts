import { Game } from "./game";
import { GameState, Move } from "./types";

function calculateBestMove(
  game: Game,
  state: GameState,
  depth: Number,
  baseMove: Move,
): Move {
  let deck = state.decks[game.state.currentPlayer];

  let bestMove = {
    player: game.state.currentPlayer,
    cardId: null,
    placement: { row: 0, col: 0 },
  };
  let bestScore = -99;

  if (baseMove) {
    bestMove = baseMove;
  }

  // goes over all the deck cards
  for (let deckCard of deck.cells) {
    if (deckCard.cardId) {
      let card = game.cards[deckCard.cardId];

      if (typeof card.value === "number") {
        // checks the entire board to see if it can be placed
        for (let x = 0; x < game.numRows; x++) {
          for (let y = 0; y < game.numCols; y++) {
            // Does this current cell already occupy a card? If not, try placing (TODO: modifiers)
            if (!state.board.cells[x * game.numRows + y].cardId) {
              let newState = game.boardSetCard(
                state.board,
                { row: x, col: y },
                card.id,
              );

              let tilesOwned = 0;
              let valueOwned = 0;

              for (let j = 0; j < newState.cells.length; j++) {
                if (newState.cells[j].cardId) {
                  let card = game.cards[newState.cells[j].cardId];
                  if (j == x || j % y == 1) {
                    if (card.player != state.currentPlayer) {
                      tilesOwned++;
                      valueOwned += card.value;
                    }
                  }
                }
              }

              let newMove = {
                cardId: card.id,
                player: bestMove.player,
                placement: { col: y, row: x },
              };

              let newScore = valueOwned;
              newScore -= dist(7, game.boardSumCol(newState, y));
              newScore -= dist(7, game.boardSumRow(newState, x));

              console.log(`score for [${x}:${y}] is ${newScore}`);

              if (newScore >= bestScore) {
                bestMove = newMove;
                bestScore = newScore;
              }
            }
          }
        }
      } else if (typeof card.value === "string") {
        // TODO: modifier cards.
      }
    }
  }
  return bestMove;
}

function dist(x: number, y: number): number {
  return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
}

export function processAI(game: Game, depth: number) {
  let move = calculateBestMove(
    game,
    game.state,
    game.players[game.state.currentPlayer],
    null,
  );

  if (move.cardId) {
    game.applyMove(move);
  } else {
    // game end
  }
}
