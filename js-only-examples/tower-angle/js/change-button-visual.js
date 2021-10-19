export function addButtonTargetTowerState() {
  const deactivatedButton = document.querySelector(
    ".get-angle-game__button--deactivated"
  );
  deactivatedButton.style.display = "inline";
}

export function removeButtonTargetTowerState() {
  const deactivatedButton = document.querySelector(
    ".get-angle-game__button--deactivated"
  );
  deactivatedButton.style.display = "none";
}
