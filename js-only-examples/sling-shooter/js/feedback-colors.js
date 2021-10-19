export function addFeedbackOverlay() {
  const controls =
    document.querySelector(".mini-games__minigame-play-controls") ||
    document.querySelector(".mini-game__button");

  controls.style.zIndex = 5;

  const feedbackOverlayDiv = document.createElement("div");
  feedbackOverlayDiv.classList.add("mini-game__feedback-overlay");
  feedbackOverlayDiv.setAttribute(
    "style",
    "position: absolute; top:0; bottom:0; left:0; right:0;"
  );

  return feedbackOverlayDiv;
}

export function addFeedbackColor() {
  if (!document.querySelector(".mini-game__feedback-overlay")) {
    return;
  }
  const feedbackOverlay = document.querySelector(
    ".mini-game__feedback-overlay"
  );
  const boxShadow = "inset 0 0 60px rgba(251, 243, 18, 0.8)";

  feedbackOverlay.style.boxShadow = boxShadow;
}

export function removeFeedbackColor() {
  if (!document.querySelector(".mini-game__feedback-overlay")) {
    return;
  }
  const feedbackOverlay = document.querySelector(
    ".mini-game__feedback-overlay"
  );
  feedbackOverlay.style.boxShadow = `none`;
}
