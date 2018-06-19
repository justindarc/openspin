let _animations = new WeakMap();
let _timeouts = new WeakMap();

let _duration = new WeakMap();
let _paused = new WeakMap();

const DEFAULT_DURATION = 8000;
const MINIMUM_DURATION = 1000;

function generateRandomNumber(min, max) {
  let range = max - min;
  return Math.round(range * Math.random()) + min;
}

class Rain {
  constructor(el, options = {}) {
    this.el = el;

    this.els = [
      el.cloneNode(),
      el.cloneNode(),
      el.cloneNode()
    ];

    let animations = [];
    let timeouts = [];

    this.els.forEach((el, index) => {
      el.style.position = 'absolute';
      el.style.top = '0';
      el.style.visibility = 'hidden';

      this.el.parentNode.appendChild(el);

      animations[index] = null;
      timeouts[index] = null;
    });

    this.el.remove();

    _animations.set(this, animations);
    _timeouts.set(this, timeouts);

    let duration = options.duration || DEFAULT_DURATION;
    this.duration = duration;

    _paused.set(this, true);
  }

  get duration() {
    return _duration.get(this);
  }

  set duration(value) {
    _duration.set(this, Math.max(value || MINIMUM_DURATION, MINIMUM_DURATION));
  }

  get paused() {
    return _paused.get(this);
  }

  play() {
    let animations = _animations.get(this);
    let timeouts = _timeouts.get(this);

    let iteration = (el, index) => {
      if (this.paused) {
        return;
      }

      let x = generateRandomNumber(0, 100);
      let width = el.offsetWidth;

      el.style.left = 'calc(' + (-width / 2) + 'px + ' + x + 'vw)';
      el.style.visibility = 'visible';

      let animation = el.animate([
        { transform: 'translate(15vw, 0vh)     rotate(20deg)',  offset: 0 },
        { transform: 'translate(-10vw, 32.5vh) rotate(-15deg)', offset: .4 },
        { transform: 'translate(-15vw, 37.5vh) rotate(-20deg)', offset: .5 },
        { transform: 'translate(10vw, 70vh)    rotate(15deg)',  offset: .9 },
        { transform: 'translate(15vw, 75vh)    rotate(20deg)',  offset: 1 }
      ], {
        duration: this.duration,
        fill: 'forwards'
      });

      animation.onfinish = () => {
        let delay = index > 0 ? generateRandomNumber(0, MINIMUM_DURATION / index) : 0;
        timeouts[index] = setTimeout(() => iteration(el, index), delay);
      };

      animations[index] = animation;
    };

    this.els.forEach((el, index) => {
      let delay = index > 0 ? generateRandomNumber(0, this.duration / index) : 0;
      timeouts[index] = setTimeout(() => iteration(el, index), delay);
    });

    _paused.set(this, false);
  }

  pause() {
    let animations = _animations.get(this);
    animations.forEach((animation) => {
      if (animation) {
        animation.pause();
      }
    });

    let timeouts = _timeouts.get(this);
    timeouts.forEach((timeout) => {
      if (timeout) {
        clearTimeout(timeout);
      }
    });

    this.els.forEach(el => el.style.visibility = 'hidden');

    _paused.set(this, true);
  }
}

module.exports = Rain;
