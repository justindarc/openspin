class USWheelElement extends HTMLElement {
  constructor() {
    super();

    let html =
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

    this._wheelEl = shadowRoot.querySelector('.wheel');
    this._itemCount = 0;
    this._selectedIndex = -1;
    this._isTransitioning = false;

    window.addEventListener('keydown', (evt) => {
      if (evt.key === 'ArrowUp') {
        this.previous();
      } else if (evt.key === 'ArrowDown') {
        this.next();
      }
    });
  }

  get itemCount() {
    return this._itemCount;
  }

  set itemCount(value) {
    this._itemCount = value;

    this.selectedIndex = 0;
    this.reloadData();
  }

  get selectedIndex() {
    return this._selectedIndex;
  }

  set selectedIndex(value) {
    let normalizedValue = this._normalizeIndex(value);
    if (this._selectedIndex !== normalizedValue) {
      this._selectedIndex = normalizedValue;

      this.dispatchEvent(new CustomEvent('change', {
        detail: {
          selectedIndex: this._selectedIndex
        }
      }));
    }
  }

  _normalizeIndex(index) {
    if (this._itemCount === 0) {
      return -1;
    }

    if (index < 0) {
      return (index % this._itemCount) + this._itemCount;
    }

    return index % this._itemCount;
  }

  reloadData() {
    for (let i = 0; i < 15; i++) {
      let index = this._normalizeIndex(this._selectedIndex + i - 7);
      let element = this._wheelEl.children[i];

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
    let transitions = 0;

    let onTransitionEnd = () => {
      if (++transitions < 15) {
        return;
      }

      this._wheelEl.removeEventListener('transitionend', onTransitionEnd);
      this._isTransitioning = false;

      requestAnimationFrame(() => {
        this._wheelEl.prepend(this._wheelEl.lastElementChild);
        this._wheelEl.classList.remove('previous', 'next');
        this.reloadData();
      });
    };

    if (this._isTransitioning) {
      transitions = 15;
      onTransitionEnd();

      requestAnimationFrame(() => this.previous());
      return;
    }

    requestAnimationFrame(() => {
      this._wheelEl.addEventListener('transitionend', onTransitionEnd);
      this._wheelEl.classList.add('previous');
      this.selectedIndex--;
    });

    this._isTransitioning = true;
  }

  next() {
    let transitions = 0;

    let onTransitionEnd = () => {
      if (++transitions < 15) {
        return;
      }

      this._wheelEl.removeEventListener('transitionend', onTransitionEnd);
      this._isTransitioning = false;

      requestAnimationFrame(() => {
        this._wheelEl.append(this._wheelEl.firstElementChild);
        this._wheelEl.classList.remove('previous', 'next');
        this.reloadData();
      });
    };

    if (this._isTransitioning) {
      transitions = 15;
      onTransitionEnd();

      requestAnimationFrame(() => this.next());
      return;
    }

    requestAnimationFrame(() => {
      this._wheelEl.addEventListener('transitionend', onTransitionEnd);
      this._wheelEl.classList.add('next');
      this.selectedIndex++;
    });

    this._isTransitioning = true;
  }
}

customElements.define('us-wheel', USWheelElement);
