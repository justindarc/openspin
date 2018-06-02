const { createSwfObject } = require('../common/swf-utils.js');

let _containerEl = new WeakMap();
let _src = new WeakMap();
let _naturalWidth = new WeakMap();
let _naturalHeight = new WeakMap();
let _worldWidth = new WeakMap();
let _worldHeight = new WeakMap();

class SWFImageElement extends HTMLElement {
  constructor() {
    super();

    const html =
`
<style>
  :host {
    display: inline-block;
  }
  .container {
    width: 100%;
    height: 100%;
  }
  object {
    display: block;
    width: 100%;
    height: 100%;
  }
</style>
<div class="container"></div>
`;

    let template = document.createElement('template');
    template.innerHTML = html;

    let shadowRoot = this.attachShadow({ mode: 'closed' });
    shadowRoot.appendChild(template.content.cloneNode(true));

    _containerEl.set(this, shadowRoot.querySelector('.container'));

    this.src = this.getAttribute('src') || '';
  }

  get src() {
    return _src.get(this);
  }

  set src(value) {
    if (_src.get(this) !== undefined) {
      this.setAttribute('src', value);
    }

    _src.set(this, value);

    _naturalWidth.set(this, 0);
    _naturalHeight.set(this, 0);
    _worldWidth.set(this, 0);
    _worldHeight.set(this, 0);

    let containerEl = _containerEl.get(this);
    containerEl.innerHTML = '';

    if (value) {
      createSwfObject(value).then(([object, swfInfo]) => {
        containerEl.appendChild(object);

        _naturalWidth.set(this, swfInfo.naturalWidth);
        _naturalHeight.set(this, swfInfo.naturalHeight);
        _worldWidth.set(this, swfInfo.worldWidth);
        _worldHeight.set(this, swfInfo.worldHeight);

        if (typeof this.onload === 'function') {
          this.onload(this);
        }

        this.dispatchEvent(new CustomEvent('load'));
      }).catch((error) => {
        console.error('Unable to read SWF: ' + value, error);

        if (typeof this.onerror === 'function') {
          this.onerror(error, this);
        }

        this.dispatchEvent(new CustomEvent('error', { detail: error }));
      });
    }
  }

  get naturalWidth() {
    return _naturalWidth.get(this);
  }

  get naturalHeight() {
    return _naturalHeight.get(this);
  }

  get worldWidth() {
    return _worldWidth.get(this);
  }

  get worldHeight() {
    return _worldHeight.get(this);
  }
}

exports.SWFImageElement = SWFImageElement;

customElements.define('swf-image', SWFImageElement);
