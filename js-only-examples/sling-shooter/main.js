import { canvas, events } from "@diesdasdigital/js-canvas-library";
import { updatePowerBar } from "./js/powerbar.js";
import { getTimeFormat } from "./js/gameTimer.js";

import * as Vector from "./js/vector";
import { pipe } from "./js/pipe";
import * as Geometry from "./js/geometry";
import {
  FULL_POWER_BAR_VALUE,
  INITIAL_POWER_BAR_REDUCTION_SPEED,
  THOUSAND,
  PLAYER_SPEED,
  HALF,
  PLAYER_MEASUREMENT,
  EDGE_WIDTH,
  END_SCALE_NUMBER,
  START_SCALE_NUMBER,
  NEGATIVE,
  NODE_MAX_RADIUS,
  EDGE_DISPLAY_PADDING,
  STILL_ASSET_X,
  WALL_COLLISION_ASSET_X,
  MAX_POWER_UP_INDEX,
  POWER_UP_TIMER,
  ASSETS_URL,
  INCREMENT_POWER_BAR_REDUCTION_SPEED,
  POWERBAR_INCREMENT_SECONDS,
  NODE_MEASUREMENT,
  ROTATION_NODE_TIMER_INCREASE,
} from "./js/constants.js";
import {
  drawConnectingLine,
  drawPlayerGameReadyState,
  drawPlayerPlayState,
  drawPlayerGameOverState,
  drawNodes,
  drawBackground,
  drawEdges,
  drawPlayerRotationState,
  drawInanimatePlayerPlayState,
} from "./js/drawing.js";
import {
  addFeedbackColor,
  addFeedbackOverlay,
  removeFeedbackColor,
} from "./js/feedback-colors.js";

// INIT
function init(flags, meta) {
  const model = {
    viewport: meta.viewport,
    gameType: flags.gameType,
    clock: 0,
    dt: 0,
    player: {
      x: meta.viewport.width * HALF - PLAYER_MEASUREMENT * HALF,
      y: meta.viewport.height * HALF - PLAYER_MEASUREMENT * HALF,
      vx: 0,
      vy: -PLAYER_SPEED,
      isPowerUp: false,
    },
    inOrbit: false,
    center: { x: 0, y: 0, isPowerUp: false },
    nodes: generateInitialNodes(meta.viewport, flags.nodeAssetCount),
    nodeAssetCount: flags.nodeAssetCount,
    gameState: "GAME_READY",
    backgroundYPositions: [-meta.viewport.height, 0, meta.viewport.height],
    initialTimeStamp: null,
    elapsedTime: 0,
    powerUpTimer: 0,
    powerBarValue: FULL_POWER_BAR_VALUE,
    powerBarReductionSpeed: INITIAL_POWER_BAR_REDUCTION_SPEED,
  };
  const cmds = [];
  return [model, cmds];
}

// MSG
const msg = {
  tick: (timestamp) => ({
    type: "tick",
    data: { timestamp },
  }),
  buttonDown: () => ({
    type: "buttonDown",
  }),
  buttonUp: () => ({
    type: "buttonUp",
  }),
};

// UPDATE
function update(callbacks) {
  return (_msg, model) => {
    const dt =
      _msg.type && _msg.type === "tick"
        ? _msg.data.timestamp / THOUSAND - model.clock
        : 0;
    switch (_msg.type) {
      case "tick":
        updatePowerBar(model.powerBarValue);
        switch (model.gameState) {
          case "PLAY":
            if (!model.player.isPowerUp) {
              removeFeedbackColor();
            }
            if (model.player.isPowerUp) {
              addFeedbackColor();
            }
            return [
              {
                ...model,
                initialTimeStamp: model.initialTimeStamp || _msg.data.timestamp,
                elapsedTime: _msg.data.timestamp - model.initialTimeStamp,
                powerBarValue:
                  model.powerBarValue - model.powerBarReductionSpeed,
                powerBarReductionSpeed: increaseTimer(model),
                clock: model.clock + dt,
                player: model.inOrbit
                  ? pipe(model.player, [
                    fixTheSpeed,
                    updatePlayerPowerup(model.powerUpTimer),
                    rotateAroundNode({ dt, center: model.center }),
                    updatePlayerPosition(dt),
                  ])
                  : pipe(model.player, [
                    fixTheSpeed,
                    updatePlayerPowerup(model.powerUpTimer),
                    updatePlayerPosition(dt),
                  ]),
                backgroundYPositions: setCurrentBackgroundYPositions(model),
                nodes: appendNewNode(model),
                gameState:
                  model.powerBarValue > 0
                    ? checkForWallCollision(model)
                    : "GAME_OVER",
                powerUpTimer:
                  model.player.isPowerUp &&
                    !model.center.isPowerUp &&
                    model.powerUpTimer < POWER_UP_TIMER
                    ? model.powerUpTimer + 1
                    : 0,
              },
              [],
            ];

          case "GAME_OVER":
            callbacks.onGameOver();
            if (model.player.isPowerUp) {
              removeFeedbackColor();
            }
            return [{ ...model, gameState: "GAME_RESET" }, []];

          default:
            return [{ ...model, clock: model.clock + dt }, []];
        }

      case "buttonDown":
        switch (model.gameState) {
          case "PLAY":
            return [
              {
                ...initiateRotation(model),
              },
              [],
            ];
          default:
            return [model, []];
        }

      case "buttonUp":
        switch (model.gameState) {
          case "PLAY":
            return [
              {
                ...model,
                inOrbit: false,
                center: { x: 0, y: 0, isPowerUp: false },
                player: {
                  ...model.player,
                  isPowerUp:
                    model.powerUpTimer === 0
                      ? model.center.isPowerUp
                      : model.player.isPowerUp,
                },
                powerBarValue: model.center.isPowerUp
                  ? FULL_POWER_BAR_VALUE
                  : model.powerBarValue + ROTATION_NODE_TIMER_INCREASE,
              },
              [],
            ];
          case "GAME_READY":
            subscriptions();
            return [{ ...model, gameState: "PLAY" }, []];

          default:
            return [model, []];
        }

      default:
        return [model, []];
    }
  };
}

function updatePlayerPosition(dt) {
  return function (body) {
    return {
      ...body,
      x: body.x + dt * body.vx,
      y: body.y + dt * body.vy,
    };
  };
}

function fixTheSpeed(body) {
  const [newvx, newvy] = pipe(
    [body.vx, body.vy],
    [Vector.normalize, Vector.scale(PLAYER_SPEED)]
  );

  return {
    ...body,
    vx: newvx,
    vy: newvy,
  };
}

function checkForWallCollision({ gameState, player, viewport, inOrbit }) {
  if (inOrbit) {
    return gameState;
  }
  if (
    player.x < EDGE_DISPLAY_PADDING - EDGE_WIDTH ||
    player.x + PLAYER_MEASUREMENT * HALF >
    viewport.width - EDGE_DISPLAY_PADDING - EDGE_WIDTH * HALF
  ) {
    return "GAME_OVER";
  }

  return gameState;
}

function updatePlayerPowerup(powerUpTimer) {
  return function (player) {
    return {
      ...player,
      isPowerUp:
        player.isPowerUp && powerUpTimer < POWER_UP_TIMER
          ? player.isPowerUp
          : false,
    };
  };
}

function rotateAroundNode({ dt, center }) {
  return function (body) {
    const dist = Geometry.distance(center, body);
    const nextBody = updatePlayerPosition(dt)(body);
    const nextDist = Geometry.distance(center, nextBody);
    const pullDistance = nextDist - dist;

    const [dvx, dvy] = pipe(Vector.fromEndPoints(nextBody, center), [
      Vector.normalize,
      Vector.scale(pullDistance / dt),
    ]);

    return { ...body, vx: body.vx + dvx, vy: body.vy + dvy };
  };
}

function initiateRotation(model) {
  const closestNode = Geometry.closest(model.player, model.nodes);

  const xPointsDifference =
    Math.max(model.player.x, closestNode.x) -
    Math.min(model.player.x, closestNode.x);

  const yPointsDifference =
    Math.max(model.player.y, closestNode.y) -
    Math.min(model.player.y, closestNode.y);

  if (
    xPointsDifference > NODE_MAX_RADIUS ||
    yPointsDifference > NODE_MAX_RADIUS
  ) {
    return {
      ...model,
      inOrbit: false,
    };
  }

  return {
    ...model,
    inOrbit: true,
    center: Geometry.closest(model.player, model.nodes),
  };
}

function setCurrentBackgroundYPositions({
  player,
  viewport,
  backgroundYPositions,
}) {
  const playerIsGoingUp = Math.sign(player.vy) === NEGATIVE;
  const lowestBackgroundY = Math.max(...backgroundYPositions);
  const highestBackgroundY = Math.min(...backgroundYPositions);

  if (
    playerIsGoingUp &&
    player.y - PLAYER_MEASUREMENT < highestBackgroundY + viewport.height
  ) {
    return backgroundYPositions.map((backgroundYPosition) =>
      backgroundYPosition === lowestBackgroundY
        ? highestBackgroundY - viewport.height
        : backgroundYPosition
    );
  }
  if (!playerIsGoingUp && player.y > lowestBackgroundY) {
    return backgroundYPositions.map((backgroundYPosition) =>
      backgroundYPosition === highestBackgroundY
        ? lowestBackgroundY + viewport.height
        : backgroundYPosition
    );
  }

  return backgroundYPositions;
}

function getRandomSpaceBetweenNodes() {
  const randomNumber = Math.random() * START_SCALE_NUMBER;
  return randomNumber < END_SCALE_NUMBER
    ? END_SCALE_NUMBER + randomNumber
    : randomNumber;
}

function getXNodePosition(width, previousNodeToTheLeft) {
  const xPosition =
    Math.random() * (width * HALF - (EDGE_DISPLAY_PADDING + NODE_MEASUREMENT));

  return previousNodeToTheLeft
    ? width * HALF + xPosition
    : xPosition + EDGE_DISPLAY_PADDING;
}

function generateInitialNodes(viewport, nodeAssetCount) {
  const initialNumberOfNodes = 5;
  const averageSpaceBetweenNodes = -viewport.height * HALF;

  const randomIndexNumber = Math.floor(Math.random() * MAX_POWER_UP_INDEX) + 1;

  const initialXPosition =
    Math.random() *
    (viewport.width - (EDGE_DISPLAY_PADDING + NODE_MEASUREMENT));
  const initialXPositionToTheLeft = initialXPosition < viewport.width * HALF;
  const oddIndex = 2;

  const nodes = Array(initialNumberOfNodes)
    .fill()
    .map((_, index) => ({
      x:
        index === 0
          ? initialXPosition
          : getXNodePosition(
            viewport.width,
            initialXPositionToTheLeft && index % oddIndex !== 0
          ),
      y: averageSpaceBetweenNodes * index - getRandomSpaceBetweenNodes(),
      isPowerUp: randomIndexNumber / index === 1,
      nodeAssetNumber: Math.floor(Math.random() * nodeAssetCount) + 1,
    }));

  nodes.push();

  return nodes;
}

function appendNewNode({ viewport, nodes, nodeAssetCount, inOrbit, player }) {
  const playerIsGoingUp = Math.sign(player.vy) === NEGATIVE;
  if (!inOrbit) {
    let newNodeObject = {};
    const allNodeYValues = nodes.map((node) => node.y);
    const furtherstYNode = allNodeYValues.reduce((a, b) =>
      playerIsGoingUp ? Math.min(a, b) : Math.max(a, b)
    );
    const furtherstNode = nodes.filter((node) => node.y === furtherstYNode);

    if (
      (playerIsGoingUp && player.y < furtherstYNode + viewport.height) ||
      (!playerIsGoingUp && player.y > furtherstYNode - viewport.height)
    ) {
      const randomIndexNumber =
        Math.floor(Math.random() * MAX_POWER_UP_INDEX) + nodes.length;

      newNodeObject = {
        x: getXNodePosition(
          viewport.width,
          furtherstNode[0].x < viewport.width * HALF
        ),
        y: playerIsGoingUp
          ? furtherstYNode - getRandomSpaceBetweenNodes()
          : furtherstYNode + getRandomSpaceBetweenNodes(),
        isPowerUp: randomIndexNumber / nodes.length === 1,
        nodeAssetNumber: Math.floor(Math.random() * nodeAssetCount) + 1,
      };

      return [...nodes, newNodeObject];
    }
  }

  return nodes;
}

function increaseTimer({ elapsedTime, powerBarReductionSpeed }) {
  const incrementalTimer = elapsedTime / THOUSAND / POWERBAR_INCREMENT_SECONDS;
  if (
    Number.isInteger(incrementalTimer) &&
    Math.floor(incrementalTimer) !== 0 &&
    powerBarReductionSpeed !==
    INITIAL_POWER_BAR_REDUCTION_SPEED +
    INCREMENT_POWER_BAR_REDUCTION_SPEED * incrementalTimer
  ) {
    return (
      powerBarReductionSpeed +
      INCREMENT_POWER_BAR_REDUCTION_SPEED * incrementalTimer
    );
  }
  return powerBarReductionSpeed;
}

// VIEW

function view(imageUrlByName) {
  return (context, model) => {
    const lineStart = model.inOrbit ? model.center : model.player;

    const playerCircle = {
      ...model.player,
      asset: imageUrlByName.player,
    };

    const nodes = model.nodes.map((node) => {
      const powerUpAsset =
        model.gameType.includes("SugarFree") && imageUrlByName.powerupSugarFree
          ? imageUrlByName.powerupSugarFree
          : imageUrlByName.powerup;
      if (imageUrlByName[`node${node.nodeAssetNumber}`]) {
        return {
          ...node,
          nodeAsset:
            node.nodeAssetNumber === 0 || node.nodeAssetNumber === 1
              ? imageUrlByName.node
              : imageUrlByName[`node${node.nodeAssetNumber}`],
          powerupAsset: powerUpAsset,
        };
      }
      return {
        ...node,
        nodeAsset: imageUrlByName.node,
        powerupAsset: powerUpAsset,
      };
    });

    const connectingLineColor = model.gameType.includes("spaceShot")
      ? "rgba(251, 0, 39, 0.6)"
      : "rgba(251, 0, 39, 0.1)";

    context.save();

    context.translate(
      -model.player.x +
      (model.viewport.width * HALF - PLAYER_MEASUREMENT * HALF),
      -model.player.y +
      (model.viewport.height * HALF + PLAYER_MEASUREMENT * HALF)
    );

    drawBackground(context, model.viewport, {
      asset: imageUrlByName.gameBackground,
      backgroundYPositions: model.backgroundYPositions,
    });

    drawEdges(context, model.viewport, {
      asset: imageUrlByName.edge,
      backgroundYPositions: model.backgroundYPositions,
    });

    drawConnectingLine(context, {
      start: lineStart,
      end: model.player,
      isPowerUp: lineStart.isPowerUp,
      connectingLineColor,
    });
    drawNodes(context, nodes, model.center);

    if (model.gameState === "GAME_OVER" || model.gameState === "GAME_RESET") {
      drawPlayerGameOverState(context, playerCircle, {
        assetX:
          model.powerBarValue > 0 ? WALL_COLLISION_ASSET_X : STILL_ASSET_X,
      });
    } else if (model.gameState === "PLAY") {
      if (model.gameType.includes("spaceShot")) {
        drawInanimatePlayerPlayState(
          context,
          playerCircle,
          model.elapsedTime,
          model.player.isPowerUp,
          model.inOrbit
        );
      } else {
        if (model.inOrbit) {
          drawPlayerRotationState(
            context,
            playerCircle,
            model.player.isPowerUp
          );
        } else {
          drawPlayerPlayState(
            context,
            playerCircle,
            model.elapsedTime,
            model.player.isPowerUp
          );
        }
      }
    } else {
      drawPlayerGameReadyState(context, playerCircle);
    }

    context.restore();

    if (model.gameState !== "GAME_READY") {
      getTimeFormat(model, context);
    }
  };
}

// SUBSCRIPTIONS
function subscriptions() {
  return [events.onAnimationFrame(msg.tick)];
}

// IMAGES
function loadImages(imageUrlByName) {
  return Promise.all(
    Object.keys(imageUrlByName).map(
      (assetName) =>
        new Promise((resolve, reject) => {
          const assetReference = new Image();
          assetReference.addEventListener("load", () => {
            resolve({
              assetName,
              assetReference,
            });
          });
          assetReference.addEventListener("error", reject);
          assetReference.src = imageUrlByName[assetName];
        })
    )
  )
    .then((arrayOfImageObjects) =>
      arrayOfImageObjects.reduce((object, assetObject) => {
        object[assetObject.assetName] = assetObject.assetReference;
        return object;
      }, {})
    )
    .catch((error) => {
      // eslint-disable-next-line no-console
      console.error(error);
    });
}

window.miniGames = window.miniGames || {};
window.miniGames.slingShoter = initWithSettings({
  gameType: "slingShoter",
});


const fallbackAssets = {
  player: `${ASSETS_URL}sling_shoter_sports_player_1.png`,
  node: `${ASSETS_URL}sling_shoter_sports_node.png`,
  powerup: `${ASSETS_URL}sling_shoter_sports_powerup.png`,
  edge: `${ASSETS_URL}sling_shoter_sports_game_background_edge.png`,
  gameBackground: `${ASSETS_URL}sling_shoter_sports_game_background.png`,
  desktopBackground: `${ASSETS_URL}sling_shoter_sports_desktop_background.png`,
};

function getNodeAssetCount(imageUrlByName) {
  return Object.keys(imageUrlByName)
    .filter((key) => key.includes("node"))
    .map((item) => imageUrlByName[item]).length;
}

// START PROGRAM
function initWithSettings({ gameType }) {
  return function (domElement, settings, callbacks) {
    return loadImages(settings.assets || fallbackAssets)
      .then((imageUrlByName) => {
        const { send, reset } = canvas(domElement, {
          nodeAssetCount: getNodeAssetCount(imageUrlByName),
          gameType,
        })({
          init,
          view: view(imageUrlByName),
          update: update(callbacks),
          subscriptions,
        });

        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState !== "visible") {
            reset();
          }
        });

        domElement.appendChild(addFeedbackOverlay());

        return {
          playerButtonDown() {
            return send(msg.buttonDown());
          },
          playerButtonUp() {
            return send(msg.buttonUp());
          },
          resetGame: reset,
        };
      })
      .catch(console.error); // eslint-disable-line
  };
}
