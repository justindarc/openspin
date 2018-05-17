const WheelViewController = require('./wheel-view-controller.js');

let viewStack = document.getElementById('view-stack');

let viewControllers = [];

function setupWheelViewController(view, system) {
  let wheelViewController = new WheelViewController(view, system);
  wheelViewController.onSystemSelect = (system) => {
    let view = document.createElement('view-element');
    view.transition = 'fade-black';

    let background = document.createElement('us-theme-background');
    view.appendChild(background);

    let wheel = document.createElement('us-wheel');
    view.appendChild(wheel);

    let foreground = document.createElement('us-theme-foreground');
    view.appendChild(foreground);

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
