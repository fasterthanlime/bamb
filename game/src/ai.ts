import { Game } from "./game";
import { GameState, Move } from "./types";
import { stateApplyMove } from "./state-apply-move";

function calculateBestMove(game: Game, state: GameState): Move {
  let deck = state.decks[state.currentPlayer];

  let bestMove: Move = null;
  let bestScore = Number.MIN_SAFE_INTEGER;

  // goes over all the deck cards
  for (let deckCard of deck.cells) {
    if (!deckCard.cardId) {
      continue;
    }
    let card = game.cards[deckCard.cardId];

    // checks the entire board to see if it can be placed
    for (let col = 0; col < game.numCols; col++) {
      for (let row = 0; row < game.numRows; row++) {
        let move = {
          cardId: card.id,
          player: state.currentPlayer,
          placement: { col, row },
        };

        // simulate playing this card
        let newState = stateApplyMove(game, state, move);
        if (newState == state) {
          // not a legal move, keep searching
          continue;
        }

        let score = computeScore(game, newState, state.currentPlayer);
        console.log(`score for [${row}:${col}] is ${score}`);
        if (score > bestScore) {
          bestMove = move;
          bestScore = score;
        }
      }
    }
  }
  return bestMove;
}

function computeScore(game: Game, state: GameState, player: number): number {
  let tilesOwned = 0;
  let valueOwned = 0;

  let { board } = state;
  for (const cell of state.board.cells) {
    if (!cell.cardId) {
      continue;
    }

    let card = game.cards[cell.cardId];
    if (card.player == player) {
      tilesOwned++;
      valueOwned += card.value;
    }
  }

  return tilesOwned + valueOwned / 100;
}

export function processAI(game: Game) {
  let move = calculateBestMove(game, game.state);

  if (move) {
    game.applyMove(move);
  } else {
    console.log("AI could not come up with a move");
    // game end
  }
}
