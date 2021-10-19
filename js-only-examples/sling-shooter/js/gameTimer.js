import { HALF, NEGATIVE } from "./constants";

const TEN = 10;

export function getTimeFormat(model, context) {
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
    number < TEN && number > NEGATIVE ? `0${number}` : `${number}`;

  const formattedCurrentTime = formatTime(model.elapsedTime);

  const timeStringForDrawing = ` ${addZeroIfSingleDigit(
    formattedCurrentTime.minutes
  )}:${addZeroIfSingleDigit(formattedCurrentTime.seconds)}:${
    formattedCurrentTime.milliseconds === "100"
      ? `00`
      : addZeroIfSingleDigit(formattedCurrentTime.milliseconds)
  } `;

  return drawTimer(context, model, timeStringForDrawing);
}

export function drawTimer(context, { viewport }, elapsedTime) {
  const CORNER_RADIUS = 8;
  const RECTANGLE_WIDTH = 110;
  const TIMER_RECTANGLE_WIDTH = RECTANGLE_WIDTH + CORNER_RADIUS;
  const TIMER_RECTANGLE_HEIGHT = 30;
  const FONT_SIZE = 26;

  const timerRectangleCoordinates = {
    x: viewport.width * HALF - TIMER_RECTANGLE_WIDTH * HALF,
    y: TIMER_RECTANGLE_HEIGHT * HALF,
  };

  context.save();

  drawRectangleWithRoundedCorners(
    context,
    CORNER_RADIUS,
    timerRectangleCoordinates.x,
    timerRectangleCoordinates.y,
    TIMER_RECTANGLE_WIDTH,
    TIMER_RECTANGLE_HEIGHT
  );

  const timerCoordinates = {
    x: timerRectangleCoordinates.x + TIMER_RECTANGLE_WIDTH * HALF,
    y: timerRectangleCoordinates.y + TIMER_RECTANGLE_HEIGHT * HALF - TEN,
  };

  context.fillStyle = "black";
  context.font = `bold ${FONT_SIZE}px 'futura-pt-condensed', Helvetica, sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "top";
  context.fillText(elapsedTime, timerCoordinates.x, timerCoordinates.y);

  context.restore();
}

function drawRectangleWithRoundedCorners(
  context,
  cornerRadius,
  x,
  y,
  width,
  height
) {
  context.fillStyle = "white";
  context.strokeStyle = "white";

  context.lineJoin = "round";
  context.lineWidth = cornerRadius;

  context.fillRect(
    x + cornerRadius * HALF,
    y + cornerRadius * HALF,
    width - cornerRadius,
    height - cornerRadius
  );

  context.strokeRect(
    x + cornerRadius * HALF,
    y + cornerRadius * HALF,
    width - cornerRadius,
    height - cornerRadius
  );
}
