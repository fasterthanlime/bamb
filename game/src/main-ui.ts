import { GameSettings, PlayerKind } from "./game";
import { AppState, AppPhase } from ".";
import { fontFamily, Icon, borderRadius } from "./create-display-objects";
import * as howler from "howler";
import { tutorialScript } from "./tutorial";

export const backgroundColor = 0x36393f;

const baseGameSettings: GameSettings = {
  numCols: 4,
  numRows: 3,
  maxSum: 8,
  players: [
    { name: "red", kind: PlayerKind.AI },
    { name: "blue", kind: PlayerKind.Human },
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
  }
}

export function mainMenu(state: AppState) {
  let { appUI, settings } = state;

  let buttonsWidth = 400;
  let buttonsHeight = 500;

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

  let newGameButton = bctx.newButton(
    Icon.Play,
    "New game",
    () => {
      disappearUI(() => {
        state.startGame({
          ...baseGameSettings,
          script: null,
        });
      });
    },
    {
      disabled: !settings.playedTutorial,
    },
  );
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

  bctx.spacer();
  buttons.addChild(bctx.newLabel("options"));

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

  bctx.spacer();
  buttons.addChild(bctx.newLabel("more"));

  let rateButton = bctx.newButton(
    Icon.Trophy,
    "Visit Ludum Dare entry page",
    () => {
      window.open("https://ldjam.com/events/ludum-dare/43/bamb");
    },
  );
  buttons.addChild(rateButton);
}

export function inGameUI(state: AppState) {
  let { appUI, settings } = state;
  let bctx = new VerticalButtonContext();

  let buttons = new PIXI.Container();
  buttons.position.set(20, 20);
  appUI.addChild(buttons);

  let exitButton = bctx.newButton(Icon.Cog, "Menu", () => {
    state.setPhase(AppPhase.Pause);
  });
  buttons.addChild(exitButton);

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

  let veil = new PIXI.Graphics();
  let { width, height } = state.pixiApp.renderer;
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

  let resumeButt = bctx.newButton(
    Icon.Play,
    "Resume game",
    () => {
      disappearUI(() => {
        state.setPhase(AppPhase.Game);
      });
    },
    {
      disabled: !settings.playedTutorial,
    },
  );
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
