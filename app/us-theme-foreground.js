const { getThemeData, renderImage, renderVideo } = require('./theme-utils.js');

let _componentEls = new WeakMap();
let _name = new WeakMap();

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
    background: #000;
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
  }
</style>
<div class="theme">
  <div class="video">
    <div class="border3"></div>
    <div class="border2"></div>
    <div class="border1"></div>
    <video></video>
    <div class="artwork"></div>
  </div>
  <div class="artwork1"></div>
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
    let componentEls = _componentEls.get(this);
    let name = this.name;

    getThemeData(name).then((theme) => {
      for (let component in componentEls) {
        let componentEl = componentEls[component];

        if (component !== 'video') {
          componentEl.innerHTML = '';
        }

        let attrs = theme[component];
        if (attrs) {
          if (component === 'video') {
            renderVideo(componentEl, name, attrs);
          } else {
            renderImage(componentEl, name, component, attrs);
          }
        }
      }
    });
  }
}

customElements.define('us-theme-foreground', USThemeForegroundElement);
