import { canvas, events } from "./js/browser.js";

import {
  drawPlayer,
  drawPlatforms,
  drawTimer,
  drawBackground,
} from "./js/drawing.js";
import { getTimeFormat } from "./js/gameTimer.js";
import { updatePowerBar } from "./js/powerbar.js";
import {
  PLAYER_HEIGHT,
  HALF,
  PLAYER_WIDTH,
  GRAVITY,
  PLAYER_ACCELERATION,
  PLAYER_WEIGHT,
  PLAYER_SPEED,
  PLATFORM_GAP,
  PLATFORM_GAP_IN_BETWEEN,
  PLATFORM_THICKNESS,
  INVERT,
  TWO,
  MAX_RANDOM_NUMBER,
  FOUR,
  SIX,
  THREE,
  COLLECTABLE_WIDTH,
  COLLECTABLE_HEIGHT,
  FULL_POWER_BAR_VALUE,
  POWER_BAR_REDUCTION_SPEED,
  BACKGROUND_IMAGE_HEIGHT,
  CREATE_COLLECTABLE_FREQUENCY,
  CREATE_COLLECTABLE_FREQUENCY_GYM,
  NUMBER_OF_COLLECTABLES_GYM,
  JUMPS_BETWEEN_POWER_UPS,
  GYM_STARTING_POWER_BAR_VALUE,
  GYM_DEFAULT_POWER_BAR_PLUS_VALUE,
  GYM_POWER_UP_POWER_BAR_PLUS_VALUE,
  MAX_RANDOM_NUMBER_FOR_WALL_FLOOR,
} from "./js/config.js";
import {
  fallbackAssetsDefault,
  fallbackAssetsGym,
  fallbackAssetsStudy,
  fallbackAssetsWorkWhite,
  fallbackAssetsWorkBlue,
} from "./js/fallback-assets.js";

const VERTICAL_CAMERA_POSITION = 50;
const GAME_TYPE_GYM = "gym";
let gameType = "default";
let sugarFree = false;
let randomiseWallsAndFloors = false;

// INIT

function init(flags, meta) {
  const model = {
    viewport: meta.viewport,
    currentBackgroundYPosition: -(
      BACKGROUND_IMAGE_HEIGHT - meta.viewport.height
    ),
    initialTimeStamp: null,
    elapsedTime: 0,
    powerBarValue:
      gameType === GAME_TYPE_GYM
        ? GYM_STARTING_POWER_BAR_VALUE
        : FULL_POWER_BAR_VALUE,
    player: {
      x: meta.viewport.width * HALF,
      y:
        meta.viewport.height -
        PLATFORM_GAP_IN_BETWEEN -
        PLATFORM_THICKNESS -
        PLAYER_HEIGHT * HALF,
      vx: PLAYER_SPEED,
      vy: 0,
      isFalling: false,
      collidedWithWall: null,
      currentPlatformY:
        meta.viewport.height -
        PLATFORM_GAP_IN_BETWEEN -
        PLATFORM_THICKNESS * TWO,
    },
    levels: generateInitialRandomLevels(
      "GAME_READY",
      MAX_RANDOM_NUMBER,
      meta.viewport
    ),
    jumpsSinceLastPowerUp: 0,
    camera: {
      cameraMovementHeight: 0,
      cameraMovementCounter: -VERTICAL_CAMERA_POSITION,
      cameraViewportHeight: meta.viewport.height - PLATFORM_GAP_IN_BETWEEN,
    },
    gameState: "GAME_READY",
  };
  const cmds = [];
  return [model, cmds];
}

// MSG
const msg = {
  jump: () => ({
    type: "jump",
  }),

  tick: (timestamp) => ({
    type: "tick",
    data: { timestamp },
  }),

  collectableCollected: () => ({
    type: "collectableCollected",
  }),
};

// UPDATE
function update(callbacks) {
  return (_msg, model) => {
    switch (_msg.type) {
      case "jump":
        if (model.gameState === "GAME_OVER") {
          return [model, []];
        }

        if (model.gameState === "GAME_READY") {
          return [{ ...model, gameState: "PLAY" }, []];
        }

        return [
          {
            ...model,
            player: {
              ...model.player,
              ...addingJumpVelocity(model),
            },
            camera: {
              ...model.camera,
              cameraMovementHeight: moveCamera(model),
            },
            levels: [
              ...addNewlevelToLevels(
                model,
                Math.floor(
                  model.camera.cameraMovementHeight / PLATFORM_GAP_IN_BETWEEN
                ) %
                (gameType === GAME_TYPE_GYM
                  ? CREATE_COLLECTABLE_FREQUENCY_GYM
                  : CREATE_COLLECTABLE_FREQUENCY) ===
                0,
                model.jumpsSinceLastPowerUp === JUMPS_BETWEEN_POWER_UPS
              ),
            ],
            jumpsSinceLastPowerUp: getJumpsSinceLastPowerUp(
              model.jumpsSinceLastPowerUp,
              model.levels[2].collectableImage
            ),
          },
          [],
        ];

      case "tick": {
        if (model.gameState !== "GAME_OVER") {
          updatePowerBar(model);
        }

        const didCollect = checkIfPlayerCollected(model);

        if (checkIfGameIsOver(model) && model.gameState === "PLAY") {
          callbacks.onGameOver();
        }

        if (model.gameState === "GAME_READY") {
          return [model, []];
        }

        return [
          model.gameState === "PLAY"
            ? {
              ...model,
              currentBackgroundYPosition:
                model.player.currentPlatformY - model.viewport.height >
                  model.currentBackgroundYPosition - BACKGROUND_IMAGE_HEIGHT
                  ? model.currentBackgroundYPosition
                  : model.currentBackgroundYPosition -
                  BACKGROUND_IMAGE_HEIGHT,
              initialTimeStamp: model.initialTimeStamp || _msg.data.timestamp,
              elapsedTime: _msg.data.timestamp - model.initialTimeStamp,
              powerBarValue: model.powerBarValue - POWER_BAR_REDUCTION_SPEED,
              player: {
                ...model.player,
                ...horizontalMoving(model),
                ...playerJump(model),
              },
              gameState: checkIfGameIsOver(model) ? "GAME_OVER" : "PLAY",
            }
            : {
              ...model,
              elapsedTime: model.elapsedTime,
              powerBarValue: model.powerBarValue,
              player:
                model.powerBarValue <= 0
                  ? model.player
                  : {
                    ...model.player,
                    vy: model.player.vy + 1,
                    y: model.player.y + model.player.vy,
                    x: model.player.x + model.player.vx,
                    currentPlatformY: model.player.currentPlatformY,
                  },
            },
          didCollect ? [msg.collectableCollected()] : [],
        ];
      }

      case "collectableCollected": {
        return [
          {
            ...model,
            powerBarValue: getAmountOfPowerBarValue(
              model.levels[2],
              model.powerBarValue
            ),
            levels: addCollectionFlag(model.levels),
          },
          [],
        ];
      }

      default:
        return [model, []];
    }
  };
}

//HORIZONTAL FUNCTION////////////////////////////////////////
function horizontalMoving(model) {
  const { player, viewport, levels } = model;

  if (
    levels[2].leftWall &&
    player.x - PLAYER_WIDTH * HALF < PLATFORM_GAP + PLATFORM_THICKNESS &&
    player.collidedWithWall !== "LEFT_WALL"
  ) {
    return {
      vx: player.vx * INVERT,
      x: player.x + player.vx * INVERT,
      collidedWithWall: "LEFT_WALL",
    };
  }

  if (
    levels[2].rightWall &&
    player.x + PLAYER_WIDTH * HALF >
    viewport.width - PLATFORM_GAP - PLATFORM_THICKNESS &&
    player.collidedWithWall !== "RIGHT_WALL"
  ) {
    return {
      vx: player.vx * INVERT,
      x: player.x + player.vx * INVERT,
      collidedWithWall: "RIGHT_WALL",
    };
  }

  if (
    player.x + PLAYER_WIDTH * HALF > viewport.width - PLATFORM_GAP ||
    player.x - PLAYER_WIDTH * HALF < PLATFORM_GAP
  ) {
    return {
      vy: player.vy + 1,
      y: player.y + player.vy,
      isFalling: true,
    };
  }

  return {
    x: player.x + player.vx,
  };
}

//JUMPING FUNCTIONS////////////////////////////////////////
function addingJumpVelocity({ player }) {
  if (player.vy < 0) {
    return {};
  }

  return {
    vy: player.vy - PLAYER_ACCELERATION,
    currentPlatformY: player.currentPlatformY - PLATFORM_GAP_IN_BETWEEN,
    collidedWithWall: null,
  };
}

function playerJump({ player }) {
  if (player.vy === 0) {
    return {};
  }
  if (
    player.vy > 0 &&
    player.y + PLAYER_HEIGHT * HALF > player.currentPlatformY
  ) {
    return {
      vy: 0,
      y: player.currentPlatformY - PLAYER_HEIGHT * HALF + PLATFORM_THICKNESS,
    };
  }

  // APPLY GRAVITY
  return {
    vy: player.vy + GRAVITY * PLAYER_WEIGHT,
    y: player.y + player.vy,
  };
}

//CAMERA FUNCTION////////////////////////////////////////
function moveCamera({ camera }) {
  return Math.max(camera.cameraMovementHeight + PLATFORM_GAP_IN_BETWEEN, 0);
}

//NEW LEVELS RANDOMISER FUNCTION////////////////////////////////////////
function wallRandomiser() {
  const randomNumber = Math.floor(Math.random() * MAX_RANDOM_NUMBER);
  return Boolean(randomNumber % TWO);
}

function getRandomWallAndFloorNumber() {
  const maxWallAndFloorVariation = MAX_RANDOM_NUMBER_FOR_WALL_FLOOR;
  return Math.floor(Math.random() * maxWallAndFloorVariation) + 1;
}

//INIT LEVELS RANDOMISER FUNCTION////////////////////////////////////////
function generateInitialRandomLevels(gameState, numberOfLevels, viewport) {
  const FIRST_THREE_LEVELS = 3;
  const levels = new Array(numberOfLevels).fill().map((floor, index) => {
    if (index < FIRST_THREE_LEVELS) {
      return {
        leftWall: true,
        rightWall: true,
        wallAndFloorRandomNumber: randomiseWallsAndFloors
          ? getRandomWallAndFloorNumber()
          : null,
      };
    }

    return {
      leftWall: wallRandomiser(),
      rightWall: wallRandomiser(),
      wallAndFloorRandomNumber: randomiseWallsAndFloors
        ? getRandomWallAndFloorNumber()
        : null,
    };
  });

  createCollectable({ gameState, levels, viewport });

  return levels;
}

//NEW levels FUNCTION////////////////////////////////////////
function addNewlevelToLevels(model, shouldCreateCollectable, powerUp) {
  const { gameState, levels, player, viewport } = model;
  if (player.vy < 0) {
    return levels;
  }

  const newWallObject = {
    leftWall: wallRandomiser(),
    rightWall: wallRandomiser(),
    wallAndFloorRandomNumber: randomiseWallsAndFloors
      ? getRandomWallAndFloorNumber()
      : null,
  };

  if (
    levels[levels.length - 1].leftWall === true &&
    levels[levels.length - THREE].leftWall === true
  ) {
    newWallObject.leftWall = false;
  }

  if (
    levels[levels.length - 1].leftWall === false &&
    levels[levels.length - THREE].leftWall === false
  ) {
    newWallObject.leftWall = true;
  }

  if (levels[levels.length - TWO].rightWall === true) {
    newWallObject.rightWall = false;
  }

  if (
    levels[levels.length - 1].rightWall === false &&
    levels[levels.length - TWO].rightWall === false &&
    levels[levels.length - THREE].rightWall === false
  ) {
    newWallObject.rightWall = true;
  }

  levels.push(newWallObject);

  if (shouldCreateCollectable) {
    createCollectable({
      gameState,
      levels,
      viewport,
      powerUp,
    });
  }
  levels.shift();

  return levels;
}

//COLLECTABLES FUNCTIONS////////////////////////////////////////

function createCollectable({ gameState, levels, viewport, powerUp }) {
  const randomKeyNumber =
    gameState === "GAME_READY"
      ? TWO
      : Math.floor(Math.random() * MAX_RANDOM_NUMBER);

  if (
    ((levels[randomKeyNumber].collectableX &&
      levels[randomKeyNumber + 1].collectableX) ||
      randomKeyNumber < SIX ||
      randomKeyNumber > levels.length - THREE) &&
    gameState !== "GAME_READY"
  ) {
    return createCollectable({ gameState, levels, viewport });
  }

  const numberOfCollectables =
    gameType === GAME_TYPE_GYM ? NUMBER_OF_COLLECTABLES_GYM : FOUR;
  const randomNumberOfCollectables = Math.floor(
    Math.random() * numberOfCollectables + 1
  );
  levels[randomKeyNumber].collectableImage = powerUp
    ? SIX
    : randomNumberOfCollectables;

  if (
    !levels[levels.length - TWO].collectableX &&
    !levels[randomKeyNumber + 1].collectableX &&
    !levels[randomKeyNumber + TWO].collectableX &&
    !levels[randomKeyNumber - 1].collectableX &&
    !levels[randomKeyNumber - TWO].collectableX
  ) {
    const randomXPosition =
      Math.floor(
        Math.random() * (viewport.width - PLATFORM_GAP - PLATFORM_THICKNESS)
      ) +
      PLATFORM_GAP +
      PLATFORM_THICKNESS;

    if (
      randomXPosition - COLLECTABLE_WIDTH <=
      PLATFORM_GAP + PLATFORM_THICKNESS
    ) {
      return (levels[randomKeyNumber].collectableX =
        randomXPosition + PLATFORM_GAP + PLATFORM_THICKNESS);
    }
    if (
      randomXPosition + COLLECTABLE_WIDTH >=
      viewport.width - PLATFORM_GAP - PLATFORM_THICKNESS
    ) {
      return (levels[randomKeyNumber].collectableX =
        randomXPosition -
        (PLATFORM_GAP + PLATFORM_THICKNESS + COLLECTABLE_WIDTH));
    }
    return (levels[randomKeyNumber].collectableX = randomXPosition);
  }

  return levels;
}

function addCollectionFlag(levels) {
  return [
    levels[0],
    levels[1],
    { ...levels[2], collected: true },
    ...levels.slice(THREE),
  ];
}

function checkIfPlayerCollected({ levels, player }) {
  if (levels[2].collected) {
    return false;
  }

  return (
    (levels[2].collectableX &&
      player.x + PLAYER_WIDTH >= levels[2].collectableX &&
      player.x + PLAYER_WIDTH <= levels[2].collectableX + COLLECTABLE_WIDTH &&
      player.y + PLAYER_HEIGHT <= player.currentPlatformY &&
      player.y + PLAYER_HEIGHT >=
      player.currentPlatformY - COLLECTABLE_HEIGHT) ||
    (player.x <= levels[2].collectableX + COLLECTABLE_WIDTH &&
      player.x >= levels[2].collectableX &&
      player.y >= player.currentPlatformY - COLLECTABLE_HEIGHT &&
      player.y <= player.currentPlatformY)
  );
}

//POWER-UP FUNCTIONS/////////////////////////////////////////////////
function getAmountOfPowerBarValue(level, currentValue) {
  if (gameType === GAME_TYPE_GYM && level.collectableImage === SIX) {
    return currentValue + GYM_POWER_UP_POWER_BAR_PLUS_VALUE <
      FULL_POWER_BAR_VALUE
      ? currentValue + GYM_POWER_UP_POWER_BAR_PLUS_VALUE
      : FULL_POWER_BAR_VALUE;
  }

  if (gameType === GAME_TYPE_GYM) {
    return currentValue + GYM_DEFAULT_POWER_BAR_PLUS_VALUE <
      FULL_POWER_BAR_VALUE
      ? currentValue + GYM_DEFAULT_POWER_BAR_PLUS_VALUE
      : FULL_POWER_BAR_VALUE;
  }

  return FULL_POWER_BAR_VALUE;
}

function getJumpsSinceLastPowerUp(jumps, imageIndex) {
  if (gameType !== GAME_TYPE_GYM) {
    return 0;
  }

  if (jumps === JUMPS_BETWEEN_POWER_UPS && imageIndex !== SIX) {
    return JUMPS_BETWEEN_POWER_UPS;
  }

  if (jumps === JUMPS_BETWEEN_POWER_UPS) {
    return 0;
  }

  return jumps + 1;
}

//CHECK IF GAME OVER FUNCTION////////////////////////////////////////
function checkIfGameIsOver(model) {
  return model.powerBarValue <= 0 || model.player.isFalling;
}

// VIEW
function view(imageByName) {
  return function (context, model) {
    const { camera, player } = model;
    if (
      camera.cameraMovementCounter < camera.cameraMovementHeight &&
      -player.currentPlatformY +
      camera.cameraViewportHeight -
      VERTICAL_CAMERA_POSITION >
      camera.cameraMovementCounter
    ) {
      camera.cameraMovementCounter += 10;
    }

    context.translate(0, camera.cameraMovementCounter);
    drawBackground(context, model, imageByName);
    drawPlatforms(
      context,
      model,
      imageByName,
      gameType,
      sugarFree,
      randomiseWallsAndFloors
    );
    drawPlayer(context, model, imageByName);
    if (model.gameState !== "GAME_READY") {
      getTimeFormat(model, context, drawTimer);
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
          assetReference.addEventListener("error", () =>
            reject(
              new Error(
                `Could not load asset "${assetName}" at ${imageUrlByName[assetName]}`
              )
            )
          );
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

// START PROGRAM
window.miniGames = window.miniGames || {};

window.miniGames.highRiseWorkBlue = initWithSettings({
  typeOfGame: "gym",
  fallbackAssets: fallbackAssetsWorkBlue,
  isSugarFree: false,
  willRandomiseWallsAndFloors: true,
});


function initWithSettings({
  typeOfGame,
  fallbackAssets,
  isSugarFree,
  willRandomiseWallsAndFloors,
}) {
  return function (domElement, settings, callbacks) {
    gameType = typeOfGame;
    sugarFree = isSugarFree;
    randomiseWallsAndFloors = Boolean(willRandomiseWallsAndFloors);

    return loadImages(settings.assets || fallbackAssets)
      .then((imageUrlByName) => {
        const { send, reset } = canvas(
          domElement,
          {}
        )({
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

        return {
          playerButtonDown() {
            send(msg.jump());
          },
          playerButtonUp() {
            // no-op
          },
          resetGame: reset,
        };
      })
      .catch(console.error); // eslint-disable-line
  };
}
