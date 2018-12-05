import { GameSettings, PlayerKind } from "./game";
import { AppState, AppPhase } from ".";
import { fontFamily, Icon, borderRadius } from "./create-display-objects";
import * as howler from "howler";
import { tutorialScript } from "./tutorial";

function makeStats(
  state: AppState,
  buttons: PIXI.Container,
  bctx: VerticalButtonContext,
) {
  let [win, los] = [state.settings.allTimeWins, state.settings.allTimeLosses];
  if (win + los === 0) {
    buttons.addChild(bctx.newSmolLabel("Thanks for playing bamb!"));
  } else {
    buttons.addChild(
      bctx.newSmolLabel(
        `All-time stats: ${win} ${win === 1 ? "Win" : "Wins"}, ${los} ${
          los === 1 ? "Loss" : "Losses"
        }`,
      ),
    );
  }
}

export function makeMainUI(state: AppState) {
  let { appUI, settings } = state;
  appUI.removeChildren();
  appUI.position.set(0, 0);
  appUI.alpha = 1;

  if (state.phase === AppPhase.Game) {
    inGameUI(state);
  } else if (state.phase === AppPhase.MainMenu) {
    mainMenu(state);
  } else if (state.phase === AppPhase.Pause) {
    pauseMenu(state);
  } else if (state.phase === AppPhase.GameOver) {
    gameOverMenu(state);
  } else if (state.phase === AppPhase.Credits) {
    creditsMenu(state);
  }
}

export const backgroundColor = 0x36393f;

const baseGameSettings: GameSettings = {
  numCols: 4,
  numRows: 3,
  maxSum: 8,
  players: [
    { name: "red", kind: PlayerKind.AI },
    { name: "blue", kind: PlayerKind.Human },
    // { name: "blue", kind: PlayerKind.AI },
  ],
  script: null,
};

const buttonHeight = 30;
const contextPadding = 12;
class VerticalButtonContext {
  y = 0;
  constructor() {}

  newLabel(labelText: string): PIXI.Container {
    let label = new PIXI.Text(labelText, {
      fontFamily,
      fontSize: 34,
      fill: "white",
    });
    this.y += contextPadding;
    label.anchor.set(0, 0.5);
    let labelHeight = 40;
    label.position.set(0, this.y + labelHeight / 2);
    this.y += labelHeight;
    this.y += contextPadding;
    return label;
  }

  newSmolLabel(labelText: string): PIXI.Container {
    let label = new PIXI.Text(labelText, {
      fontFamily,
      fontSize: 22,
      fill: 0xeeeeee,
    });
    this.y += contextPadding;
    label.anchor.set(0, 0.5);
    let labelHeight = 25;
    label.position.set(0, this.y + labelHeight / 2);
    this.y += labelHeight;
    this.y += contextPadding;
    return label;
  }

  newButton(
    iconName: string,
    labelText: string,
    onClick: () => void,
    extras: {
      disabled: boolean;
    } = { disabled: false },
  ): PIXI.Container {
    this.y += contextPadding;
    let butt = new PIXI.Container();
    let icon = new PIXI.Text(iconName, {
      fontFamily: "FontAwesome",
      fontSize: 34,
      fill: "white",
    });
    icon.anchor.set(0, 0.5);
    icon.position.set(0, buttonHeight / 2);
    butt.addChild(icon);

    let label = new PIXI.Text(labelText, {
      fontFamily,
      fontSize: 22,
      fill: "white",
    });
    label.anchor.set(0, 0.5);
    label.position.set(50, buttonHeight / 2);
    butt.addChild(label);

    if (extras.disabled) {
      butt.alpha = 0.4;
    } else {
      butt.interactive = true;
      butt.buttonMode = true;
      let inactiveAlpha = 0.7;
      butt.alpha = inactiveAlpha;
      butt.on("pointerover", () => {
        butt.alpha = 1;
      });
      butt.on("pointerout", () => {
        butt.alpha = inactiveAlpha;
      });
      butt.on("pointerup", onClick);
    }

    butt.position.set(0, this.y);
    this.y += buttonHeight;
    this.y += contextPadding;
    return butt;
  }

  spacer() {
    this.y += 50;
  }
}

function makeBg(width: number, height: number): PIXI.DisplayObject {
  let paddingX = 32;
  let paddingY = 16;

  let g = new PIXI.Graphics();
  g.lineStyle(2, 0xffffff, 1);
  g.beginFill(backgroundColor);
  g.drawRoundedRect(
    0,
    0,
    width + 2 * paddingX,
    height + 2 * paddingY,
    borderRadius,
  );
  g.position.set(-paddingX, -paddingY);
  return g;
}

export function mainMenu(state: AppState) {
  let { appUI, settings } = state;

  let buttonsWidth = 400;
  let buttonsHeight = 490;

  let { width, height } = state.pixiApp.renderer;
  let buttons = new PIXI.Container();
  buttons.position.set(
    width / 2 - buttonsWidth / 2,
    height / 2 - buttonsHeight / 2,
  );
  appUI.addChild(buttons);

  let disappearUI = (cb: () => void) => {
    let counter = 10;
    let step = () => {
      counter--;
      appUI.alpha -= 0.1;
      appUI.position.y -= 1;
      if (counter > 0) {
        requestAnimationFrame(step);
      } else {
        cb();
      }
    };
    requestAnimationFrame(step);
  };

  buttons.addChild(makeBg(buttonsWidth, buttonsHeight));

  let bctx = new VerticalButtonContext();

  buttons.addChild(bctx.newLabel("bamb"));

  let newGameButton = bctx.newButton(Icon.Play, "New game", () => {
    disappearUI(() => {
      if (!settings.playedTutorial) {
        settings.playedTutorial = true;
        state.saveSettings();

        if (
          confirm(
            "We really recommend starting with the tutorial. Do you want to do that now?",
          )
        ) {
          state.startGame({
            ...baseGameSettings,
            script: tutorialScript(),
          });
          return;
        }
      }

      state.startGame({
        ...baseGameSettings,
        script: null,
      });
    });
  });
  buttons.addChild(newGameButton);

  let tutorialButton = bctx.newButton(
    Icon.GraduationCap,
    "Play tutorial",
    () => {
      disappearUI(() => {
        settings.playedTutorial = true;
        state.saveSettings();
        state.startGame({
          ...baseGameSettings,
          script: tutorialScript(),
        });
      });
    },
  );
  buttons.addChild(tutorialButton);
  makeStats(state, buttons, bctx);

  bctx.spacer();
  buttons.addChild(bctx.newLabel("options & co."));

  let muteButton = bctx.newButton(
    settings.music ? Icon.VolumeUp : Icon.VolumeMute,
    settings.music ? "Disable soundtrack" : "Enable soundtrack",
    () => {
      settings.music = !settings.music;
      state.saveSettings();
      howler.Howler.mute(!settings.music);
      makeMainUI(state);
    },
  );
  buttons.addChild(muteButton);

  let rateButton = bctx.newButton(
    Icon.Trophy,
    "Visit Ludum Dare entry page",
    () => {
      window.open("https://ldjam.com/events/ludum-dare/43/bamb");
    },
  );
  buttons.addChild(rateButton);

  let creditsButt = bctx.newButton(Icon.TheaterMasks, "Credits", () => {
    state.setPhase(AppPhase.Credits);
  });
  buttons.addChild(creditsButt);
}

export function inGameUI(state: AppState) {
  let { appUI, settings } = state;
  let bctx = new VerticalButtonContext();

  let buttons = new PIXI.Container();
  buttons.position.set(20, 20);
  appUI.addChild(buttons);

  if (state.results) {
    let exitButton = bctx.newButton(
      Icon.SignOutAlt,
      "Return to main menu",
      () => {
        state.endGame();
      },
    );
    buttons.addChild(exitButton);
  } else {
    let exitButton = bctx.newButton(Icon.Cog, "Menu", () => {
      state.setPhase(AppPhase.Pause);
    });
    buttons.addChild(exitButton);
  }

  let muteButton = bctx.newButton(
    settings.music ? Icon.VolumeUp : Icon.VolumeMute,
    "",
    () => {
      settings.music = !settings.music;
      state.saveSettings();
      howler.Howler.mute(!settings.music);
      makeMainUI(state);
    },
  );
  buttons.addChild(muteButton);
}

export function pauseMenu(state: AppState) {
  let { appUI, settings } = state;

  let { width, height } = state.pixiApp.renderer;
  let veil = new PIXI.Graphics();
  veil.beginFill(0x000000, 0.8);
  veil.drawRect(0, 0, width, height);
  appUI.addChild(veil);

  let buttonsWidth = 300;
  let buttonsHeight = 300;

  let buttons = new PIXI.Container();
  buttons.position.set(
    width / 2 - buttonsWidth / 2,
    height / 2 - buttonsHeight / 2,
  );
  appUI.addChild(buttons);

  let disappearUI = (cb: () => void) => {
    let counter = 10;
    let step = () => {
      counter--;
      veil.alpha -= 0.1;
      appUI.alpha -= 0.1;
      appUI.position.y -= 1;
      if (counter > 0) {
        requestAnimationFrame(step);
      } else {
        cb();
      }
    };
    requestAnimationFrame(step);
  };

  buttons.addChild(makeBg(buttonsWidth, buttonsHeight));

  let bctx = new VerticalButtonContext();

  buttons.addChild(bctx.newLabel("paused"));

  let resumeButt = bctx.newButton(Icon.Play, "Resume game", () => {
    disappearUI(() => {
      state.setPhase(AppPhase.Game);
    });
  });
  buttons.addChild(resumeButt);

  let exitButt = bctx.newButton(Icon.SignOutAlt, "Exit to main menu", () => {
    disappearUI(() => {
      state.endGame();
    });
  });
  buttons.addChild(exitButt);

  bctx.spacer();

  let muteButton = bctx.newButton(
    settings.music ? Icon.VolumeUp : Icon.VolumeMute,
    settings.music ? "Disable soundtrack" : "Enable soundtrack",
    () => {
      settings.music = !settings.music;
      state.saveSettings();
      howler.Howler.mute(!settings.music);
      makeMainUI(state);
    },
  );
  buttons.addChild(muteButton);
}

export function gameOverMenu(state: AppState) {
  let { appUI, settings } = state;

  let { width, height } = state.pixiApp.renderer;
  let veil = new PIXI.Graphics();
  veil.beginFill(0x000000, 0.8);
  veil.drawRect(0, 0, width, height);
  appUI.addChild(veil);

  let buttonsWidth = 300;
  let buttonsHeight = 350;

  let buttons = new PIXI.Container();
  buttons.position.set(
    width / 2 - buttonsWidth / 2,
    height / 2 - buttonsHeight / 2,
  );
  appUI.addChild(buttons);

  let disappearUI = (cb: () => void) => {
    let counter = 10;
    let step = () => {
      counter--;
      veil.alpha -= 0.1;
      appUI.alpha -= 0.1;
      appUI.position.y -= 1;
      if (counter > 0) {
        requestAnimationFrame(step);
      } else {
        cb();
      }
    };
    requestAnimationFrame(step);
  };

  buttons.addChild(makeBg(buttonsWidth, buttonsHeight));

  let bctx = new VerticalButtonContext();

  let won = state.results.scores[1] > state.results.scores[0];
  let draw = state.results.scores[1] === state.results.scores[0];
  buttons.addChild(
    bctx.newLabel(draw ? "it's a draw!" : won ? "you won!" : "you lost!"),
  );

  makeStats(state, buttons, bctx);

  let resumeButt = bctx.newButton(Icon.Refresh, "Play again", () => {
    disappearUI(() => {
      state.startGame(baseGameSettings);
    });
  });
  buttons.addChild(resumeButt);

  {
    let showBoard = bctx.newButton(Icon.ChessBoard, "Show board", () => {
      disappearUI(() => {
        state.setPhase(AppPhase.Game);
      });
    });
    buttons.addChild(showBoard);
  }

  bctx.spacer();

  let exitButt = bctx.newButton(Icon.ArrowLeft, "Return to main menu", () => {
    disappearUI(() => {
      state.endGame();
    });
  });
  buttons.addChild(exitButt);
}

export function creditsMenu(state: AppState) {
  let { appUI, settings } = state;

  let { width, height } = state.pixiApp.renderer;

  let buttonsWidth = 500;
  let buttonsHeight = 590;

  let buttons = new PIXI.Container();
  buttons.position.set(
    width / 2 - buttonsWidth / 2,
    height / 2 - buttonsHeight / 2,
  );
  appUI.addChild(buttons);

  let disappearUI = (cb: () => void) => {
    let counter = 10;
    let step = () => {
      counter--;
      appUI.alpha -= 0.1;
      appUI.position.y -= 1;
      if (counter > 0) {
        requestAnimationFrame(step);
      } else {
        cb();
      }
    };
    requestAnimationFrame(step);
  };

  buttons.addChild(makeBg(buttonsWidth, buttonsHeight));

  let bctx = new VerticalButtonContext();

  buttons.addChild(bctx.newLabel("main credits"));
  buttons.addChild(
    bctx.newButton(Icon.Headphones, "amos (code, music)", () => {
      window.open("https://twitter.com/fasterthanlime");
    }),
  );
  buttons.addChild(
    bctx.newButton(Icon.HandsHelping, "veld (all-around support)", () => {
      window.open("https://veld.itch.io");
    }),
  );

  bctx.spacer();
  buttons.addChild(bctx.newLabel("special thanks"));
  buttons.addChild(bctx.newSmolLabel("myriam & syam for playtesting"));
  buttons.addChild(
    bctx.newButton(Icon.MicrophoneAlt, "f4ngy (sounds)", () => {
      window.open("https://freesound.org/people/f4ngy/");
    }),
  );
  buttons.addChild(
    bctx.newButton(Icon.Leaf, "leaf (itch.io)", () => {
      window.open("https://leafo.net");
    }),
  );
  buttons.addChild(
    bctx.newButton(Icon.Hammer, "mike (ludum dare)", () => {
      window.open("https://twitter.com/mikekasprzak");
    }),
  );

  bctx.spacer();

  let exitButt = bctx.newButton(Icon.ArrowLeft, "Return to main menu", () => {
    disappearUI(() => {
      state.setPhase(AppPhase.MainMenu);
    });
  });
  buttons.addChild(exitButt);
}
