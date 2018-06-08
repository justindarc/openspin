let _wheelEl = new WeakMap();
let _itemCount = new WeakMap();
let _selectedIndex = new WeakMap();
let _isTransitioning = new WeakMap();
let _onKeyDown = new WeakMap();

function normalizeIndex(index, itemCount) {
  if (itemCount === 0) {
    return -1;
  }

  if (index < 0) {
    return ((index % itemCount) + itemCount) % itemCount;
  }

  return index % itemCount;
}

class WheelMenuElement extends HTMLElement {
  constructor() {
    super();

    const html =
`
<style>
  :host {
    display: block;
  }
  * {
    -webkit-user-drag: none;
    user-select: none;
  }
  .wheel {
    position: relative;
    width: 50vw;
    height: 100vh;
  }
  .wheel > .item {
    box-sizing: border-box;
    text-align: center;
    position: absolute;
    top: calc(50vh - 10% / 2);
    left: 25%;
    width: 50%;
    height: 10%;
    transform-origin: 100vw 50%;
  }
  .wheel > .item > wheel-image {
    width: 100%;
    height: 100%;
  }
  .wheel.previous > .item,
  .wheel.next > .item {
    transition: all 100ms;
  }
  .wheel > .item:nth-child(1)  { transform: rotate( 35deg); }
  .wheel > .item:nth-child(2)  { transform: rotate( 30deg); }
  .wheel > .item:nth-child(3)  { transform: rotate( 25deg); }
  .wheel > .item:nth-child(4)  { transform: rotate( 20deg); }
  .wheel > .item:nth-child(5)  { transform: rotate( 15deg); }
  .wheel > .item:nth-child(6)  { transform: rotate( 10deg); }
  .wheel > .item:nth-child(7)  { transform: rotate(  5deg); }
  .wheel > .item:nth-child(8)  { transform: translateX(87.5vw) scale(2); z-index: 1; }
  .wheel > .item:nth-child(9)  { transform: rotate( -5deg); }
  .wheel > .item:nth-child(10) { transform: rotate(-10deg); }
  .wheel > .item:nth-child(11) { transform: rotate(-15deg); }
  .wheel > .item:nth-child(12) { transform: rotate(-20deg); }
  .wheel > .item:nth-child(13) { transform: rotate(-25deg); }
  .wheel > .item:nth-child(14) { transform: rotate(-30deg); }
  .wheel > .item:nth-child(15) { transform: rotate(-35deg); }
  .wheel.previous > .item:nth-child(1)  { transform: rotate( 30deg); }
  .wheel.previous > .item:nth-child(2)  { transform: rotate( 25deg); }
  .wheel.previous > .item:nth-child(3)  { transform: rotate( 20deg); }
  .wheel.previous > .item:nth-child(4)  { transform: rotate( 15deg); }
  .wheel.previous > .item:nth-child(5)  { transform: rotate( 10deg); }
  .wheel.previous > .item:nth-child(6)  { transform: rotate(  5deg); }
  .wheel.previous > .item:nth-child(7)  { transform: translateX(87.5vw) scale(2); z-index: 1; }
  .wheel.previous > .item:nth-child(8)  { transform: rotate( -5deg); }
  .wheel.previous > .item:nth-child(9)  { transform: rotate(-10deg); }
  .wheel.previous > .item:nth-child(10) { transform: rotate(-15deg); }
  .wheel.previous > .item:nth-child(11) { transform: rotate(-20deg); }
  .wheel.previous > .item:nth-child(12) { transform: rotate(-25deg); }
  .wheel.previous > .item:nth-child(13) { transform: rotate(-30deg); }
  .wheel.previous > .item:nth-child(14) { transform: rotate(-35deg); }
  .wheel.previous > .item:nth-child(15) { transform: rotate(-40deg); }
  .wheel.next > .item:nth-child(1)  { transform: rotate( 40deg); }
  .wheel.next > .item:nth-child(2)  { transform: rotate( 35deg); }
  .wheel.next > .item:nth-child(3)  { transform: rotate( 30deg); }
  .wheel.next > .item:nth-child(4)  { transform: rotate( 25deg); }
  .wheel.next > .item:nth-child(5)  { transform: rotate( 20deg); }
  .wheel.next > .item:nth-child(6)  { transform: rotate( 15deg); }
  .wheel.next > .item:nth-child(7)  { transform: rotate( 10deg); }
  .wheel.next > .item:nth-child(8)  { transform: rotate(  5deg); }
  .wheel.next > .item:nth-child(9)  { transform: translateX(87.5vw) scale(2); z-index: 1; }
  .wheel.next > .item:nth-child(10) { transform: rotate( -5deg); }
  .wheel.next > .item:nth-child(11) { transform: rotate(-10deg); }
  .wheel.next > .item:nth-child(12) { transform: rotate(-15deg); }
  .wheel.next > .item:nth-child(13) { transform: rotate(-20deg); }
  .wheel.next > .item:nth-child(14) { transform: rotate(-25deg); }
  .wheel.next > .item:nth-child(15) { transform: rotate(-30deg); }
</style>
<div class="wheel">
  <div class="item"></div>
  <div class="item"></div>
  <div class="item"></div>
  <div class="item"></div>
  <div class="item"></div>
  <div class="item"></div>
  <div class="item"></div>
  <div class="item"></div>
  <div class="item"></div>
  <div class="item"></div>
  <div class="item"></div>
  <div class="item"></div>
  <div class="item"></div>
  <div class="item"></div>
  <div class="item"></div>
</div>
`;

    let template = document.createElement('template');
    template.innerHTML = html;

    const shadowRoot = this.attachShadow({ mode: 'closed' });
    shadowRoot.appendChild(template.content.cloneNode(true));

    let wheelEl = shadowRoot.querySelector('.wheel');
    _wheelEl.set(this, wheelEl);
    _itemCount.set(this, 0);
    _selectedIndex.set(this, -1);
    _isTransitioning.set(this, false);
    _onKeyDown.set(this, (evt) => {
      // If we're disabled, ignore key events.
      if (this.disabled) {
        return;
      }

      if (evt.key === 'ArrowUp') {
        this.previous();
      } else if (evt.key === 'ArrowDown') {
        this.next();
      } else if (evt.key === 'Enter') {
        this.select();
      } else if (evt.key === 'Escape') {
        this.exit();
      }
    });
  }

  connectedCallback() {
    window.addEventListener('keydown', _onKeyDown.get(this));
  }

  disconnectedCallback() {
    window.removeEventListener('keydown', _onKeyDown.get(this));
  }

  get disabled() {
    return this.hasAttribute('disabled');
  }

  set disabled(value) {
    if (!value) {
      this.removeAttribute('disabled');
    } else {
      this.setAttribute('disabled', true);
    }
  }

  get itemCount() {
    return _itemCount.get(this);
  }

  set itemCount(value) {
    _itemCount.set(this, value);

    this.selectedIndex = 0;
    this.reloadData();
  }

  get selectedIndex() {
    return _selectedIndex.get(this);
  }

  set selectedIndex(value) {
    let normalizedValue = normalizeIndex(value, this.itemCount);
    if (this.selectedIndex !== normalizedValue) {
      _selectedIndex.set(this, normalizedValue);

      this.dispatchEvent(new CustomEvent('change', {
        detail: {
          selectedIndex: normalizedValue
        }
      }));
    }
  }

  reloadData() {
    for (let i = 0; i < 15; i++) {
      let index = normalizeIndex(this.selectedIndex + i - 7, this.itemCount);
      let element = _wheelEl.get(this).children[i];

      if (parseInt(element.dataset.index, 10) !== index) {
        element.dataset.index = index;

        this.dispatchEvent(new CustomEvent('render', {
          detail: {
            index: index,
            element: element
          }
        }));
      }
    }
  }

  previous() {
    let wheelEl = _wheelEl.get(this);
    let transitions = 0;

    let onTransitionEnd = () => {
      if (++transitions < 15) {
        return;
      }

      wheelEl.removeEventListener('transitionend', onTransitionEnd);
      _isTransitioning.set(this, false);

      requestAnimationFrame(() => {
        wheelEl.prepend(wheelEl.lastElementChild);
        wheelEl.classList.remove('previous', 'next');
        this.reloadData();
      });
    };

    if (_isTransitioning.get(this)) {
      transitions = 15;
      onTransitionEnd();

      requestAnimationFrame(() => this.previous());
      return;
    }

    requestAnimationFrame(() => {
      wheelEl.addEventListener('transitionend', onTransitionEnd);
      wheelEl.classList.add('previous');
      this.selectedIndex--;
    });

    _isTransitioning.set(this, true);
  }

  next() {
    let wheelEl = _wheelEl.get(this);
    let transitions = 0;

    let onTransitionEnd = () => {
      if (++transitions < 15) {
        return;
      }

      wheelEl.removeEventListener('transitionend', onTransitionEnd);
      _isTransitioning.set(this, false);

      requestAnimationFrame(() => {
        wheelEl.append(wheelEl.firstElementChild);
        wheelEl.classList.remove('previous', 'next');
        this.reloadData();
      });
    };

    if (_isTransitioning.get(this)) {
      transitions = 15;
      onTransitionEnd();

      requestAnimationFrame(() => this.next());
      return;
    }

    requestAnimationFrame(() => {
      wheelEl.addEventListener('transitionend', onTransitionEnd);
      wheelEl.classList.add('next');
      this.selectedIndex++;
    });

    _isTransitioning.set(this, true);
  }

  select() {
    this.dispatchEvent(new CustomEvent('select', {
      detail: {
        selectedIndex: this.selectedIndex
      }
    }));
  }

  exit() {
    this.dispatchEvent(new CustomEvent('exit'));
  }
}

exports.WheelMenuElement = WheelMenuElement;

customElements.define('wheel-menu', WheelMenuElement);
