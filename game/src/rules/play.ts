import { Game } from "../game";

import { GameState, Move } from "../types";
import { placeCard } from "./place-card";
import { processRowClears } from "./process-row-clears";
import { Consequences } from "./consequences";

export function play(
  game: Game,
  prevState: GameState,
  move: Move,
  cons: Consequences,
): GameState {
  let nextState = placeCard(game, prevState, move, cons);
  if (nextState === prevState) {
    return prevState;
  }

  nextState = processRowClears(game, prevState, nextState, cons);
  nextState = game.stateAdvanceTurn(nextState);
  return nextState;
}
