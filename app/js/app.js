const IntroViewController = require('./controllers/intro-view-controller.js');
const ModalMenuViewController = require('./controllers/modal-menu-view-controller.js');
const WheelMenuViewController = require('./controllers/wheel-menu-view-controller.js');

const { getFrontendImagePath } = require('../components/common/theme-utils.js');

const electron = require('electron');

const exitMenuViewHtml = `
<transparent-image class="menu-background"></transparent-image>
<div class="menu-container">
  <img class="menu-text">
  <modal-menu arrow-src="Menu_Exit_Arrow">
    <modal-menu-item value="yes" src="Text_Exit_Yes" selected></modal-menu-item>
    <modal-menu-item value="no" src="Text_Exit_No"></modal-menu-item>
  </modal-menu>
</div>
`;

const wheelViewHtml = `
<theme-background></theme-background>
<wheel-menu></wheel-menu>
<theme-foreground></theme-foreground>
<theme-special></theme-special>
`;

const viewStack = document.getElementById('view-stack');

function setupWheelMenuViewController(view, system) {
  let wheelMenuViewController = new WheelMenuViewController(view, system);
  wheelMenuViewController.onSystemSelect = (system) => {
    if (viewStack.modalView) {
      return;
    }

    let view = document.createElement('view-container');
    view.transition = 'fade-black';
    view.innerHTML = wheelViewHtml;

    setupWheelMenuViewController(view, system);
    viewStack.push(view);
  };

  wheelMenuViewController.onExit = () => {
    if (viewStack.modalView) {
      return;
    }

    if (viewStack.views.length > 1) {
      viewStack.pop();
      return;
    }

    let exitMenuView = document.createElement('view-container');
    exitMenuView.transitionDelay = 0;
    exitMenuView.innerHTML = exitMenuViewHtml;

    let exitMenuViewController = new ModalMenuViewController(exitMenuView);
    exitMenuViewController.background.src = getFrontendImagePath('Menu_Exit_Background');
    exitMenuViewController.text.src = getFrontendImagePath('Text_Exit_WouldYouLikeToExit');

    exitMenuViewController.onExit = () => {
      viewStack.dismissModal();
    };

    exitMenuViewController.onMenuItemSelected = (item, index) => {
      if (item.value === 'yes') {
        window.close();
      } else {
        viewStack.dismissModal();
      }
    };

    viewStack.presentModal(exitMenuView);
  };
}

document.addEventListener('DOMContentLoaded', () => {
  let introView = document.getElementById('intro-view');
  let introViewController = new IntroViewController(introView);
  introViewController.onDismiss = () => {
    let mainMenuView = document.createElement('view-container');
    mainMenuView.id = 'main-menu-view';
    mainMenuView.transition = 'fade-black';
    mainMenuView.innerHTML = wheelViewHtml;

    setupWheelMenuViewController(mainMenuView, 'Main Menu');
    viewStack.replace(mainMenuView);
  };
});

electron.webFrame.registerURLSchemeAsPrivileged('file');
