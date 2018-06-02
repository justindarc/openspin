let _canvasEl = new WeakMap();

let _naturalWidth = new WeakMap();
let _naturalHeight = new WeakMap();

function clearCanvas(canvas) {
  let ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function drawImageToCanvasWithoutBackground(img, canvas, width, height) {
  canvas.width = width;
  canvas.height = height;

  let ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  let imageData = ctx.getImageData(0, 0, width, height);
  let bytes = imageData.data;

  for (let i = 0, length = bytes.length; i < length; i += 4) {
    let r = bytes[i], g = bytes[i + 1], b = bytes[i + 2];
    if (!r && !g && !b) {
      bytes[i + 3] = 0;
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

class TransparentImageElement extends HTMLElement {
  constructor() {
    super();

    const html =
`
<style>
  :host {
    display: inline-block;
  }
</style>
<canvas></canvas>
`;

    let template = document.createElement('template');
    template.innerHTML = html;

    let shadowRoot = this.attachShadow({ mode: 'closed' });
    shadowRoot.appendChild(template.content.cloneNode(true));

    _canvasEl.set(this, shadowRoot.querySelector('canvas'));

    _naturalWidth.set(this, 0);
    _naturalHeight.set(this, 0);

    setTimeout(() => {
      this.src = this.getAttribute('src');
    });
  }

  get src() {
    return this.getAttribute('src') || null;
  }

  set src(value) {
    if (value === this.src) {
      return;
    }

    this.setAttribute('src', value);

    let canvas = _canvasEl.get(this);
    clearCanvas(canvas);

    let img = new Image();
    img.onload = () => {
      let naturalWidth = img.naturalWidth;
      _naturalWidth.set(this, naturalWidth);

      let naturalHeight = img.naturalHeight;
      _naturalHeight.set(this, naturalHeight);

      drawImageToCanvasWithoutBackground(img, canvas, naturalWidth, naturalHeight);

      if (typeof this.onload === 'function') {
        this.onload(this);
      }
    };

    img.onerror = () => {
      if (typeof this.onerror === 'function') {
        this.onerror(this);
      }
    };

    img.src = value;
  }

  get naturalWidth() {
    return _naturalWidth.get(this);
  }

  get naturalHeight() {
    return _naturalHeight.get(this);
  }
}

exports.TransparentImageElement = TransparentImageElement;

customElements.define('transparent-image', TransparentImageElement);
