const { renderSpecialImage } = require('./common/theme-utils.js');

let _componentEls = new WeakMap();
let _system = new WeakMap();

class USThemeSpecialElement extends HTMLElement {
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
  .special-a-1,
  .special-a-2,
  .special-b-1,
  .special-b-2 {
    position: absolute;
  }
  .theme,
  .special-a-1 > img,
  .special-a-1 > swf-image,
  .special-a-2 > img,
  .special-a-2 > swf-image,
  .special-b-1 > img,
  .special-b-1 > swf-image,
  .special-b-2 > img,
  .special-b-2 > swf-image {
    position: relative;
    width: 100%;
    height: 100%;
  }
  .special-a-1 {
    animation: special-a-1 linear 7800ms infinite;
  }
  .special-a-2 {
    animation: special-a-2 linear 7800ms infinite;
  }
  .special-b-1 {
    animation: special-b-1 linear 7800ms infinite;
  }
  .special-b-2 {
    animation: special-b-2 linear 7800ms infinite;
  }
  @keyframes special-a-1 {
    0%   { transform: translate3d(0, 100%, 0); }
    5%   { transform: translate3d(0, 0, 0); }
    45%  { transform: translate3d(0, 0, 0); }
    50%  { transform: translate3d(0, 100%, 0); }
    100% { transform: translate3d(0, 100%, 0); }
  }
  @keyframes special-a-2 {
    0%   { transform: translate3d(0, 100%, 0); }
    50%  { transform: translate3d(0, 100%, 0); }
    55%  { transform: translate3d(0, 0, 0); }
    95%  { transform: translate3d(0, 0, 0); }
    100% { transform: translate3d(0, 100%, 0); }
  }
  @keyframes special-b-1 {
    0%   { opacity: 0; }
    5%   { opacity: 1; }
    45%  { opacity: 1; }
    50%  { opacity: 0; }
    100% { opacity: 0; }
  }
  @keyframes special-b-2 {
    0%   { opacity: 0; }
    50%  { opacity: 0; }
    55%  { opacity: 1; }
    95%  { opacity: 1; }
    100% { opacity: 0; }
  }
</style>
<div class="theme">
  <div class="special-a-1"></div>
  <div class="special-a-2"></div>
  <div class="special-b-1"></div>
  <div class="special-b-2"></div>
</div>
`;

    let template = document.createElement('template');
    template.innerHTML = html;

    const shadowRoot = this.attachShadow({ mode: 'closed' });
    shadowRoot.appendChild(template.content.cloneNode(true));

    _componentEls.set(this, {
      SpecialA1: shadowRoot.querySelector('.special-a-1'),
      SpecialA2: shadowRoot.querySelector('.special-a-2'),
      SpecialB1: shadowRoot.querySelector('.special-b-1'),
      SpecialB2: shadowRoot.querySelector('.special-b-2')
    });

    _system.set(this, null);
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

    if (!system) {
      return;
    }

    let componentEls = _componentEls.get(this);
    for (let component in componentEls) {
      let componentEl = componentEls[component];

      renderSpecialImage(componentEl, system, component);
    }
  }
}

exports.USThemeSpecialElement = USThemeSpecialElement;

customElements.define('us-theme-special', USThemeSpecialElement);
