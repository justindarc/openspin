const ViewController = require('../../components/view-controller.js');
const { getVideoPath } = require('../../components/common/theme-utils.js');

class IntroViewController extends ViewController {
  constructor(view) {
    super(view);

    this.video = view.querySelector('video-player');
    this.video.src = getVideoPath('Frontend', 'Intro');
    this.video.onended = () => this.onDismiss();

    let onKeyDown = (evt) => {
      // If we're not visible, ignore key events.
      if (!view.offsetParent) {
        return;
      }

      this.onDismiss();
    };

    window.addEventListener('keydown', onKeyDown);

    view.ondisconnected = () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }

  onDismiss() {}
}

module.exports = IntroViewController;
