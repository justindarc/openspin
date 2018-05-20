const { renderImage } = require('./common/theme-utils.js');

let _backgroundEl = new WeakMap();
let _system = new WeakMap();
let _game = new WeakMap();

class USThemeBackgroundElement extends HTMLElement {
  constructor() {
    super();

    const html =
`
<style>
  :host {
    display: block;
  }
  * {
    -webkit-user-drag: none;
    user-select: none;
  }
  .theme {
    background: #000;
  }
  .theme,
  .background,
  .background > img,
  .background > swf-image {
    width: 100%;
    height: 100%;
  }
</style>
<div class="theme">
  <div class="background"></div>
</div>
`;

    let template = document.createElement('template');
    template.innerHTML = html;

    const shadowRoot = this.attachShadow({ mode: 'closed' });
    shadowRoot.appendChild(template.content.cloneNode(true));

    _backgroundEl.set(this, shadowRoot.querySelector('.background'));

    _system.set(this, null);
    _game.set(this, null);
  }

  get game() {
    return _game.get(this);
  }

  set game(value) {
    _game.set(this, value);
    this.render();
  }

  get system() {
    return _system.get(this);
  }

  set system(value) {
    _system.set(this, value);
    this.render();
  }

  render() {
    let system = this.system;
    let game = this.game;

    if (!system || !game) {
      return;
    }

    let backgroundEl = _backgroundEl.get(this);
    backgroundEl.innerHTML = '';

    renderImage(backgroundEl, system, game, 'background').then(() => {
      this.dispatchEvent(new CustomEvent('render'));
    });
  }
}

exports.USThemeBackgroundElement = USThemeBackgroundElement;

customElements.define('us-theme-background', USThemeBackgroundElement);
