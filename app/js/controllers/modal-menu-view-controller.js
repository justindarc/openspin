const ViewController = require('../../components/view-controller.js');

let _menuItems = new WeakMap();

class ModalMenuViewController extends ViewController {
  constructor(view) {
    super(view);

    this.background = view.querySelector('.menu-background');
    this.text = view.querySelector('.menu-text');
    this.menu = view.querySelector('modal-menu');

    let onKeyDown = (evt) => {
      // If we're not visible, ignore key events.
      if (!view.offsetParent) {
        return;
      }

      if (evt.key === 'ArrowLeft') {
        this.menu.previous();
      } else if (evt.key === 'ArrowRight') {
        this.menu.next();
      } else if (evt.key === 'Enter') {
        let selectedItem = this.menu.selectedItem;
        let selectedIndex = this.menu.selectedIndex;
        if (selectedItem && selectedIndex !== -1) {
          this.onMenuItemSelected(selectedItem, selectedIndex);
        }
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
  onMenuItemSelected(item, index) {}
}

module.exports = ModalMenuViewController;
