const WheelViewController = require('./wheel-view-controller.js');

document.addEventListener('DOMContentLoaded', () => {
  let mainMenuView = document.getElementById('main-menu-view');
  let mainMenuViewController = new WheelViewController(mainMenuView, 'Main Menu');
});
