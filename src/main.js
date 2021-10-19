import { canvas, events, request } from "@diesdasdigital/js-canvas-library";
import { updatePowerBar } from "./js/powerbar.js";
import { getTimeFormat } from "./js/gameTimer.js";
import {
  HALF,
  FULL_POWER_BAR_VALUE,
  POWER_BAR_REDUCTION_SPEED,
} from "./js/constants.js";

// INIT
function init(flags, meta) {
  const model = {
    boxX: -100,
    boxY: -100,
    color: "black",
    viewport: meta.viewport,
    gameState: "GAME_READY", // "GAME_READY" || "PLAY" || "GAME_OVER"
    powerBarValue: FULL_POWER_BAR_VALUE,
    initialTimeStamp: null,
    elapsedTime: 0,
  };
  const cmds = [];
  return [model, cmds];
}

// MSG
const msg = {
  updateMouse: (mouseEvent) => ({
    type: "updateMouse",
    data: { x: mouseEvent.x, y: mouseEvent.y },
  }),
  switchColor: () => ({
    type: "switchColor",
  }),
  tick: (timestamp) => ({
    type: "tick",
    data: { timestamp },
  }),
  requestSucceeded: (response) => ({
    type: "requestSucceeded",
    data: { response },
  }),
  requestFailed: (error) => ({
    type: "requestFailed",
    data: { error },
  }),
  gameOver: () => ({
    type: "gameOver",
  }),
};

// UPDATE
function update(callbacks) {
  return (_msg, model) => {
    switch (_msg.type) {
      case "updateMouse":
        return [{ ...model, boxX: _msg.data.x, boxY: _msg.data.y }, []];

      case "switchColor":
        return [
          {
            ...model,
            gameState: "PLAY",
            color: "red",
          },
          [
            request(
              "https://jsonip.com/",
              null,
              msg.requestSucceeded,
              msg.requestFailed
            ),
          ],
        ];

      case "tick":
        updatePowerBar(model.powerBarValue);
        switch (model.gameState) {
          case "PLAY":
            return [
              {
                ...model,
                timestamp: _msg.data.timestamp,
                powerBarValue: model.powerBarValue - POWER_BAR_REDUCTION_SPEED,
                initialTimeStamp: model.initialTimeStamp || _msg.data.timestamp,
                elapsedTime: _msg.data.timestamp - model.initialTimeStamp,
              },
              [],
            ];

          default:
            return [model, []];
        }

      case "requestSucceeded":
        console.log(_msg.data); // eslint-disable-line
        return [model, []];

      case "requestFailed":
        console.log(_msg.data); // eslint-disable-line
        return [model, []];

      case "gameOver":
        callbacks.onGameOver();
        return [model, []];

      default:
        return [model, []];
    }
  };
}

// VIEW
// eslint-disable-next-line no-unused-vars
function view(imageUrlByName) {
  // imageUrlByName is an object with the loaded images. These images will be the assets of the game
  return (context, model) => {
    const SIZE = 20;
    context.fillStyle = model.color;
    context.fillRect(
      model.boxX - SIZE * HALF,
      model.boxY - SIZE * HALF,
      SIZE,
      SIZE
    );
    if (model.gameState === "PLAY") {
      getTimeFormat(model, context);
    }
  };
}

// SUBSCRIPTIONS
function subscriptions() {
  return [
    events.onMouseMove(msg.updateMouse),
    events.onAnimationFrame(msg.tick),
  ];
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

window.rbMiniGames = window.rbMiniGames || {};
window.rbMiniGames.example = initWithSettings();

const fallbackAssets = {};

// START PROGRAM
function initWithSettings() {
  return function (domElement, settings, callbacks) {
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
            send(msg.switchColor());
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
