import {
  HALF,
  TOWER_HEIGHT,
  TOWER_WIDTH,
  FADING_TIMER_DIVIDER,
  FONT_SIZE,
  FONT_SIZE_PADDING,
  LEVEL_UP_BANNER_SIZE,
  TOWER_SCREEN_POSITION,
  TOWER_HEIGHT_PADDING,
  TOWER_HEIGHT_DRAWING_PADDING
} from "./constants.js";

export function directTowerDrawing(
  context,
  {
    viewport,

    tower,
    gameState,
    transition: { fadingValue }
  },
  towerImage
) {
  const { currentDrawingAngle } = tower;
  context.save();

  const canvasCenter = {
    heightCenter: viewport.height * TOWER_SCREEN_POSITION,
    widthCenter: viewport.width * HALF
  };

  if (gameState === "GAME_READY") {
    drawTower(context, currentDrawingAngle, canvasCenter, towerImage);
  }

  if (gameState === "PLAY" || gameState === "GAME_OVER") {
    drawTower(context, currentDrawingAngle, canvasCenter, towerImage);
  }

  if (gameState === "TARGET_TOWER") {
    drawTower(
      context,
      currentDrawingAngle,
      canvasCenter,
      towerImage,
      gameState === "TARGET_TOWER",
      fadingValue
    );
  }

  context.restore();
}

function drawTower(
  context,
  DrawingAngle,
  { heightCenter, widthCenter },
  towerImage,
  isTargetTower,
  fadingValue
) {
  if (isTargetTower) {
    fadingAssets(context, fadingValue);
  }
  context.save();
  context.translate(widthCenter, heightCenter);
  context.rotate(DrawingAngle * Math.PI);
  context.translate(-widthCenter, -heightCenter);

  context.drawImage(
    towerImage,
    widthCenter - TOWER_WIDTH * HALF,
    heightCenter - TOWER_HEIGHT + TOWER_HEIGHT_PADDING,
    TOWER_WIDTH,
    TOWER_HEIGHT + TOWER_HEIGHT_DRAWING_PADDING
  );

  context.restore();
}

export function drawFeedback(
  context,
  { viewport, tower: { selectedAngle } },
  glowImage
) {
  const canvasCenter = {
    heightCenter: viewport.height * TOWER_SCREEN_POSITION,
    widthCenter: viewport.width * HALF
  };
  context.save();
  context.translate(canvasCenter.widthCenter, canvasCenter.heightCenter);
  context.rotate(selectedAngle * Math.PI);
  context.translate(-canvasCenter.widthCenter, -canvasCenter.heightCenter);

  context.drawImage(
    glowImage,
    canvasCenter.widthCenter - TOWER_WIDTH * HALF,
    canvasCenter.heightCenter - TOWER_HEIGHT + TOWER_HEIGHT_PADDING,
    TOWER_WIDTH,
    TOWER_HEIGHT
  );

  context.restore();
}

export function drawLevelUpFeedback(
  context,
  { viewport, levels: { currentLevel } },
  canImage
) {
  context.save();

  context.drawImage(
    canImage,
    viewport.width * HALF - LEVEL_UP_BANNER_SIZE * HALF,
    viewport.height * HALF - LEVEL_UP_BANNER_SIZE * HALF,
    LEVEL_UP_BANNER_SIZE,
    LEVEL_UP_BANNER_SIZE
  );

  drawLevelUpText(context, viewport, currentLevel);

  context.restore();
}

function drawLevelUpText(context, { width, height }, currentLevel) {
  context.fillStyle = "black";
  context.font = `bold ${FONT_SIZE}px 'futura-pt-condensed', Helvetica, sans-serif`;
  context.textAlign = "center";
  context.fillText(
    currentLevel,
    width * HALF,
    height * HALF + FONT_SIZE_PADDING,
    LEVEL_UP_BANNER_SIZE,
    LEVEL_UP_BANNER_SIZE
  );
}

function fadingAssets(context, fadingValue) {
  const currentGlobalAlphaValue = fadingValue / FADING_TIMER_DIVIDER;
  if (currentGlobalAlphaValue <= HALF) {
    context.globalAlpha = currentGlobalAlphaValue;
    return;
  } else if (currentGlobalAlphaValue >= 1) {
    context.globalAlpha = currentGlobalAlphaValue - 1;
  }
  context.globalAlpha = HALF;
}

export function drawTowerGlow(
  context,
  {
    viewport,
    levels: {
      currentLevelObject: { angle }
    }
  },
  glowImage
) {
  const canvasCenter = {
    heightCenter: viewport.height * TOWER_SCREEN_POSITION,
    widthCenter: viewport.width * HALF
  };
  context.save();
  context.translate(canvasCenter.widthCenter, canvasCenter.heightCenter);
  context.rotate(angle * Math.PI);
  context.translate(-canvasCenter.widthCenter, -canvasCenter.heightCenter);

  context.drawImage(
    glowImage,
    canvasCenter.widthCenter - TOWER_WIDTH * HALF,
    canvasCenter.heightCenter - TOWER_HEIGHT + TOWER_HEIGHT_PADDING,
    TOWER_WIDTH,
    TOWER_HEIGHT
  );

  context.restore();
}
