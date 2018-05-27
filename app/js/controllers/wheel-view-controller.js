const { ViewController } = require('../../components/view-element.js');
const { debounce, getGameList, getWheelImagePath } = require('../../components/common/theme-utils.js');

let _wheelActiveTimeout = new WeakMap();

class WheelViewController extends ViewController {
  constructor(view, system) {
    super(view);

    this.system = system;

    this.game = null;
    this.gameList = [];

    this.background = view.querySelector('us-theme-background');
    this.foreground = view.querySelector('us-theme-foreground');
    this.special = view.querySelector('us-theme-special');
    this.wheel = view.querySelector('us-wheel');

    this.special.system = system;

    let onChange = debounce((evt) => {
      this.game = this.gameList[evt.detail.selectedIndex].name;

      this.view.addEventListener('transitionend', onHideThemeTransitionEnd);
      this.view.classList.add('hide-theme');
    }, 500, this);

    let onHideThemeTransitionEnd = () => {
      this.view.removeEventListener('transitionend', onHideThemeTransitionEnd);

      requestAnimationFrame(() => {
        this.renderTheme();
      });
    };

    this.wheel.addEventListener('render', (evt) => {
      let game = this.gameList[evt.detail.index];
      let src = getWheelImagePath(this.system, game.name);
      let alt = game.description || game.name;
      evt.detail.element.innerHTML = '<us-wheel-image src="' + src + '" alt="' + alt + '"></us-wheel-image>';
    });

    this.wheel.addEventListener('change', (evt) => {
      this.activateWheel();
      onChange(evt);
    });

    this.wheel.addEventListener('select', (evt) => {
      let game = this.gameList[evt.detail.selectedIndex].name;
      // TODO: Determine if the selected item is another system or a game.
      this.onGameSelect(game);
      this.onSystemSelect(game);
    });

    this.wheel.addEventListener('exit', () => {
      requestAnimationFrame(() => {
        this.onExit();
      });
    });

    getGameList(this.system).then((gameList) => {
      this.gameList = gameList;
      this.wheel.itemCount = this.gameList.length;
    });
  }

  onWillHide() {
    this.foreground.pause();
  }

  onDidHide() {
    this.background.remove();
    this.foreground.remove();
  }

  onWillShow() {
    this.view.classList.add('hide-wheel');
  }

  onDidShow() {
    this.view.classList.add('hide-theme');

    this.renderTheme();

    requestAnimationFrame(() => {
      // Trigger re-flow.
      this.wheel.offsetHeight;
      this.view.classList.remove('hide-wheel');

      this.activateWheel();
    });
  }

  onBlur() {
    this.wheel.disabled = true;
  }

  onFocus() {
    this.wheel.disabled = false;
  }

  activateWheel(timeout = 1000) {
    clearTimeout(_wheelActiveTimeout.get(this));

    this.wheel.classList.add('active');

    _wheelActiveTimeout.set(this, setTimeout(() => {
      this.wheel.classList.remove('active');
    }, timeout));
  }

  renderTheme() {
    this.background.remove();
    this.foreground.remove();

    this.background = document.createElement('us-theme-background');
    this.view.prepend(this.background);

    this.background.system = this.system;
    this.background.game = this.game;

    this.foreground = document.createElement('us-theme-foreground');
    this.view.append(this.foreground);

    Promise.all([
      new Promise(resolve => this.background.addEventListener('render', resolve)),
      new Promise(resolve => this.foreground.addEventListener('render', resolve))
    ]).then(() => {
      this.view.classList.remove('hide-theme');
      this.foreground.play();
    });

    this.foreground.system = this.system;
    this.foreground.game = this.game;
  }

  onGameSelect(game) {}
  onSystemSelect(system) {}
  onExit() {}
}

module.exports = WheelViewController;
