import { Game } from "../game";

import { GameState, Move } from "../types";
import { placeCard } from "./place-card";
import { processRowClears } from "./process-row-clears";
import { Consequences } from "./consequences";
import { GameBase } from "../game-base";

export function play(
  game: GameBase,
  prevState: GameState,
  move: Move,
  cons: Consequences,
): GameState {
  let nextState = placeCard(game, prevState, move, cons);
  if (nextState === prevState) {
    return prevState;
  }

  nextState = processRowClears(game, nextState, cons);
  nextState = game.stateAdvanceTurn(nextState);
  return nextState;
}
