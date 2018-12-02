import { Game } from "../game";

import { GameState, Move } from "../types";
import { placeCard } from "./place-card";
import { processRowClears } from "./process-row-clears";

export function play(game: Game, prevState: GameState, move: Move): GameState {
  let nextState = placeCard(game, prevState, move);
  if (nextState === prevState) {
    return prevState;
  }

  return processRowClears(game, prevState, nextState);
}
