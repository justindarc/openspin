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
    return (index % itemCount) + itemCount;
  }

  return index % itemCount;
}

class USWheelElement extends HTMLElement {
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
    transform-style: preserve-3d;
    perspective: 1000px;
  }
  .wheel > .item {
    box-sizing: border-box;
    text-align: center;
    position: absolute;
    top: calc(50vh - 7.5% / 2);
    left: 25%;
    width: 50%;
    height: 7.5%;
    transform-origin: 100vw 50%;
  }
  .wheel > .item > img {
    max-width: 100%;
    max-height: 100%;
  }
  .wheel.previous > .item,
  .wheel.next > .item {
    transition: all 200ms;
  }
  .wheel > .item:nth-child(1)  { transform: translate3d(0, 0, 0) rotate( 35deg); }
  .wheel > .item:nth-child(2)  { transform: translate3d(0, 0, 0) rotate( 30deg); }
  .wheel > .item:nth-child(3)  { transform: translate3d(0, 0, 0) rotate( 25deg); }
  .wheel > .item:nth-child(4)  { transform: translate3d(0, 0, 0) rotate( 20deg); }
  .wheel > .item:nth-child(5)  { transform: translate3d(0, 0, 0) rotate( 15deg); }
  .wheel > .item:nth-child(6)  { transform: translate3d(0, 0, 0) rotate( 10deg); }
  .wheel > .item:nth-child(7)  { transform: translate3d(0, 0, 0) rotate(  5deg); }
  .wheel > .item:nth-child(8)  { transform: translate3d(0, 0, 0) translateX(87.5vw) scale(2); z-index: 1; }
  .wheel > .item:nth-child(9)  { transform: translate3d(0, 0, 0) rotate( -5deg); }
  .wheel > .item:nth-child(10) { transform: translate3d(0, 0, 0) rotate(-10deg); }
  .wheel > .item:nth-child(11) { transform: translate3d(0, 0, 0) rotate(-15deg); }
  .wheel > .item:nth-child(12) { transform: translate3d(0, 0, 0) rotate(-20deg); }
  .wheel > .item:nth-child(13) { transform: translate3d(0, 0, 0) rotate(-25deg); }
  .wheel > .item:nth-child(14) { transform: translate3d(0, 0, 0) rotate(-30deg); }
  .wheel > .item:nth-child(15) { transform: translate3d(0, 0, 0) rotate(-35deg); }
  .wheel.previous > .item:nth-child(1)  { transform: translate3d(0, 0, 0) rotate( 30deg); }
  .wheel.previous > .item:nth-child(2)  { transform: translate3d(0, 0, 0) rotate( 25deg); }
  .wheel.previous > .item:nth-child(3)  { transform: translate3d(0, 0, 0) rotate( 20deg); }
  .wheel.previous > .item:nth-child(4)  { transform: translate3d(0, 0, 0) rotate( 15deg); }
  .wheel.previous > .item:nth-child(5)  { transform: translate3d(0, 0, 0) rotate( 10deg); }
  .wheel.previous > .item:nth-child(6)  { transform: translate3d(0, 0, 0) rotate(  5deg); }
  .wheel.previous > .item:nth-child(7)  { transform: translate3d(0, 0, 0) translateX(87.5vw) scale(2); z-index: 1; }
  .wheel.previous > .item:nth-child(8)  { transform: translate3d(0, 0, 0) rotate( -5deg); }
  .wheel.previous > .item:nth-child(9)  { transform: translate3d(0, 0, 0) rotate(-10deg); }
  .wheel.previous > .item:nth-child(10) { transform: translate3d(0, 0, 0) rotate(-15deg); }
  .wheel.previous > .item:nth-child(11) { transform: translate3d(0, 0, 0) rotate(-20deg); }
  .wheel.previous > .item:nth-child(12) { transform: translate3d(0, 0, 0) rotate(-25deg); }
  .wheel.previous > .item:nth-child(13) { transform: translate3d(0, 0, 0) rotate(-30deg); }
  .wheel.previous > .item:nth-child(14) { transform: translate3d(0, 0, 0) rotate(-35deg); }
  .wheel.previous > .item:nth-child(15) { transform: translate3d(0, 0, 0) rotate(-40deg); }
  .wheel.next > .item:nth-child(1)  { transform: translate3d(0, 0, 0) rotate( 40deg); }
  .wheel.next > .item:nth-child(2)  { transform: translate3d(0, 0, 0) rotate( 35deg); }
  .wheel.next > .item:nth-child(3)  { transform: translate3d(0, 0, 0) rotate( 30deg); }
  .wheel.next > .item:nth-child(4)  { transform: translate3d(0, 0, 0) rotate( 25deg); }
  .wheel.next > .item:nth-child(5)  { transform: translate3d(0, 0, 0) rotate( 20deg); }
  .wheel.next > .item:nth-child(6)  { transform: translate3d(0, 0, 0) rotate( 15deg); }
  .wheel.next > .item:nth-child(7)  { transform: translate3d(0, 0, 0) rotate( 10deg); }
  .wheel.next > .item:nth-child(8)  { transform: translate3d(0, 0, 0) rotate(  5deg); }
  .wheel.next > .item:nth-child(9)  { transform: translate3d(0, 0, 0) translateX(87.5vw) scale(2); z-index: 1; }
  .wheel.next > .item:nth-child(10) { transform: translate3d(0, 0, 0) rotate( -5deg); }
  .wheel.next > .item:nth-child(11) { transform: translate3d(0, 0, 0) rotate(-10deg); }
  .wheel.next > .item:nth-child(12) { transform: translate3d(0, 0, 0) rotate(-15deg); }
  .wheel.next > .item:nth-child(13) { transform: translate3d(0, 0, 0) rotate(-20deg); }
  .wheel.next > .item:nth-child(14) { transform: translate3d(0, 0, 0) rotate(-25deg); }
  .wheel.next > .item:nth-child(15) { transform: translate3d(0, 0, 0) rotate(-30deg); }
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

    _wheelEl.set(this, shadowRoot.querySelector('.wheel'));
    _itemCount.set(this, 0);
    _selectedIndex.set(this, -1);
    _isTransitioning.set(this, false);
    _onKeyDown.set(this, (evt) => {
      // If we're not visible, ignore key events.
      if (!this.offsetParent) {
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

exports.USWheelElement = USWheelElement;

customElements.define('us-wheel', USWheelElement);
