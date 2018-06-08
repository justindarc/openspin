const { getThemeData, renderImage, renderVideo, renderTransition } = require('../common/theme-utils.js');

let _componentEls = new WeakMap();
let _system = new WeakMap();
let _game = new WeakMap();

class ThemeForegroundElement extends HTMLElement {
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
  .video > video-player,
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
  .video > video-player {
    object-fit: fill;
    z-index: 1;
  }
  .video > video-player[data-forceaspect="none"] {
    object-fit: contain;
  }
  .video > video-player[data-forceaspect="both"] {
    object-fit: fill;
  }
  .video > video-player[data-overlaybelow="true"] {
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
    z-index: 1;
  }
</style>
<div class="theme">
  <div class="artwork1"></div>
  <div class="video">
    <video-player loop muted></video-player>
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
    if (value === this.game) {
      return;
    }

    _game.set(this, value);
    this.render();
  }

  get system() {
    return _system.get(this);
  }

  set system(value) {
    if (value === this.system) {
      return;
    }

    _system.set(this, value);
    this.render();
  }

  play() {
    let video = _componentEls.get(this).video.querySelector('video-player');
    video.play();
  }

  pause() {
    let video = _componentEls.get(this).video.querySelector('video-player');
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
      let promises = [];
      for (let component in componentEls) {
        let componentEl = componentEls[component];
        componentEl.removeAttribute('style');

        if (component !== 'video') {
          componentEl.innerHTML = '';
        }

        let attrs = theme[component];
        if (attrs) {
          if (component === 'video') {
            promises.push(renderVideo(componentEl, system, game, attrs));
          } else {
            promises.push(renderImage(componentEl, system, game, component, attrs));
          }
        }
      }

      Promise.all(promises).then((renders) => {
        this.dispatchEvent(new CustomEvent('render'));

        requestAnimationFrame(() => {
          for (let { el, attrs } of renders.filter(render => !!render)) {
            if (el && attrs) {
              renderTransition(el, attrs);
            }
          }
        });
      }).catch((error) => {
        console.error('Unable to render theme', error);
      });
    });
  }
}

exports.ThemeForegroundElement = ThemeForegroundElement;

customElements.define('theme-foreground', ThemeForegroundElement);
