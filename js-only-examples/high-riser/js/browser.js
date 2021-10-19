// based on iPhone 5/SE viewport
// scaled up to iPhone 6/7/8 size
const CANVAS_WIDTH = 375;
const CANVAS_HEIGHT = 526;

export function canvas(domElement, flags) {
  const { CONTEXT, CANVAS, CONTAINER } = createStage(domElement);
  CONTAINER.appendChild(CANVAS);
  resizeCanvas();
  const nextTickMessages = [];

  return ({ init, view, update, subscriptions }) => {
    // SETUP INITIAL MODEL & COMMANDS
    const meta = {
      viewport: {
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
      },
    };
    const [initialModel, initialCommands] = init(flags, meta);
    let model = initialModel;
    let messages = commandsToMessages(initialCommands);

    window.addEventListener("resize", resizeCanvas);

    // SETUP SUBSCRIPTIONS
    const newSubscriptions = subscriptions(model).map(({ event, msg }) => ({
      event,
      msg: msg(CONTAINER),
    }));

    for (const subscription of newSubscriptions) {
      if (subscription.event === "animationframe") {
        nextTickMessages.push(subscription.msg);
        continue;
      }
      /*eslint no-loop-func: 0*/
      document.addEventListener(subscription.event, (event) => {
        messages.push(subscription.msg(event));
      });
    }

    requestAnimationFrame(function loop(timestamp) {
      requestAnimationFrame(loop);

      nextTickMessages.forEach((msg) => {
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
        _messages.push(command);
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

  function createStage(container) {
    const _CONTAINER = container;
    const _CANVAS = document.createElement("canvas");
    const _CONTEXT = _CANVAS.getContext("2d");
    _CANVAS.style.display = "block";
    return { CONTAINER: _CONTAINER, CANVAS: _CANVAS, CONTEXT: _CONTEXT };
  }

  function resizeCanvas() {
    const rect = CONTAINER.getBoundingClientRect();
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
  onAnimationFrame(msg) {
    return {
      event: "animationframe",
      msg: () => (timestamp) => msg(timestamp),
    };
  },
};
