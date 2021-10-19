/**
 * Elm inspired canvas game framework version 1.2
 */

// based on iPhone 5/SE viewport
// scaled up to iPhone 6/7/8 size
const CANVAS_WIDTH = 375;
const CANVAS_HEIGHT = 526;

export function canvas(domElement, flags) {
  const { CONTEXT, CANVAS } = createStage(domElement);
  domElement.appendChild(CANVAS);
  resizeCanvas();
  const nextTickMessages = [];

  return ({ init, view, update, subscriptions }) => {
    // SETUP INITIAL MODEL & COMMANDS
    const meta = {
      viewport: {
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT
      }
    };
    const [initialModel, initialCommands] = init(flags, meta);
    let model = initialModel;
    let messages = commandsToMessages(initialCommands);

    window.addEventListener("resize", resizeCanvas);

    // SETUP SUBSCRIPTIONS
    const newSubscriptions = subscriptions(model).map(({ event, msg }) => ({
      event,
      msg: msg(domElement)
    }));

    for (const subscription of newSubscriptions) {
      if (subscription.event === "animationframe") {
        nextTickMessages.push(subscription.msg);
        continue;
      }
      /*eslint no-loop-func: 0*/
      document.addEventListener(subscription.event, event => {
        messages.push(subscription.msg(event));
      });
    }

    requestAnimationFrame(function loop(timestamp) {
      requestAnimationFrame(loop);

      nextTickMessages.forEach(msg => {
        messages.push(msg(timestamp));
      });

      const latestMessages = messages.splice(0, messages.length);
      for (const msg of latestMessages) {
        const [newModel, newCommands] = update(msg, model);
        model = newModel;
        const newMessages = commandsToMessages(newCommands, messages);
        messages.push(...newMessages);
      }

      CONTEXT.save();
      CONTEXT.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      view(CONTEXT, model);
      CONTEXT.restore();
    });

    function commandsToMessages(_commands) {
      const _messages = [];
      for (const command of _commands) {
        if (command.commandType) {
          switch (command.commandType) {
            case "request":
              {
                const [
                  requestInfo,
                  requestInit,
                  successMessage,
                  failMessage
                ] = command.args;
                fetch(requestInfo, requestInit)
                  .then(response => response.json())
                  .then(response => messages.push(successMessage(response)))
                  .catch(error => messages.push(failMessage(error)));
              }
              break;
            default:
              console.error(`Unknown command: ${command.commandType}`); // eslint-disable-line
          }
        } else {
          _messages.push(command);
        }
      }
      return _messages;
    }

    // PORTS
    function send(msg) {
      messages.push(msg);
    }

    function reset() {
      const [_initialModel, _initialCommands] = init(flags, meta);
      model = _initialModel;
      messages = commandsToMessages(_initialCommands);
    }

    return { send, reset };
  };

  function createStage() {
    const _CANVAS = document.createElement("canvas");
    const _CONTEXT = _CANVAS.getContext("2d");
    _CANVAS.style.display = "block";
    return { CANVAS: _CANVAS, CONTEXT: _CONTEXT };
  }

  function resizeCanvas() {
    const rect = domElement.getBoundingClientRect();
    const width = rect.width;
    const height = (CANVAS_HEIGHT / CANVAS_WIDTH) * width;

    CANVAS.width = width * window.devicePixelRatio;
    CANVAS.height = height * window.devicePixelRatio;
    CANVAS.style.width = `${width}px`;
    CANVAS.style.height = `${height}px`;

    CONTEXT.scale(
      (window.devicePixelRatio * width) / CANVAS_WIDTH,
      (window.devicePixelRatio * height) / CANVAS_HEIGHT
    );
    return { WIDTH: width, HEIGHT: height };
  }
}

export const events = {
  onMouseMove(msg) {
    let rect = null;
    let container = null;

    window.addEventListener("resize", updateDimensions);

    function updateDimensions() {
      if (!container) {
        return;
      }
      rect = container.getBoundingClientRect();
    }

    return {
      event: "mousemove",
      msg: _container => {
        container = _container;
        updateDimensions();
        return event =>
          msg({
            x: (event.clientX - rect.left) / (rect.width / CANVAS_WIDTH),
            y: (event.clientY - rect.top) / (rect.width / CANVAS_WIDTH)
          });
      }
    };
  },

  onAnimationFrame(msg) {
    return {
      event: "animationframe",
      msg: () => timestamp => msg(timestamp)
    };
  }
};

export const request = (...args) => {
  const MIN_ARGUMENTS = 4;
  if (args.length < MIN_ARGUMENTS) {
    throw new Error(
      `the request command expects ${MIN_ARGUMENTS} arguments:
requestInfo, requestInit (same as fetch)
successMessage, failMessage`
    );
  }
  return {
    commandType: "request",
    args
  };
};
