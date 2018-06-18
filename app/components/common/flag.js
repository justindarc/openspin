let _onLoad = new WeakMap();
let _nextTick = new WeakMap();

let _wavelength = new WeakMap();
let _amplitude = new WeakMap();
let _period = new WeakMap();
let _shading = new WeakMap();
let _squeeze = new WeakMap();
let _paused = new WeakMap();

const DEFAULT_WAVELENGTH = .1;
const DEFAULT_AMPLITUDE = 20;
const DEFAULT_PERIOD = 400;
const DEFAULT_SHADING = 100;
const DEFAULT_SQUEEZE = 0;
const DEFAULT_PAUSED = false;

class Flag {
  constructor(el, options = {}) {
    this.el = el;

    let canvas = document.createElement('canvas');

    _onLoad.set(this, new Promise((resolve) => {
      let image = new Image();
      image.onload = () => {
        let width  = canvas.width  = image.naturalWidth;
        let height = canvas.height = image.naturalHeight;

        let ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0);

        let sourceImageData = ctx.getImageData(0, 0, width, height);

        resolve({ sourceImageData, width, height, canvas, ctx });
      };

      image.src = this.el.src;
    }));

    let wavelength = options.wavelength || DEFAULT_WAVELENGTH;
    _wavelength.set(this, wavelength);

    let amplitude = options.amplitude || DEFAULT_AMPLITUDE;
    _amplitude.set(this, amplitude);

    let period = options.period || DEFAULT_PERIOD;
    _period.set(this, period);

    let shading = options.shading || DEFAULT_SHADING;
    _shading.set(this, shading);

    let squeeze = options.squeeze || DEFAULT_SQUEEZE;
    _squeeze.set(this, squeeze);

    let paused = options.paused || DEFAULT_PAUSED;
    _paused.set(this, paused);

    if (paused) {
      this.pause();
    } else {
      this.play();
    }
  }

  get wavelength() {
    return _wavelength.get(this);
  }

  set wavelength(value) {
    _wavelength.set(this, Math.max(.0001, Math.min(1, value || 0)));
  }

  get amplitude() {
    return _amplitude.get(this);
  }

  set amplitude(value) {
    let clampedValue = Math.max(0, value);
    _amplitude.set(this, clampedValue);

    if (clampedValue === 0) {
      this.pause();
    }
  }

  get period() {
    return _period.get(this);
  }

  set period(value) {
    _period.set(this, Math.max(0, value));
  }

  get shading() {
    return _shading.get(this);
  }

  set shading(value) {
    _shading.set(this, Math.max(0, value));
  }

  get squeeze() {
    return _squeeze.get(this);
  }

  set squeeze(value) {
    _squeeze.set(this, value);
  }

  get paused() {
    return _paused.get(this);
  }

  animate(amplitude, duration) {
    let startingAmplitude = this.amplitude;
    let totalDeltaAmplitude = amplitude - startingAmplitude;
    let startTimestamp;
    let tick = (timestamp) => {
      if (!startTimestamp) {
        startTimestamp = timestamp;
      }

      let elapsedTime = timestamp - startTimestamp;
      let percentComplete = Math.min(elapsedTime / duration, 1);

      this.amplitude = startingAmplitude + (totalDeltaAmplitude * percentComplete);

      if (percentComplete < 1) {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);
  }

  play() {
    let nextTick = _nextTick.get(this);
    if (nextTick) {
      cancelAnimationFrame(nextTick);
    }

    let period = _period.get(this);
    let startTimestamp;

    let tick = (timestamp) => {
      if (!startTimestamp) {
        startTimestamp = timestamp;
      }

      let elapsedTime = timestamp - startTimestamp;
      let percent = elapsedTime / period;

      this.render(percent);

      _nextTick.set(this, requestAnimationFrame(tick));
    };

    _nextTick.set(this, requestAnimationFrame(tick));
  }

  pause() {
    let nextTick = _nextTick.get(this);
    if (nextTick) {
      cancelAnimationFrame(nextTick);
    }

    this.render(-1);
  }

  render(percent) {
    return _onLoad.get(this).then(({ sourceImageData, width, height, canvas, ctx }) => {
      let amplitude = _amplitude.get(this);
      let shading = _shading.get(this);
      let squeeze = _squeeze.get(this);
      let wavelength = _wavelength.get(this) * width;

      let outputHeight = height + (amplitude * 2);
      canvas.height = outputHeight;

      if (percent < 0) {
        ctx.clearRect(0, 0, width, outputHeight);
        ctx.putImageData(sourceImageData, 0, amplitude);

        return this.el.src = canvas.toDataURL('image/png');
      }

      let imageData = ctx.getImageData(0, 0, width, outputHeight);
      let sourcePixels = sourceImageData.data;
      let pixels = imageData.data;

      for (let y = 0; y < outputHeight; y++) {
        let lastOutput = 0;
        let shade = 0;
        let sq = (y - outputHeight / 2) * squeeze;

        for (let x = 0; x < width; x++) {
          let px = (y * width + x) * 4;
          let percentX = x / width;
          let output = Math.sin(x / wavelength - (Math.PI * 2) * percent) * amplitude * percentX;
          let y2 = y - amplitude + (output + sq * percentX) << 0;
          let opx = (y2 * width + x) * 4;

          shade = (output - lastOutput) * shading;
          pixels[px    ] = sourcePixels[opx    ] + shade;
          pixels[px + 1] = sourcePixels[opx + 1] + shade;
          pixels[px + 2] = sourcePixels[opx + 2] + shade;
          pixels[px + 3] = sourcePixels[opx + 3];
          lastOutput = output;
        }
      }

      ctx.putImageData(imageData, 0, 0);

      return this.el.src = canvas.toDataURL('image/png');
    });
  }
}

module.exports = Flag;
