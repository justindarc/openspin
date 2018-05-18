const { getThemeData, renderImage, renderVideo } = require('./common/theme-utils.js');

let _componentEls = new WeakMap();
let _system = new WeakMap();
let _game = new WeakMap();

class USThemeForegroundElement extends HTMLElement {
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
    width: 100%;
    height: 100%;
    transform-style: preserve-3d;
    perspective: 1000px;
  }
  .video,
  .artwork1,
  .artwork2,
  .artwork3,
  .artwork4 {
    position: absolute;
    z-index: 2;
  }
  .video[data-below="true"],
  .video[data-below="yes"] {
    z-index: 1;
  }
  .video > video,
  .video > .artwork > img,
  .video > .artwork > swf-image,
  .artwork1 > img,
  .artwork1 > swf-image,
  .artwork2 > img,
  .artwork2 > swf-image,
  .artwork3 > img,
  .artwork3 > swf-image,
  .artwork4 > img,
  .artwork4 > swf-image {
    position: relative;
    width: 100%;
    height: 100%;
  }
  .video > video {
    object-fit: fill;
    z-index: 1;
  }
  .video > video[data-forceaspect="none"] {
    object-fit: contain;
  }
  .video > video[data-forceaspect="both"] {
    object-fit: fill;
  }
  .video > video[data-overlaybelow="true"] {
    z-index: 2;
  }
  .video > .border1,
  .video > .border2,
  .video > .border3,
  .video > .artwork {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    transform: translate3d(0, 0, 0);
    z-index: 1;
  }
</style>
<div class="theme">
  <div class="artwork1"></div>
  <div class="video">
    <video loop muted></video>
    <div class="border3"></div>
    <div class="border2"></div>
    <div class="border1"></div>
    <div class="artwork"></div>
  </div>
  <div class="artwork2"></div>
  <div class="artwork3"></div>
  <div class="artwork4"></div>
</div>
`;

    let template = document.createElement('template');
    template.innerHTML = html;

    const shadowRoot = this.attachShadow({ mode: 'closed' });
    shadowRoot.appendChild(template.content.cloneNode(true));

    _componentEls.set(this, {
      artwork1: shadowRoot.querySelector('.artwork1'),
      artwork2: shadowRoot.querySelector('.artwork2'),
      artwork3: shadowRoot.querySelector('.artwork3'),
      artwork4: shadowRoot.querySelector('.artwork4'),
      video: shadowRoot.querySelector('.video')
    });

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

  play() {
    let video = _componentEls.get(this).video.querySelector('video');
    video.play();
  }

  pause() {
    let video = _componentEls.get(this).video.querySelector('video');
    video.pause();
  }

  render() {
    let system = this.system;
    let game = this.game;

    if (!system || !game) {
      return;
    }

    let componentEls = _componentEls.get(this);
    getThemeData(system, game).then((theme) => {
      for (let component in componentEls) {
        let componentEl = componentEls[component];

        if (component !== 'video') {
          componentEl.innerHTML = '';
        }

        let attrs = theme[component];
        if (attrs) {
          if (component === 'video') {
            renderVideo(componentEl, system, game, attrs);
          } else {
            renderImage(componentEl, system, game, component, attrs);
          }
        }
      }
    });
  }
}

exports.USThemeForegroundElement = USThemeForegroundElement;

customElements.define('us-theme-foreground', USThemeForegroundElement);
