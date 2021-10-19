import {
  PLAYER_MEASUREMENT,
  HALF,
  DOUBLE,
  NEGATIVE,
  FOURTH_FRAME,
  THIRD_FRAME,
  FIFTH_FRAME,
  SIXTH_FRAME,
  NODE_MEASUREMENT,
  THREE,
  EDGE_WIDTH,
  EDGE_DISPLAY_PADDING,
  STILL_ASSET_X,
} from "./constants";

export function drawPlayerPlayState(
  context,
  { x, y, asset },
  elipsedTime,
  isPowerup
) {
  context.save();
  const animationFrameTime = 200;
  if (isPowerup) {
    const numberOfRunningAnimationFrames = 4;

    const imageIndex = Math.floor(
      ((elipsedTime / animationFrameTime) % numberOfRunningAnimationFrames) +
        THREE
    );

    if (imageIndex % FIFTH_FRAME === 0 || imageIndex % SIXTH_FRAME === 0) {
      const numberOfRunningInvertedAnimationFrames = 2;
      const imageInvertedIndex = Math.floor(
        ((elipsedTime / animationFrameTime) %
          numberOfRunningInvertedAnimationFrames) +
          THREE
      );

      context.scale(NEGATIVE, 1);
      context.drawImage(
        asset,
        PLAYER_MEASUREMENT * DOUBLE * imageInvertedIndex,
        0,
        PLAYER_MEASUREMENT * DOUBLE,
        PLAYER_MEASUREMENT * DOUBLE,
        NEGATIVE * x - PLAYER_MEASUREMENT,
        y,
        PLAYER_MEASUREMENT,
        PLAYER_MEASUREMENT
      );
    } else {
      context.drawImage(
        asset,
        PLAYER_MEASUREMENT * DOUBLE * imageIndex,
        0,
        PLAYER_MEASUREMENT * DOUBLE,
        PLAYER_MEASUREMENT * DOUBLE,
        x,
        y,
        PLAYER_MEASUREMENT,
        PLAYER_MEASUREMENT
      );
    }
  } else {
    const numberOfRunningAnimationFrames = 4;
    const imageIndex = Math.floor(
      ((elipsedTime / animationFrameTime) % numberOfRunningAnimationFrames) + 1
    );

    if (imageIndex % THIRD_FRAME === 0 || imageIndex % FOURTH_FRAME === 0) {
      const numberOfRunningInvertedAnimationFrames = 2;
      const imageInvertedIndex = Math.floor(
        ((elipsedTime / animationFrameTime) %
          numberOfRunningInvertedAnimationFrames) +
          1
      );
      context.scale(NEGATIVE, 1);
      context.drawImage(
        asset,
        PLAYER_MEASUREMENT * DOUBLE * imageInvertedIndex,
        0,
        PLAYER_MEASUREMENT * DOUBLE,
        PLAYER_MEASUREMENT * DOUBLE,
        NEGATIVE * x - PLAYER_MEASUREMENT,
        y,
        PLAYER_MEASUREMENT,
        PLAYER_MEASUREMENT
      );
    } else {
      context.drawImage(
        asset,
        PLAYER_MEASUREMENT * DOUBLE * imageIndex,
        0,
        PLAYER_MEASUREMENT * DOUBLE,
        PLAYER_MEASUREMENT * DOUBLE,
        x,
        y,
        PLAYER_MEASUREMENT,
        PLAYER_MEASUREMENT
      );
    }
  }

  context.restore();
}

export function drawPlayerRotationState(
  context,
  { x, y, vx, asset },
  isPowerup
) {
  const powerUpAsset = 3;

  if (Math.sign(vx) === 1) {
    context.drawImage(
      asset,
      isPowerup
        ? PLAYER_MEASUREMENT * DOUBLE * powerUpAsset
        : PLAYER_MEASUREMENT * DOUBLE,
      0,
      PLAYER_MEASUREMENT * DOUBLE,
      PLAYER_MEASUREMENT * DOUBLE,
      x,
      y,
      PLAYER_MEASUREMENT,
      PLAYER_MEASUREMENT
    );
  } else {
    context.scale(NEGATIVE, 1);
    context.drawImage(
      asset,
      isPowerup
        ? PLAYER_MEASUREMENT * DOUBLE * powerUpAsset
        : PLAYER_MEASUREMENT * DOUBLE,
      0,
      PLAYER_MEASUREMENT * DOUBLE,
      PLAYER_MEASUREMENT * DOUBLE,
      NEGATIVE * x - PLAYER_MEASUREMENT,
      y,
      PLAYER_MEASUREMENT,
      PLAYER_MEASUREMENT
    );
  }
}

export function drawInanimatePlayerPlayState(
  context,
  { x, y, asset },
  elipsedTime,
  isPowerup,
  inOrbit
) {
  context.save();
  const animationFrameTime = 200;
  const numberOfRunningAnimationFrames = 2;
  if (isPowerup) {
    const imageIndex = Math.floor(
      ((elipsedTime / animationFrameTime) % numberOfRunningAnimationFrames) +
        THREE
    );

    if (inOrbit) {
      context.drawImage(
        asset,
        PLAYER_MEASUREMENT * DOUBLE * imageIndex * THREE,
        0,
        PLAYER_MEASUREMENT * DOUBLE,
        PLAYER_MEASUREMENT * DOUBLE,
        x,
        y,
        PLAYER_MEASUREMENT,
        PLAYER_MEASUREMENT
      );
    }
    context.drawImage(
      asset,
      PLAYER_MEASUREMENT * DOUBLE * imageIndex,
      0,
      PLAYER_MEASUREMENT * DOUBLE,
      PLAYER_MEASUREMENT * DOUBLE,
      x,
      y,
      PLAYER_MEASUREMENT,
      PLAYER_MEASUREMENT
    );
  } else {
    const imageIndex = Math.floor(
      ((elipsedTime / animationFrameTime) % numberOfRunningAnimationFrames) + 1
    );

    if (inOrbit) {
      context.drawImage(
        asset,
        PLAYER_MEASUREMENT * DOUBLE * imageIndex,
        0,
        PLAYER_MEASUREMENT * DOUBLE,
        PLAYER_MEASUREMENT * DOUBLE,
        x,
        y,
        PLAYER_MEASUREMENT,
        PLAYER_MEASUREMENT
      );
    } else {
      context.drawImage(
        asset,
        PLAYER_MEASUREMENT * DOUBLE * imageIndex,
        0,
        PLAYER_MEASUREMENT * DOUBLE,
        PLAYER_MEASUREMENT * DOUBLE,
        x,
        y,
        PLAYER_MEASUREMENT,
        PLAYER_MEASUREMENT
      );
    }
  }

  context.restore();
}

export function drawPlayerGameReadyState(context, { x, y, asset }) {
  context.save();
  context.drawImage(
    asset,
    STILL_ASSET_X,
    0,
    PLAYER_MEASUREMENT * DOUBLE,
    PLAYER_MEASUREMENT * DOUBLE,
    x,
    y,
    PLAYER_MEASUREMENT,
    PLAYER_MEASUREMENT
  );

  context.restore();
}

export function drawPlayerGameOverState(context, { x, y, asset }, { assetX }) {
  context.save();
  context.drawImage(
    asset,
    assetX,
    0,
    PLAYER_MEASUREMENT * DOUBLE,
    PLAYER_MEASUREMENT * DOUBLE,
    x,
    y,
    PLAYER_MEASUREMENT,
    PLAYER_MEASUREMENT
  );

  context.restore();
}

export function drawNodes(context, circles, activeNode) {
  context.save();
  circles.forEach(({ x, y, nodeAsset, powerupAsset, isPowerUp }) => {
    const isNodeActive = activeNode.x === x && activeNode.y === y;
    context.drawImage(
      isPowerUp ? powerupAsset : nodeAsset,
      isNodeActive ? NODE_MEASUREMENT * DOUBLE : 0,
      0,
      NODE_MEASUREMENT * DOUBLE,
      NODE_MEASUREMENT * DOUBLE,
      x,
      y,
      NODE_MEASUREMENT,
      NODE_MEASUREMENT
    );
  });
  context.restore();
}

export function drawConnectingLine(
  context,
  { start, end, isPowerUp, connectingLineColor }
) {
  const strokeColor = isPowerUp
    ? "rgba(255, 237, 70, 0.5)"
    : connectingLineColor;
  const radius = Math.hypot(start.x - end.x, start.y - end.y);
  context.save();
  context.strokeStyle = strokeColor;
  context.beginPath();
  context.moveTo(
    start.x + NODE_MEASUREMENT * HALF,
    start.y + NODE_MEASUREMENT * HALF
  );
  context.lineTo(
    end.x + PLAYER_MEASUREMENT * HALF,
    end.y + PLAYER_MEASUREMENT * HALF
  );
  context.lineWidth = 5;
  context.stroke();

  drawCircle(context, start.x, start.y, radius, strokeColor);
  context.restore();
}

function drawCircle(context, nodeX, nodeY, radius, strokeColor) {
  const dashLength = 20;
  const dashSpace = 10;

  context.save();
  context.beginPath();
  context.strokeStyle = strokeColor;
  context.setLineDash([dashLength, dashSpace]);
  context.arc(
    nodeX + NODE_MEASUREMENT * HALF,
    nodeY + NODE_MEASUREMENT * HALF,
    radius,
    0,
    Math.PI * DOUBLE,
    true
  );
  context.stroke();
  context.restore();
}

export function drawBackground(
  context,
  { width, height },
  { asset, backgroundYPositions }
) {
  context.save();
  backgroundYPositions.forEach((backgroundYPosition) => {
    context.drawImage(asset, -width, backgroundYPosition, width, height);
    context.drawImage(asset, 0, backgroundYPosition, width, height);
    context.drawImage(asset, width, backgroundYPosition, width, height);
  });

  context.restore();
}

export function drawEdges(
  context,
  { width, height },
  { asset, backgroundYPositions }
) {
  context.save();
  backgroundYPositions.forEach((backgroundYPosition) => {
    colorOutOfBounceArea(context, backgroundYPosition, width, height);
    context.drawImage(
      asset,
      width - (EDGE_DISPLAY_PADDING + EDGE_WIDTH * HALF),
      backgroundYPosition,
      EDGE_WIDTH,
      height
    );

    context.drawImage(
      asset,
      EDGE_DISPLAY_PADDING - EDGE_WIDTH * HALF,
      backgroundYPosition,
      EDGE_WIDTH,
      height
    );
  });

  context.restore();
}

function colorOutOfBounceArea(context, backgroundYPosition, width, height) {
  context.fillStyle = "rgba(255,1,2, 0.2)";

  context.fillRect(
    width - EDGE_DISPLAY_PADDING,
    backgroundYPosition,
    width,
    height
  );

  context.fillRect(
    EDGE_DISPLAY_PADDING - width,
    backgroundYPosition,
    width,
    height
  );
}
