let _nextTick = new WeakMap();

let _paused = new WeakMap();

let _x = new WeakMap();
let _y = new WeakMap();

let _xForce = new WeakMap();
let _yForce = new WeakMap();

function generateRandomNumber(min, max) {
  let range = max - min;
  return (range * Math.random()) + min;
}

class Bounce {
  constructor(el, options = {}) {
    this.el = el;

    this.el.style.position = 'absolute';
    this.el.style.left = '0';
    this.el.style.top = '0';

    _paused.set(this, true);
    _x.set(this, 0);
    _y.set(this, 0);
    _xForce.set(this, generateRandomNumber(.25, .75));
    _yForce.set(this, generateRandomNumber(.25, .75));
  }

  get paused() {
    return _paused.get(this);
  }

  play() {
    let nextTick = _nextTick.get(this);
    if (nextTick) {
      cancelAnimationFrame(nextTick);
    }

    let elWidth  = this.el.offsetWidth;
    let elHeight = this.el.offsetHeight;

    let areaWidth  = window.innerWidth  - elWidth;
    let areaHeight = window.innerHeight - elHeight;

    let lastX = _x.get(this);
    let lastY = _y.get(this);

    let xForce = _xForce.get(this);
    let yForce = _yForce.get(this);

    let lastTimestamp;

    let tick = (timestamp) => {
      if (!lastTimestamp) {
        lastTimestamp = timestamp;
      }

      let deltaTime = timestamp - lastTimestamp;

      let x = lastX + (xForce * deltaTime);
      let y = lastY + (yForce * deltaTime);

      if (x < 0) {
        x = 0;
        xForce = generateRandomNumber(.25, .75);

        _xForce.set(this, xForce);
      } else if (x > areaWidth) {
        x = areaWidth;
        xForce = generateRandomNumber(-.25, -.75);

        _xForce.set(this, xForce);
      }

      if (y < 0) {
        y = 0;
        yForce = generateRandomNumber(.25, .75);

        _yForce.set(this, yForce);
      } else if (y > areaHeight) {
        y = areaHeight;
        yForce = generateRandomNumber(-.25, -.75);

        _yForce.set(this, yForce);
      }

      this.el.style.transform = 'translate(' + x + 'px,' + y + 'px)';

      _x.set(this, x);
      _y.set(this, y);

      lastTimestamp = timestamp;
      lastX = x;
      lastY = y;

      _nextTick.set(this, requestAnimationFrame(tick));
    };

    _nextTick.set(this, requestAnimationFrame(tick));

    _paused.set(this, false);
  }

  pause() {
    let nextTick = _nextTick.get(this);
    if (nextTick) {
      cancelAnimationFrame(nextTick);
    }

    _paused.set(this, true);
  }
}

module.exports = Bounce;
