import { GameSettings, PlayerKind } from "./game";
import { AppState } from ".";
import { fontFamily, Icon } from "./create-display-objects";
import * as howler from "howler";
import { tutorialScript } from "./tutorial";

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

export function makeMainUI(state: AppState) {
  let { appUI, settings } = state;
  appUI.removeChildren();

  let buttonCaption: PIXI.Text;
  {
    buttonCaption = new PIXI.Text("", {
      fontFamily,
      fontSize: 22,
      fill: "white",
    });
    buttonCaption.position.set(20, 70);
    appUI.addChild(buttonCaption);
  }

  let muteIcon = new PIXI.Text(
    settings.music ? Icon.VolumeUp : Icon.VolumeMute,
    {
      fontFamily: "FontAwesome",
      fontSize: 34,
      fill: "white",
    },
  );
  muteIcon.interactive = true;
  muteIcon.on("pointerover", () => {
    buttonCaption.text = settings.music ? "Disable sound" : "Enable sound";
    buttonCaption.position.x = muteIcon.position.x;
  });
  muteIcon.on("pointerout", () => {
    buttonCaption.text = "";
  });
  muteIcon.on("pointerup", () => {
    settings.music = !settings.music;
    state.saveSettings();
    howler.Howler.mute(!settings.music);
  });
  muteIcon.position.set(20, 20);
  appUI.addChild(muteIcon);

  let newGameButton: PIXI.Text;
  {
    newGameButton = new PIXI.Text(Icon.PlusCircle, {
      fontFamily: "FontAwesome",
      fontSize: 34,
      fill: "white",
    });
    newGameButton.interactive = true;
    newGameButton.on("pointerover", () => {
      buttonCaption.text = "New game";
      buttonCaption.position.x = newGameButton.position.x;
    });
    newGameButton.on("pointerout", () => {
      buttonCaption.text = "";
    });
    newGameButton.on("pointerup", () => {
      state.startGame({
        ...baseGameSettings,
        script: null,
      });
    });
    newGameButton.position.set(20 + 60, 20);
    appUI.addChild(newGameButton);
  }

  let tutorialButton: PIXI.Text;
  {
    tutorialButton = new PIXI.Text(Icon.GraduationCap, {
      fontFamily: "FontAwesome",
      fontSize: 34,
      fill: "white",
    });
    tutorialButton.interactive = true;
    tutorialButton.on("pointerover", () => {
      buttonCaption.text = "Tutorial";
      buttonCaption.position.x = tutorialButton.position.x;
    });
    tutorialButton.on("pointerout", () => {
      buttonCaption.text = "";
    });
    tutorialButton.on("pointerup", () => {
      state.startGame({
        ...baseGameSettings,
        script: tutorialScript(),
      });
    });
    tutorialButton.position.set(20 + 60 + 60 + 60, 20);
    appUI.addChild(tutorialButton);
  }
}
