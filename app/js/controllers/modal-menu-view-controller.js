const { ViewController } = require('../../components/view-element.js');

let _menuItems = new WeakMap();
let _menuItemsEl = new WeakMap();

class ModalMenuViewController extends ViewController {
  constructor(view) {
    super(view);

    this.background = view.querySelector('.menu-background');
    this.text = view.querySelector('.menu-text');
    this.menuArrow = document.createElement('img');

    this.menuArrow.classList.add('menu-arrow');

    _menuItemsEl.set(this, view.querySelector('.menu-items'));

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

  get menuItems() {
    return _menuItems.get(this) || [];
  }

  addMenuItem(value, src) {
    let menuItems = this.menuItems;
    menuItems.push(value);
    _menuItems.set(this, menuItems);

    let img = document.createElement('img');
    img.src = src;

    let li = document.createElement('li');
    li.dataset.value = value;
    li.appendChild(img);

    if (menuItems.length === 1) {
      // li.appendChild(this.menuArrow);
    }

    _menuItemsEl.get(this).appendChild(li);
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
