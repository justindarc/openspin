const SWFReader = require('swf-reader');
const path = require('path');

let _containerEl = new WeakMap();
let _src = new WeakMap();
let _naturalWidth = new WeakMap();
let _naturalHeight = new WeakMap();

class SWFImage extends HTMLElement {
  constructor() {
    super();

    const html =
`
<style>
  :host {
    display: inline-block;
  }
  object {
    display: block;
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

    let containerEl = _containerEl.get(this);
    containerEl.innerHTML = '';

    if (value) {
      createSWFObject(value).then(([object, swf]) => {
        containerEl.appendChild(object);

        _naturalWidth.set(this, swf.frameSize.width);
        _naturalHeight.set(this, swf.frameSize.height);

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
}

function createSWFObject(src, callback) {
  let absolutePath = path.join(process.cwd(), src);
  return new Promise((resolve, reject) => {
    SWFReader.read(absolutePath, (error, swf) => {
      if (error) {
        reject(error);
        return;
      }

      let object = document.createElement('object');
      object.data = absolutePath;
      object.width  = swf.frameSize.width;
      object.height = swf.frameSize.height;

      let wmodeParam = document.createElement('param');
      wmodeParam.name = 'wmode';
      wmodeParam.value = 'transparent';

      object.appendChild(wmodeParam);

      resolve([object, swf]);
    });
  });
}

customElements.define('swf-image', SWFImage);
