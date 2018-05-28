const { getFrontendImagePath } = require('./common/theme-utils.js');

let _slotEl = new WeakMap();

class USMenuElement extends HTMLElement {
  constructor() {
    super();

    const html =
`
<style>
  :host {
    display: block;
  }
  .list {
    display: flex;
    align-items: center;
    justify-content: space-around;
    width: 100%;
    height: 100%;
  }
</style>
<div class="list">
  <slot></slot>
</div>
`;

    let template = document.createElement('template');
    template.innerHTML = html;

    let shadowRoot = this.attachShadow({ mode: 'closed' });
    shadowRoot.appendChild(template.content.cloneNode(true));

    let slotEl = shadowRoot.querySelector('slot');
    _slotEl.set(this, slotEl);

    setTimeout(() => {
      this.arrowSrc = this.getAttribute('arrow-src');

      if (this.items.length > 0 && this.selectedIndex === -1) {
        this.selectedIndex = 0;
      }
    });
  }

  get items() {
    return _slotEl.get(this).assignedNodes().filter((node) => {
      return node.nodeType === Node.ELEMENT_NODE && node.matches('us-menu-item');
    });
  }

  get selectedItem() {
    return this.items.find(item => item.hasAttribute('selected')) || null;
  }

  get selectedIndex() {
    let items = this.items;
    return items.indexOf(this.selectedItem);
  }

  set selectedIndex(value) {
    let items = this.items;
    let count = items.length;
    if (count === 0 || value < 0 || value >= count) {
      return;
    }

    let oldSelectedItem = this.selectedItem;
    if (oldSelectedItem) {
      oldSelectedItem.removeAttribute('selected');
    }

    let newSelectedItem = items[value];
    newSelectedItem.setAttribute('selected', true);
  }

  get arrowSrc() {
    return this.getAttribute('arrow-src') || null;
  }

  set arrowSrc(value) {
    this.setAttribute('arrow-src', value);

    let path = getFrontendImagePath(value);
    this.items.forEach(item => _arrowEl.get(item).src = path);
  }

  previous() {
    let selectedIndex = this.selectedIndex;
    if (selectedIndex === -1) {
      return;
    }

    this.selectedIndex = selectedIndex - 1;
  }

  next() {
    let selectedIndex = this.selectedIndex;
    if (selectedIndex === -1) {
      return;
    }

    this.selectedIndex = selectedIndex + 1;
  }
}

exports.USMenuElement = USMenuElement;

customElements.define('us-menu', USMenuElement);

let _arrowEl = new WeakMap();
let _itemEl = new WeakMap();

class USMenuItemElement extends HTMLElement {
  constructor() {
    super();

    const html =
`
<style>
  :host {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  :host([selected]) .arrow {
    visibility: visible;
  }
  :host(:not([selected])) .arrow {
    visibility: hidden;
  }
  img {
    margin: 0 .5em;
  }
</style>
<img class="arrow">
<img class="item">
`;

    let template = document.createElement('template');
    template.innerHTML = html;

    let shadowRoot = this.attachShadow({ mode: 'closed' });
    shadowRoot.appendChild(template.content.cloneNode(true));

    let arrowEl = shadowRoot.querySelector('.arrow');
    _arrowEl.set(this, arrowEl);

    let itemEl = shadowRoot.querySelector('.item');
    _itemEl.set(this, itemEl);

    setTimeout(() => {
      this.src = this.getAttribute('src');
    });
  }

  get src() {
    return this.getAttribute('src') || null;
  }

  set src(value) {
    this.setAttribute('src', value);

    let path = getFrontendImagePath(value);
    _itemEl.get(this).src = path;
  }

  get value() {
    return this.getAttribute('value') || null;
  }

  set value(value) {
    this.setAttribute('value', value);
  }
}

exports.USMenuItemElement = USMenuItemElement;

customElements.define('us-menu-item', USMenuItemElement);
