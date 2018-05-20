const WheelViewController = require('./wheel-view-controller.js');

const newViewHtml = `
<us-theme-background></us-theme-background>
<us-wheel></us-wheel>
<us-theme-foreground></us-theme-foreground>
`;

let viewStack = document.getElementById('view-stack');

let viewControllers = [];

function setupWheelViewController(view, system) {
  let wheelViewController = new WheelViewController(view, system);
  wheelViewController.onSystemSelect = (system) => {
    let view = document.createElement('view-element');
    view.transition = 'fade-black';
    view.innerHTML = newViewHtml;

    setupWheelViewController(view, system);
    viewStack.push(view);
  };

  wheelViewController.onExit = () => {
    viewStack.pop();
  };

  viewControllers.push(wheelViewController);
}

document.addEventListener('DOMContentLoaded', () => {
  let mainMenuView = document.getElementById('main-menu-view');
  setupWheelViewController(mainMenuView, 'Main Menu');
});
