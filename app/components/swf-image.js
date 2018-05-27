const { getSwfInfo } = require('./common/theme-utils.js');

const path = require('path');

let _containerEl = new WeakMap();
let _src = new WeakMap();
let _naturalWidth = new WeakMap();
let _naturalHeight = new WeakMap();
let _worldWidth = new WeakMap();
let _worldHeight = new WeakMap();

function createSWFObject(src) {
  return getSwfInfo(src).then((swfInfo) => {
    let object = document.createElement('object');
    object.data = src;
    object.width  = swfInfo.naturalWidth;
    object.height = swfInfo.naturalHeight;

    let scaleParam = document.createElement('param');
    scaleParam.name = 'scale';
    scaleParam.value = 'exactfit';
    object.appendChild(scaleParam);

    let wmodeParam = document.createElement('param');
    wmodeParam.name = 'wmode';
    wmodeParam.value = 'transparent';
    object.appendChild(wmodeParam);

    return [object, swfInfo];
  }).catch(() => console.error('Unable to get SWF info', src));
}

class SWFImage extends HTMLElement {
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
      createSWFObject(value).then(([object, swfInfo]) => {
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

exports.SWFImage = SWFImage;

customElements.define('swf-image', SWFImage);
