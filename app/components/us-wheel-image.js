let _componentEls = new WeakMap();
let _alt = new WeakMap();
let _src = new WeakMap();

class USWheelImageElement extends HTMLElement {
  constructor() {
    super();

    const html =
`
<style>
  :host {
    display: inline-block;
  }
  .container {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  }
  .img {
    max-width: 100%;
    max-height: 100%;
  }
  .img.hidden,
  .alt {
    display: none;
  }
  .img.hidden + .alt {
    color: #fff;
    text-shadow:
      -1px -1px 0 #000,
       1px -1px 0 #000,
      -1px  1px 0 #000,
       1px  1px 0 #000;
    display: inline-block;
    margin: 0;
    width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
<div class="container">
  <img class="img">
  <p class="alt"></p>
</div>
`;

    let template = document.createElement('template');
    template.innerHTML = html;

    let shadowRoot = this.attachShadow({ mode: 'closed' });
    shadowRoot.appendChild(template.content.cloneNode(true));

    let img = shadowRoot.querySelector('.img');
    let alt = shadowRoot.querySelector('.alt');

    _componentEls.set(this, {
      img: img,
      alt: alt
    });

    this.alt = this.getAttribute('alt') || '';
    this.src = this.getAttribute('src') || '';

    img.onerror = () => {
      img.classList.add('hidden');
    };
  }

  get alt() {
    return _alt.get(this);
  }

  set alt(value) {
    if (_alt.get(this) !== undefined) {
      this.setAttribute('alt', value);
    }

    _alt.set(this, value);

    let alt = _componentEls.get(this).alt;
    alt.textContent = value;
  }

  get src() {
    return _src.get(this);
  }

  set src(value) {
    if (_src.get(this) !== undefined) {
      this.setAttribute('src', value);
    }

    _src.set(this, value);

    let img = _componentEls.get(this).img;
    img.src = value;
    img.classList.remove('hidden');
  }
}

exports.USWheelImageElement = USWheelImageElement;

customElements.define('us-wheel-image', USWheelImageElement);
