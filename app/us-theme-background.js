const { renderImage } = require('./theme-utils.js');

let _backgroundEl = new WeakMap();
let _name = new WeakMap();

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

    _name.set(this, null);
  }

  get name() {
    return _name.get(this);
  }

  set name(value) {
    _name.set(this, value);
    this.render();
  }

  render() {
    let backgroundEl = _backgroundEl.get(this);
    let name = this.name;

    renderImage(backgroundEl, name, 'background');
  }
}

customElements.define('us-theme-background', USThemeBackgroundElement);
