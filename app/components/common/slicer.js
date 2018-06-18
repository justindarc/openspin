let _onLoad = new WeakMap();
let _nextTick = new WeakMap();

let _duration = new WeakMap();
let _slices = new WeakMap();

const DEFAULT_DURATION = 1000;
const DEFAULT_SLICES = 11;

const SLICE_DURATION = 1000;

class Slicer {
  constructor(el, options = {}) {
    this.el = el;

    let canvas = document.createElement('canvas');

    _onLoad.set(this, new Promise((resolve) => {
      let sourceImage = new Image();
      sourceImage.onload = () => {
        let width  = canvas.width  = sourceImage.naturalWidth;
        let height = canvas.height = sourceImage.naturalHeight;

        let ctx = canvas.getContext('2d');

        resolve({ sourceImage, width, height, canvas, ctx });
      };

      sourceImage.src = this.el.src;
    }));

    let duration = options.duration || DEFAULT_DURATION;
    this.duration = duration;

    let slices = options.slices || DEFAULT_SLICES;
    this.slices = slices;

    this.render(0);
  }

  get duration() {
    return _duration.get(this);
  }

  set duration(value) {
    _duration.set(this, Math.max(value || 1000, 1000));
  }

  get slices() {
    return _slices.get(this);
  }

  set slices(value) {
    _slices.set(this, Math.max(value || 1, 1));
  }

  play() {
    return _onLoad.get(this).then(({ sourceImage, width, height, canvas, ctx }) => {
      let nextTick = _nextTick.get(this);
      if (nextTick) {
        cancelAnimationFrame(nextTick);
      }

      ctx.clearRect(0, 0, width, height);

      let startTimestamp;

      let tick = (timestamp) => {
        if (!startTimestamp) {
          startTimestamp = timestamp;
        }

        let elapsedTime = timestamp - startTimestamp;
        let percent = Math.min(elapsedTime / this.duration, 1);

        this.render(percent);

        if (percent < 1) {
          _nextTick.set(this, requestAnimationFrame(tick));
        }
      };

      _nextTick.set(this, requestAnimationFrame(tick));
    });
  }

  render(percent) {
    return _onLoad.get(this).then(({ sourceImage, width, height, canvas, ctx }) => {
      let duration = this.duration;
      let timestamp = duration * percent;
      let slices = this.slices;
      let sliceWidth = Math.floor(width / slices);

      for (let slice = 0; slice < slices; slice++) {
        let sliceStartTimestamp = ((duration - SLICE_DURATION) / slices) * slice;
        let slicePercent = Math.min(Math.max((timestamp - sliceStartTimestamp) / SLICE_DURATION, 0), 1);

        let sliceScaledWidth  = sliceWidth * slicePercent;
        let sliceScaledHeight = height * slicePercent

        let sliceX = slice % 2 ? ((slice + 1) * sliceWidth) - sliceScaledWidth : slice * sliceWidth;
        let sliceY = slice % 2 ? height - sliceScaledHeight : 0;

        ctx.clearRect(sliceX, 0, sliceWidth, height);
        ctx.drawImage(sourceImage, sliceX, 0, sliceWidth, height, sliceX, sliceY, sliceScaledWidth, sliceScaledHeight);
      }

      return this.el.src = canvas.toDataURL('image/png');
    });
  }
}

module.exports = Slicer;
