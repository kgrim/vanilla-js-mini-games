import { TEN } from "./config.js";

export function getTimeFormat(model, context, drawTimer) {
  const NEGATIVE_ONE = -1;

  if (model.elapsedTime === null) {
    return drawTimer(context, model, "00:00:00");
  }

  function formatTime(time) {
    const MILLISECONDS_IN_SECOND = 1000;
    const SHOW_THREE_DIGITS = 10;
    const TIME_FORMAT_DIVIDOR = 59000;

    const milliseconds = (
      (time % MILLISECONDS_IN_SECOND) /
      SHOW_THREE_DIGITS
    ).toFixed();
    const seconds = (
      (time % TIME_FORMAT_DIVIDOR) /
      MILLISECONDS_IN_SECOND
    ).toFixed(0);
    const minutes = Math.floor(time / TIME_FORMAT_DIVIDOR).toFixed();

    return { minutes, seconds, milliseconds };
  }

  const addZeroIfSingleDigit = (number) =>
    number < TEN && number > NEGATIVE_ONE ? `0${number}` : `${number}`;

  const formattedCurrentTime = formatTime(model.elapsedTime);

  const timeStringForDrawing = ` ${addZeroIfSingleDigit(
    formattedCurrentTime.minutes
  )}:${addZeroIfSingleDigit(
    formattedCurrentTime.seconds
  )}:${addZeroIfSingleDigit(formattedCurrentTime.milliseconds)} `;

  return drawTimer(context, model, timeStringForDrawing);
}
