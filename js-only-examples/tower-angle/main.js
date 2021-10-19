import { canvas, events } from "./js/browser.js";
import { updatePowerBar } from "./js/powerbar.js";
import {
  directTowerDrawing,
  drawFeedback,
  drawLevelUpFeedback,
  drawTowerGlow
} from "./js/drawing.js";
import {
  INVERT,
  ACCESSIBLE_ANGLES,
  CENTER_ANGLE,
  SWING_VELOCITY,
  TWO_DECIMAL_POINTS,
  PERFECT_PADDING,
  RIGHT_PADDING,
  MAX_LENGTH_OF_PREVIOUS_LEVELS_ARRAY,
  FEEDBACK_SCREEN_TIME,
  FULL_POWER_BAR_VALUE,
  DEFAULT_POWER_BAR_REDUCTION_SPEED,
  THREE_QUARTERS,
  TRANSITION_SCREEN_TIME,
  WRONG_POWER_BAR_REDUCTION_SPEED_INCREMENT,
  INCREASED_SWING_VELOCITY_SPEED_INCREMENT
} from "./js/constants.js";
import { towerAngles } from "./js/towerAngles.js";
import { addFeedbackColor, removeFeedbackColor } from "./js/feedback-colors.js";
import {
  addButtonTargetTowerState,
  removeButtonTargetTowerState
} from "./js/change-button-visual.js";
import { addOverlaysAndStyles } from "./js/add-overlays-and-styles.js";

const { START_ACCESSIBLE_ANGLE, END_ACCESSIBLE_ANGLE } = ACCESSIBLE_ANGLES;

const assetsUrl =
  "";

// INIT
function init(flags, meta) {
  const model = {
    viewport: meta.viewport,
    time: {
      initialTimeStamp: 0,
      elapsedTime: 0,
      feedbackTimer: 0
    },
    tower: {
      currentDrawingAngle: CENTER_ANGLE,
      isInverted: false,
      currentSwingVelocity: SWING_VELOCITY,
      selectedAngle: null
    },
    levels: {
      previousLevelsIndexes: [],
      currentLevelObject: null,
      currentLevel: 1
    },
    feedback: null, // null || "WRONG" || "RIGHT" ||"PERFECT"
    gameState: "GAME_READY", // "GAME_READY" || "PLAY" || "TARGET_TOWER" || "GAME_OVER"
    transition: {
      transitionTimer: 0,
      transitionFromPlaySate: false,
      fadingValue: 1,
      startAnimation: false
    },
    powerBarValue: FULL_POWER_BAR_VALUE,
    currentPowerBarReductionSpeed: DEFAULT_POWER_BAR_REDUCTION_SPEED
  };
  const cmds = [];
  return [model, cmds];
}

// MSG
const msg = {
  selectedAngle: () => ({
    type: "selected angle"
  }),
  tick: timestamp => ({
    type: "tick",
    data: { timestamp }
  })
};

// UPDATE
function update(callbacks) {
  return (_msg, model) => {
    switch (_msg.type) {
      case "selected angle":
        switch (model.gameState) {
          case "GAME_READY":
            return [
              {
                ...model,

                levels: {
                  ...model.levels,
                  ...randomiseLevelObject(model.levels),
                  currentLevel: model.levels.currentLevel + 1
                },
                gameState: "TARGET_TOWER"
              },
              []
            ];

          case "PLAY":
            return [
              {
                ...model,
                tower: {
                  ...model.tower,
                  selectedAngle: model.tower.currentDrawingAngle
                },
                feedback: getFeedback(model),
                transition: {
                  ...model.transition,
                  transitionFromPlaySate: true
                }
              },

              []
            ];
          default:
            return [model, []];
        }
      case "tick":
        if (model.time.feedbackTimer >= FEEDBACK_SCREEN_TIME) {
          removeFeedbackColor();
          return [
            {
              ...model,
              tower: {
                ...model.tower,
                selectedAngle: null
              },
              time: {
                ...model.time,
                feedbackTimer: 0
              },
              levels:
                model.feedback !== "wrong"
                  ? {
                    ...model.levels,
                    ...randomiseLevelObject(model.levels),
                    currentLevel: model.levels.currentLevel + 1
                  }
                  : model.levels,
              gameState:
                getFeedback(model) === "wrong" ? "PLAY" : "TARGET_TOWER",
              feedback: null,
              transition: {
                ...model.transition,
                startAnimation: true
              },
              powerBarValue: calculatePowerBarValue(
                model.feedback,
                model.powerBarValue
              ),
              currentPowerBarReductionSpeed:
                model.feedback === "wrong"
                  ? model.currentPowerBarReductionSpeed +
                  WRONG_POWER_BAR_REDUCTION_SPEED_INCREMENT
                  : DEFAULT_POWER_BAR_REDUCTION_SPEED
            },
            []
          ];
        }

        if (model.feedback) {
          addFeedbackColor(model.feedback);
          return [
            {
              ...model,
              tower: {
                ...model.tower,
                currentDrawingAngle: model.tower.selectedAngle
              },
              time: {
                ...model.time,
                feedbackTimer: model.time.feedbackTimer + 1
              }
            },
            []
          ];
        }
        switch (model.gameState) {
          case "TARGET_TOWER":
            updatePowerBar(model.powerBarValue);
            addButtonTargetTowerState();
            return [
              model.transition.transitionTimer >= TRANSITION_SCREEN_TIME
                ? {
                  ...model,
                  gameState: "PLAY",
                  tower: {
                    ...model.tower,
                    currentSwingVelocity:
                      Math.sign(model.tower.currentSwingVelocity) === INVERT
                        ? model.tower.currentSwingVelocity -
                        INCREASED_SWING_VELOCITY_SPEED_INCREMENT
                        : model.tower.currentSwingVelocity +
                        INCREASED_SWING_VELOCITY_SPEED_INCREMENT
                  },
                  transition: {
                    ...model.transition,
                    transitionTimer: 0,
                    fadingValue: 1
                  }
                }
                : {
                  ...model,
                  transition: {
                    ...model.transition,
                    fadingValue: model.transition.fadingValue + 1,
                    transitionTimer: model.transition.transitionTimer + 1
                  }
                },
              []
            ];
          case "GAME_READY":
            return [
              {
                ...model,
                time: { ...model.time, initialTimeStamp: _msg.data.timestamp }
              },
              []
            ];

          case "GAME_OVER":
            callbacks.onGameOver();
            return [
              {
                ...model,
                tower: {
                  ...model.tower,
                  currentDrawingAngle: model.tower.currentDrawingAngle
                }
              },
              []
            ];

          case "PLAY":
            updatePowerBar(model.powerBarValue);
            removeButtonTargetTowerState();
            return [
              {
                ...model,
                time: {
                  ...model.time,
                  elapsedTime: _msg.data.timestamp - model.time.initialTimeStamp
                },
                tower: {
                  ...model.tower,
                  ...setDirection(model),
                  selectedAngle: null
                },
                powerBarValue:
                  model.powerBarValue - model.currentPowerBarReductionSpeed,
                gameState: model.powerBarValue <= 0 ? "GAME_OVER" : "PLAY"
              },
              []
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

      default:
        return [model, []];
    }
  };
}

function getFeedback({
  levels: { currentLevelObject },
  tower: { currentDrawingAngle }
}) {
  const fixedParsedcurrentDrawingAngle = parseFloat(
    currentDrawingAngle.toFixed(TWO_DECIMAL_POINTS)
  );
  if (
    currentLevelObject.angle + PERFECT_PADDING >=
    fixedParsedcurrentDrawingAngle &&
    currentLevelObject.angle - PERFECT_PADDING <= fixedParsedcurrentDrawingAngle
  ) {
    return "perfect";
  }
  if (
    currentLevelObject.angle + RIGHT_PADDING >=
    fixedParsedcurrentDrawingAngle &&
    currentLevelObject.angle - RIGHT_PADDING <= fixedParsedcurrentDrawingAngle
  ) {
    return "right";
  }
  return "wrong";
}

function calculatePowerBarValue(feedback, powerBarValue) {
  if (feedback === "perfect") {
    return FULL_POWER_BAR_VALUE;
  }
  if (
    feedback === "right" &&
    powerBarValue < FULL_POWER_BAR_VALUE * THREE_QUARTERS
  ) {
    return FULL_POWER_BAR_VALUE * THREE_QUARTERS;
  }

  return powerBarValue;
}

function setDirection({
  tower: {
    currentDrawingAngle,
    isInverted,
    currentSwingVelocity,
    selectedAngle
  },
  feedback
}) {
  if (feedback) {
    return {
      isInverted,
      currentSwingVelocity,
      selectedAngle
    };
  }
  const fixedParsedcurrentDrawingAngle = parseFloat(
    currentDrawingAngle.toFixed(TWO_DECIMAL_POINTS)
  );
  if (
    (fixedParsedcurrentDrawingAngle <= START_ACCESSIBLE_ANGLE ||
      fixedParsedcurrentDrawingAngle >= END_ACCESSIBLE_ANGLE) &&
    !isInverted
  ) {
    return {
      isInverted: true,
      currentSwingVelocity: currentSwingVelocity * INVERT
    };
  }

  if (fixedParsedcurrentDrawingAngle >= CENTER_ANGLE) {
    return {
      currentDrawingAngle: currentDrawingAngle + currentSwingVelocity,
      isInverted: false
    };
  }
  return {
    currentDrawingAngle: currentDrawingAngle + currentSwingVelocity
  };
}

function randomiseLevelObject(levels) {
  const { previousLevelsIndexes } = levels;
  const newLevelIndex = Math.floor(Math.random() * towerAngles.length);

  let indexUsed = false;

  for (let index = 0; index < previousLevelsIndexes.length; index++) {
    indexUsed = Boolean(previousLevelsIndexes[index] === newLevelIndex);
    if (previousLevelsIndexes[index] === newLevelIndex) {
      break;
    }
  }

  if (indexUsed) {
    return randomiseLevelObject(levels);
  }

  if (previousLevelsIndexes.length >= MAX_LENGTH_OF_PREVIOUS_LEVELS_ARRAY) {
    previousLevelsIndexes.pop();
  }

  previousLevelsIndexes.unshift(newLevelIndex);
  return {
    currentLevelObject: towerAngles[newLevelIndex]
  };
}

// VIEW
function view(imageByName) {
  return (context, model) => {
    switch (model.gameState) {
      case "PLAY":
        if (model.feedback === "perfect" || model.feedback === "right") {
          drawFeedback(context, model, imageByName.glow);
          directTowerDrawing(context, model, imageByName.tower);
          drawLevelUpFeedback(context, model, imageByName.level_up);
        } else {
          if (model.feedback === "wrong") {
            drawTowerGlow(context, model, imageByName.glow);
          }
          directTowerDrawing(context, model, imageByName.tower);
        }
        break;

      case "TARGET_TOWER":
        directTowerDrawing(context, model, imageByName.tower);
        drawTowerGlow(context, model, imageByName.glow);
        break;

      default:
        directTowerDrawing(context, model, imageByName.tower);
        break;
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
      assetName =>
        new Promise((resolve, reject) => {
          const assetReference = new Image();
          assetReference.addEventListener("load", () => {
            resolve({
              assetName,
              assetReference
            });
          });
          assetReference.addEventListener("error", reject);
          assetReference.src = imageUrlByName[assetName];
        })
    )
  )
    .then(arrayOfImageObjects =>
      arrayOfImageObjects.reduce((object, assetObject) => {
        object[assetObject.assetName] = assetObject.assetReference;
        return object;
      }, {})
    )
    .catch(error => {
      // eslint-disable-next-line no-console
      console.error(error);
    });
}

const fallbackAssets = {
  tower: `${assetsUrl}/tower.png`,
  glow: `${assetsUrl}/glow.png`,
  deactivated_button: `${assetsUrl}/can_deactivated.png`,
  level_up: `${assetsUrl}/level_up.png`,
  game_background: `${assetsUrl}/game_background.png`,
  game_background_overlay: `${assetsUrl}/game_background_overlay.png`
};

window.miniGames = window.miniGames || {};
window.miniGames.tower = initWithSettings();

// START PROGRAM
function initWithSettings() {
  return function (domElement, settings, callbacks) {
    return loadImages(settings.assets || fallbackAssets)
      .then(imageUrlByName => {
        const { send, reset } = canvas(
          domElement,
          {}
        )({
          init,
          view: view(imageUrlByName),
          update: update(callbacks),
          subscriptions
        });

        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState !== "visible") {
            reset();
            removeButtonTargetTowerState();
          }
        });

        addOverlaysAndStyles(domElement, imageUrlByName);

        return {
          playerButtonDown() {
            send(msg.selectedAngle());
          },
          playerButtonUp() {
            // no-op
          },
          resetGame: reset
        };
      })
      .catch(console.error); // eslint-disable-line
  };
}
