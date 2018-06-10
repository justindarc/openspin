let _canvas = new WeakMap();
let _imageData = new WeakMap();
let _amount = new WeakMap();
let _brightness = new WeakMap();
let _contrast = new WeakMap();
let _paused = new WeakMap();
let _scale = new WeakMap();

let _nextTick = new WeakMap();

const DEFAULT_WIDTH = 300;
const DEFAULT_HEIGHT = 150;

const DEFAULT_AMOUNT = 80;
const DEFAULT_BRIGHTNESS = 255;
const DEFAULT_CONTRAST = 96;
const DEFAULT_PAUSED = false;
const DEFAULT_SCALE = 2;

const MAX_CACHED_FRAMES = 8;

function generateRandomNumber(min, max) {
  let range = max - min;
  return Math.round(range * Math.random()) + min;
}

class Noise {
  constructor(el, options = {}) {
    this.el = el;

    let width  = options.width  || DEFAULT_WIDTH;
    let height = options.height || DEFAULT_HEIGHT;

    let canvas = document.createElement('canvas');
    canvas.width  = width;
    canvas.height = height;
    _canvas.set(this, canvas);

    let scale = Math.max(1, Math.min(8, options.scale || DEFAULT_SCALE));
    _scale.set(this, scale);
    _canvas.get(this).getContext('2d').scale(scale, scale);

    let imageData = new ImageData(width / scale, height / scale);
    _imageData.set(this, imageData);

    let amount = options.amount || DEFAULT_AMOUNT;
    _amount.set(this, amount);

    let brightness = options.brightness || DEFAULT_BRIGHTNESS;
    _brightness.set(this, brightness);

    let contrast = options.contrast || DEFAULT_CONTRAST;
    _contrast.set(this, contrast);

    let paused = options.paused || DEFAULT_PAUSED;
    _paused.set(this, paused);

    if (paused) {
      this.generate();
    } else {
      this.play();
    }
  }

  get amount() {
    return _amount.get(this);
  }

  set amount(value) {
    _amount.set(this, Math.max(0, Math.min(100, value || 0)));
  }

  get brightness() {
    return _brightness.get(this);
  }

  set brightness(value) {
    _brightness.set(this, Math.max(0, Math.min(255, value || 0)));
  }

  get contrast() {
    return _contrast.get(this);
  }

  set contrast(value) {
    _contrast.set(this, Math.max(0, Math.min(255, value || 0)));
  }

  get paused() {
    return _paused.get(this);
  }

  get scale() {
    return _scale.get(this);
  }

  get width() {
    return _canvas.get(this).width;
  }

  get height() {
    return _canvas.get(this).height;
  }

  play() {
    let nextTick = _nextTick.get(this);
    if (nextTick) {
      cancelAnimationFrame(nextTick);
    }

    let cachedFrames = [];
    let index = 0;

    let tick = () => {
      if (this.paused) {
        return;
      }

      let canvas = _canvas.get(this);

      if (cachedFrames.length < MAX_CACHED_FRAMES) {
        cachedFrames.push(this.generate());
      } else {
        this.el.src = cachedFrames[index];

        index = (index + 1) % MAX_CACHED_FRAMES;
      }

      _nextTick.set(this, requestAnimationFrame(tick));
    };

    _nextTick.set(this, requestAnimationFrame(tick));
  }

  pause() {
    _paused.set(this, false);

    let nextTick = _nextTick.get(this);
    if (nextTick) {
      cancelAnimationFrame(nextTick);
    }
  }

  generate() {
    let imageData = _imageData.get(this);
    let pixels = imageData.data;
    let length = pixels.length;

    let brightness = this.brightness;
    let contrast = this.contrast;

    for (let pixel = 0; pixel < length; pixel += 4) {
      if (generateRandomNumber(0, 100) < this.amount) {
        pixels[pixel + 0] = pixels[pixel + 1] = pixels[pixel + 2] = generateRandomNumber(contrast, brightness);
      } else {
        pixels[pixel + 0] = pixels[pixel + 1] = pixels[pixel + 2] = brightness;
      }
      pixels[pixel + 3] = 255;
    }

    let canvas = _canvas.get(this);
    let ctx = canvas.getContext('2d');
    ctx.putImageData(imageData, 0, 0);
    ctx.drawImage(canvas, 0, 0);

    return this.el.src = canvas.toDataURL('image/png');
  }
}

module.exports = Noise;
