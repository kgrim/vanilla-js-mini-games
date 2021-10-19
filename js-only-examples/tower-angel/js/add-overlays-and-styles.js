export function addOverlaysAndStyles(domElement, imageUrlByName) {
  if (document.querySelector(".get-angle-game__button--deactivated")) {
    return;
  }
  domElement.setAttribute(
    "style",
    `background-image: url(${imageUrlByName.game_background.src}); background-size: 100%;`
  );
  const towerOverlayDiv = document.createElement("div");
  towerOverlayDiv.classList.add("get-angle-game__tower-overlay");
  towerOverlayDiv.setAttribute(
    "style",
    `position: absolute; top:9px; bottom:0; left:0; right:0; background-image: url(${imageUrlByName.game_background_overlay.src}); background-size: 100%;`
  );

  const feedbackOverlayDiv = document.createElement("div");
  feedbackOverlayDiv.classList.add("get-angle-game__feedback-overlay");
  feedbackOverlayDiv.setAttribute(
    "style",
    "position: absolute; top:0; bottom:0; left:0; right:0;"
  );

  const buttonBottomSize = () => {
    if (window.matchMedia("(min-width: 480px)").matches) {
      return "48px";
    }
    if (window.matchMedia("(min-width: 375px)").matches) {
      return "24px";
    }
    return "14px";
  };

  const deactivatedButtonControls = document.createElement("div");
  deactivatedButtonControls.classList.add(
    "get-angle-game__button-play-controls--deactivated"
  );

  deactivatedButtonControls.setAttribute(
    "style",
    `
  transform: translate3d(0, 0, 0) scale(1);
  transition: opacity 0.25s, transform 0.25s;
  position: absolute;
  width: 100%;
  bottom: ${buttonBottomSize()};
  z-index: 2;`
  );

  const deactivatedButton = document.createElement("button");
  deactivatedButton.classList.add("get-angle-game__button--deactivated");
  deactivatedButton.setAttribute(
    "style",
    ` background: center / 80% no-repeat url("${imageUrlByName.deactivated_button.src}");
    border-radius: 50%;
    height: 67px;
    width: 67px;
    border: 8px solid #ffed00;
    transform: translate3d(0, 0, 0) scale(1);
    display: none;
   `
  );

  deactivatedButtonControls.appendChild(deactivatedButton);
  domElement.appendChild(towerOverlayDiv);
  domElement.appendChild(feedbackOverlayDiv);
  domElement.appendChild(deactivatedButtonControls);
}
