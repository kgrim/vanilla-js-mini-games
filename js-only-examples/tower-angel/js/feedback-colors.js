export function addFeedbackColor(feedback) {
  const feedbackOverlay = document.querySelector(
    ".get-angle-game__feedback-overlay"
  );
  let rgbValues = "";
  if (feedback === "perfect") {
    rgbValues = "0, 101, 227";
  }
  if (feedback === "right") {
    rgbValues = "251, 243, 18";
  }
  if (feedback === "wrong") {
    rgbValues = "227, 0, 0";
  }
  feedbackOverlay.style.boxShadow = `inset 0 0 60px rgba(${rgbValues}, 0.4)`;
}

export function removeFeedbackColor() {
  const feedbackOverlay = document.querySelector(
    ".get-angle-game__feedback-overlay"
  );
  feedbackOverlay.style.boxShadow = `none`;
}
