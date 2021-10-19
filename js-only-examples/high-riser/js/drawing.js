/* eslint-disable dot-notation */
import {
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  PLATFORM_THICKNESS,
  PLATFORM_GAP,
  PLATFORM_GAP_IN_BETWEEN,
  HALF,
  TWO,
  INVERT,
  COLLECTABLE_WIDTH,
  COLLECTABLE_HEIGHT,
  SIX,
  SEVEN,
  TEN,
  BACKGROUND_IMAGE_HEIGHT,
  BACKGROUND_IMAGE_WIDTH,
} from "./config.js";

const GAME_TYPE_GYM = "gym";

export function drawBackground(context, model, image) {
  context.save();
  context.drawImage(
    image.background,
    0,
    model.currentBackgroundYPosition,
    BACKGROUND_IMAGE_WIDTH,
    BACKGROUND_IMAGE_HEIGHT
  );

  context.drawImage(
    image.background,
    0,
    model.currentBackgroundYPosition - BACKGROUND_IMAGE_HEIGHT,
    BACKGROUND_IMAGE_WIDTH,
    BACKGROUND_IMAGE_HEIGHT
  );
  context.restore();
}

export function drawPlayer(context, model, imageByName) {
  context.save();
  const animationFrameTime = 100;
  const numberOfRunningAnimationFrames = 6;

  const imageIndex = Math.floor(
    ((model.elapsedTime / animationFrameTime) %
      numberOfRunningAnimationFrames) +
      1
  );

  if (model.gameState === "GAME_OVER") {
    if (model.player.vx > 0) {
      context.scale(INVERT, 1);

      context.drawImage(
        imageByName.player_1_falling,
        INVERT * model.player.x - PLAYER_WIDTH * HALF,
        model.player.y - PLAYER_HEIGHT * HALF,
        PLAYER_WIDTH,
        PLAYER_HEIGHT
      );
    }

    context.drawImage(
      imageByName.player_1_falling,
      model.player.x - PLAYER_WIDTH * HALF,
      model.player.y - PLAYER_HEIGHT * HALF,
      PLAYER_WIDTH,
      PLAYER_HEIGHT
    );
  } else {
    if (model.player.vy === 0) {
      if (model.player.vx > 0) {
        context.scale(INVERT, 1);
        context.drawImage(
          imageByName[`player_1_walking_${imageIndex}`],
          INVERT * model.player.x - PLAYER_WIDTH * HALF,
          model.player.y + PLATFORM_THICKNESS - PLAYER_HEIGHT * HALF,
          PLAYER_WIDTH,
          PLAYER_HEIGHT
        );
      } else {
        context.drawImage(
          imageByName[`player_1_walking_${imageIndex}`],
          model.player.x - PLAYER_WIDTH * HALF,
          model.player.y + PLATFORM_THICKNESS - PLAYER_HEIGHT * HALF,
          PLAYER_WIDTH,
          PLAYER_HEIGHT
        );
      }
    }

    if (model.player.vy < 0) {
      if (model.player.vx > 0) {
        context.scale(INVERT, 1);
        context.drawImage(
          imageByName.player_1_jumping_1,
          INVERT * model.player.x - PLAYER_WIDTH * HALF,
          model.player.y - PLAYER_HEIGHT * HALF,
          PLAYER_WIDTH,
          PLAYER_HEIGHT
        );
      }
      if (model.player.vx < 0) {
        context.drawImage(
          imageByName.player_1_jumping_1,
          model.player.x - PLAYER_WIDTH * HALF,
          model.player.y - PLAYER_HEIGHT * HALF,
          PLAYER_WIDTH,
          PLAYER_HEIGHT
        );
      }
    }
    if (model.player.vy > 0) {
      if (model.player.vx > 0) {
        context.scale(INVERT, 1);
        context.drawImage(
          imageByName[`player_1_jumping_2`],
          INVERT * model.player.x - PLAYER_WIDTH * HALF,
          model.player.y - PLAYER_HEIGHT * HALF,
          PLAYER_WIDTH,
          PLAYER_HEIGHT
        );
      }
      if (model.player.vx < 0) {
        context.drawImage(
          imageByName[`player_1_jumping_2`],
          model.player.x - PLAYER_WIDTH * HALF,
          model.player.y - PLAYER_HEIGHT * HALF,
          PLAYER_WIDTH,
          PLAYER_HEIGHT
        );
      }
    }
  }

  context.restore();
}

export function drawPlatforms(
  context,
  model,
  imageByName,
  gameType,
  sugarFree
) {
  const { player, viewport, levels } = model;
  context.save();
  let index = 0;
  for (
    let yPosition =
      player.currentPlatformY +
      PLATFORM_GAP_IN_BETWEEN * TWO +
      PLATFORM_THICKNESS;
    yPosition > player.currentPlatformY - viewport.height;
    yPosition -= PLATFORM_GAP_IN_BETWEEN
  ) {
    if (levels[index].collectableX) {
      drawCollectable(
        context,
        model,
        levels[index],
        yPosition,
        imageByName,
        gameType,
        sugarFree
      );
      if (levels[index].collected) {
        drawCollectable(
          context,
          model,
          levels[index],
          yPosition,
          imageByName,
          gameType,
          sugarFree
        );
      }
    }

    const randomWallAndFloorNumber = levels[index].wallAndFloorRandomNumber
      ? levels[index].wallAndFloorRandomNumber
      : null;

    const floorAsset = randomWallAndFloorNumber
      ? imageByName[`floor_${randomWallAndFloorNumber}`]
      : imageByName.floor;

    context.drawImage(
      floorAsset,
      PLATFORM_GAP,
      yPosition + PLATFORM_THICKNESS,
      viewport.width - PLATFORM_GAP * TWO,
      PLATFORM_THICKNESS
    );

    if (levels[index].leftWall) {
      drawLeftWall(context, yPosition, imageByName, randomWallAndFloorNumber);
    }
    if (levels[index].rightWall) {
      drawRightWall(
        context,
        viewport,
        yPosition,
        imageByName,
        randomWallAndFloorNumber
      );
    }

    index++;
  }
  context.restore();
}

export function drawLeftWall(
  context,
  yPositions,
  imageByName,
  randomWallAndFloorNumber
) {
  const wallAsset = randomWallAndFloorNumber
    ? imageByName[`wall_${randomWallAndFloorNumber}`]
    : imageByName.left_wall;

  context.save();
  context.drawImage(
    wallAsset,
    PLATFORM_GAP,
    yPositions + PLATFORM_THICKNESS * TWO,
    PLATFORM_THICKNESS,
    -PLATFORM_GAP_IN_BETWEEN - PLATFORM_THICKNESS
  );
  context.restore();
}

export function drawRightWall(
  context,
  viewport,
  yPosition,
  imageByName,
  randomWallAndFloorNumber
) {
  const wallAsset = randomWallAndFloorNumber
    ? imageByName[`wall_${randomWallAndFloorNumber}`]
    : imageByName.right_wall;

  context.save();
  context.drawImage(
    wallAsset,
    viewport.width - PLATFORM_GAP - PLATFORM_THICKNESS,
    yPosition + PLATFORM_THICKNESS * TWO,
    PLATFORM_THICKNESS,
    -PLATFORM_GAP_IN_BETWEEN - PLATFORM_THICKNESS
  );
  context.restore();
}

function drawCollectable(
  context,
  model,
  levels,
  yPosition,
  imageByName,
  gameType,
  sugarFree
) {
  context.save();

  if (!levels.collected && gameType !== GAME_TYPE_GYM) {
    context.drawImage(
      imageByName[`collectable_${levels.collectableImage}_3`],
      levels.collectableX,
      yPosition + PLATFORM_THICKNESS - COLLECTABLE_HEIGHT,
      COLLECTABLE_WIDTH,
      COLLECTABLE_HEIGHT
    );
  }

  if (
    (levels.collected && gameType !== GAME_TYPE_GYM) ||
    (!levels.collected && gameType === GAME_TYPE_GYM)
  ) {
    const animationFrameTime = 400;
    const numberOfRunningAnimationFrames = 2;

    const imageIndex = Math.floor(
      ((model.elapsedTime / animationFrameTime) %
        numberOfRunningAnimationFrames) +
        1
    );

    context.drawImage(
      imageByName[
        `collectable_${
          gameType === GAME_TYPE_GYM &&
          sugarFree &&
          levels.collectableImage === SIX
            ? SEVEN
            : levels.collectableImage
        }_${imageIndex}`
      ],
      levels.collectableX,
      yPosition + PLATFORM_THICKNESS - COLLECTABLE_HEIGHT,
      COLLECTABLE_WIDTH,
      COLLECTABLE_HEIGHT
    );
  }
  context.restore();
}

export function drawTimer(context, { viewport, camera }, elapsedTime) {
  const CORNER_RADIUS = 8;
  const RECTANGLE_WIDTH = 110;
  const TIMER_RECTANGLE_WIDTH = RECTANGLE_WIDTH + CORNER_RADIUS;
  const TIMER_RECTANGLE_HEIGHT = 30;
  const FONT_SIZE = 26;

  const timerRectangleCoordinates = {
    x: viewport.width * HALF - TIMER_RECTANGLE_WIDTH * HALF,
    y: -camera.cameraMovementCounter + TIMER_RECTANGLE_HEIGHT,
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
