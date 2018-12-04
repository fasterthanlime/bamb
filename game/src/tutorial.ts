import { GameScript } from "./script";

export const tutorialScript = (): GameScript => ({
  items: [
    {
      text:
        "Hi there!\nLet's learn how to play bamb!\n(Click here to continue)",
    },
    {
      text:
        "Each player places a card one after the other.\nYou go first.\nDrag the '2' from your deck to the highlighted square.",
      move: {
        value: 2,
        player: 0,
        placement: { col: 1, row: 1 },
      },
    },
    {
      text:
        "Good!\nNumber cards can be placed on any empty square.\nYou only have a '2' on the board, so your score is 2. Easy!",
    },
    {
      text: "Now it's the computer's turn.\n(Click here to continue.)",
    },
    {
      move: {
        value: 5,
        player: 1,
        placement: { col: 2, row: 1 },
      },
    },
    {
      text: "The computer now has a higher score, but not for long...",
    },
    {
      text:
        "Here's the main rule of the game:\n\nYou can sacrifice cards to eliminate enemy cards.",
    },
    {
      text:
        "Whenever the total value of a row is exactly 8,\nall the cards in that row are discarded.",
    },
    {
      text:
        "Let's use that to your advantage.\nPlay your '1' to bring the row total to 8.",
      move: {
        value: 1,
        player: 0,
        placement: { col: 0, row: 1 },
      },
    },
    {
      text: "The whole row has been cleared!\nNow, you both have 0 points...",
    },
    {
      text:
        "...still, this was a *good* trade.\nAs you can see in the discard pile:\nthey lost 5 points, you only lost 3.",
    },
    {
      move: {
        value: 2,
        player: 1,
        placement: { col: 2, row: 2 },
      },
    },
    {
      text:
        "Same as rows, if the total for a column is 8, it gets cleared.\nUse your '6' to clear that column.\n(Please!)",
      move: {
        value: 6,
        player: 0,
        placement: { col: 2, row: 1 },
      },
    },
    {
      text:
        "Good! However, that was a *bad* trade.\nYou sacrificed 6 points to make the opponent lose 2.",
    },
    {
      text:
        "(I know, I know, I forced you to.)\n(We're learning both winning and losing today!)\nA rule of thumb: play low cards to eliminate high cards.",
    },
    {
      move: {
        value: 1,
        player: 1,
        placement: { col: 0, row: 0 },
      },
    },
    {
      text:
        "We don't want to use our '7' to get rid of that '1'.\nLet's just play our '5' somewhere else.",
      move: {
        value: 5,
        player: 0,
        placement: { col: 3, row: 2 },
      },
    },
    {
      move: {
        value: 4,
        player: 1,
        placement: { col: 2, row: 2 },
      },
    },
    {
      text:
        "You can play a low card to bring back a higher card.\nPlace your '4' on your '5' to try it out.",
      move: {
        value: 4,
        player: 0,
        placement: { col: 3, row: 2 },
      },
    },
    {
      text:
        "Good! This cleared both your '4' and the enemy '4'.\n(A neutral trade.)",
    },
    {
      move: {
        value: 7,
        player: 1,
        placement: { col: 3, row: 1 },
      },
    },
    {
      text:
        "One last thing: the arrow cards.\nThey let you move any card on the board up or down.",
    },
    {
      text:
        "Here, the computer has made a grave mistake.\nYou can eliminate both its '1' and '7' with a single move.",
      move: {
        value: "U",
        player: 0,
        placement: { col: 3, row: 1 },
      },
    },
    {
      text: "Well done!\nThat concludes our tutorial.",
    },
    {
      text: "You're on your own now!",
    },
  ],
});
