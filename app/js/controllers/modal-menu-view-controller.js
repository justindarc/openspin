const { ViewController } = require('../../components/view-element.js');

class ModalMenuViewController extends ViewController {
  constructor(view) {
    super(view);

    this.background = view.querySelector('.menu-background');

    let onKeyDown = (evt) => {
      // If we're not visible, ignore key events.
      if (!view.offsetParent) {
        return;
      }

      if (evt.key === 'ArrowUp') {
        // this.previous();
      } else if (evt.key === 'ArrowDown') {
        // this.next();
      } else if (evt.key === 'Enter') {
        // this.onMenuItemSelect();
      } else if (evt.key === 'Escape') {
        this.onExit();
      }
    };

    view.onconnected = () => {
      window.addEventListener('keydown', onKeyDown);
    };

    view.ondisconnected = () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }

  onWillHide() {}
  onDidHide() {}
  onWillShow() {}
  onDidShow() {}
  onBlur() {}
  onFocus() {}

  onExit() {}
  onMenuItemSelect(menuItem) {}
}

module.exports = ModalMenuViewController;
