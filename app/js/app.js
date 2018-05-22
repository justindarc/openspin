const WheelViewController = require('./controllers/wheel-view-controller.js');
const ModalMenuViewController = require('./controllers/modal-menu-view-controller.js');

const { getFrontendImagePath } = require('../components/common/theme-utils.js');

const wheelViewHtml = `
<us-theme-background></us-theme-background>
<us-wheel></us-wheel>
<us-theme-foreground></us-theme-foreground>
`;

const exitMenuViewHtml = `
  <img class="menu-background">
  <div class="menu-container">
    <img class="menu-text">
    <ul class="menu-items"></ul>
  </div>
`;

let viewStack = document.getElementById('view-stack');

let viewControllers = [];

function setupWheelViewController(view, system) {
  let wheelViewController = new WheelViewController(view, system);
  wheelViewController.onSystemSelect = (system) => {
    if (viewStack.modalView) {
      return;
    }

    let view = document.createElement('view-element');
    view.transition = 'fade-black';
    view.innerHTML = wheelViewHtml;

    setupWheelViewController(view, system);
    viewStack.push(view);
  };

  wheelViewController.onExit = () => {
    if (viewStack.modalView) {
      return;
    }

    if (viewStack.views.length > 1) {
      viewStack.pop();
      return;
    }

    let exitMenuView = document.createElement('view-element');
    exitMenuView.transitionDelay = 0;
    exitMenuView.innerHTML = exitMenuViewHtml;

    let exitMenuViewController = new ModalMenuViewController(exitMenuView);
    exitMenuViewController.background.src = getFrontendImagePath('Menu_Exit_Background');
    exitMenuViewController.text.src = getFrontendImagePath('Text_Exit_WouldYouLikeToExit');
    exitMenuViewController.menuArrow.src = getFrontendImagePath('Menu_Exit_Arrow');

    exitMenuViewController.addMenuItem('yes', getFrontendImagePath('Text_Exit_Yes'));
    exitMenuViewController.addMenuItem('no', getFrontendImagePath('Text_Exit_No'));

    exitMenuViewController.onExit = () => {
      viewStack.dismissModal();
    };

    exitMenuViewController.onMenuItemSelect = (menuItem) => {
      viewStack.dismissModal();
    };

    viewStack.presentModal(exitMenuView);
  };

  viewControllers.push(wheelViewController);
}

document.addEventListener('DOMContentLoaded', () => {
  let mainMenuView = document.getElementById('main-menu-view');
  setupWheelViewController(mainMenuView, 'Main Menu');
});
