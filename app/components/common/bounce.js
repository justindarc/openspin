let _animation = new WeakMap();

let _duration = new WeakMap();

const DEFAULT_DURATION = 1000;

function generateRandomNumber(min, max) {
  let range = max - min;
  return Math.round(range * Math.random()) + min;
}

class Bounce {
  constructor(el, options = {}) {
    this.el = el;

    let duration = options.duration || DEFAULT_DURATION;
    this.duration = duration;
  }

  get duration() {
    return _duration.get(this);
  }

  set duration(value) {
    _duration.set(this, Math.max(value || 1000, 1000));
  }

  play() {
    let baseTransform = this.el.style.transform;
    let lastX = 0;
    let lastY = 0;

    let iteration = () => {
      let x = generateRandomNumber(-100, 100);
      let y = generateRandomNumber(-100, 100);

      let midX = ((x - lastX) / 2) + lastX;
      let midY = ((y - lastY) / 2) + lastY;

      let animation = this.el.animate([
        { transform: baseTransform + ' translate(' + lastX + '%,' + lastY + '%) scale(1)' },
        { transform: baseTransform + ' translate(' +  midX + '%,' +  midY + '%) scale(2)' },
        { transform: baseTransform + ' translate(' +     x + '%,' +     y + '%) scale(1)' }
      ], {
        duration: this.duration,
        fill: 'forwards'
      });

      animation.onfinish = () => {
        iteration();
      };

      _animation.set(this, animation);

      lastX = x;
      lastY = y;
    };

    iteration();
  }

  pause() {
    let animation = _animation.get(this);
    if (animation) {
      animation.pause();
    }
  }
}

module.exports = Bounce;
