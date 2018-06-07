let _onLoad = new WeakMap();

let _amount = new WeakMap();

function easeOutQuint(t) { return 1+(--t)*t*t*t*t; }

class Pixelate {
  constructor(el) {
    this.el = el;
    this.image = new Image();

    let shrinkCanvas = document.createElement('canvas');
    let resizeCanvas = document.createElement('canvas');

    _onLoad.set(this, new Promise((resolve) => {
      this.image.onload = () => {
        resizeCanvas.width  = this.image.naturalWidth;
        resizeCanvas.height = this.image.naturalHeight;

        shrinkCanvas.style.imageRendering = 'pixelated';
        resizeCanvas.style.imageRendering = 'pixelated';

        shrinkCanvas.getContext('2d').imageSmoothingEnabled = false;
        resizeCanvas.getContext('2d').imageSmoothingEnabled = false;

        resolve({ shrinkCanvas, resizeCanvas });
      };

      this.image.src = this.el.src;
    }));

    _amount.set(this, 0);
  }

  get amount() {
    return _amount.get(this);
  }

  set amount(value) {
    let amount = easeOutQuint(Math.max(0, Math.min(1, value)));
    _amount.set(this, amount);

    _onLoad.get(this).then(({ shrinkCanvas, resizeCanvas }) => {
      let shrinkCtx = shrinkCanvas.getContext('2d');
      let resizeCtx = resizeCanvas.getContext('2d');

      let resizeWidth  = resizeCanvas.width;
      let resizeHeight = resizeCanvas.height;

      let shrinkWidth  = Math.max(resizeWidth  * (1 - amount), 2);
      let shrinkHeight = Math.max(resizeHeight * (1 - amount), 2);

      shrinkCanvas.width  = shrinkWidth;
      shrinkCanvas.height = shrinkHeight;

      shrinkCtx.clearRect(0, 0, shrinkWidth, shrinkHeight);
      shrinkCtx.drawImage(this.image, 0, 0, shrinkWidth, shrinkHeight);

      resizeCtx.clearRect(0, 0, resizeWidth, resizeHeight);
      resizeCtx.drawImage(shrinkCanvas, 0, 0, resizeWidth, resizeHeight);

      this.el.src = resizeCanvas.toDataURL('image/png');
    });
  }

  animate(amount, duration) {
    let startingAmount = this.amount;
    let totalDeltaAmount = amount - startingAmount;
    let startTimestamp;

    let tick = (timestamp) => {
      if (!startTimestamp) {
        startTimestamp = timestamp;
      }

      let elapsedTime = timestamp - startTimestamp;
      let percentComplete = Math.min(elapsedTime / duration, 1);

      this.amount = startingAmount + (totalDeltaAmount * percentComplete);

      if (percentComplete < 1) {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);
  }
}

module.exports = Pixelate;
