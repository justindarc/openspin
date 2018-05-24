let _gfxEl = new WeakMap();
let _playerEl = new WeakMap();
let _contentWindows = new WeakMap();

let _naturalWidth = new WeakMap();
let _naturalHeight = new WeakMap();
let _worldWidth = new WeakMap();
let _worldHeight = new WeakMap();

function getContentWindows(iframes) {
  return Promise.all(iframes.map((iframe) => {
    return new Promise((resolve, reject) => {
      iframe.addEventListener('load', resolve);
      iframe.addEventListener('error', reject);
    });
  })).then(() => iframes.map(iframe => iframe.contentWindow));
}

function onFirstFrame(gfxWindow, playerWindow) {
  return new Promise((resolve) => {
    let onMessage = (evt) => {
      if (evt.data.type === 'frame') {
        gfxWindow.removeEventListener('message', onMessage);
        resolve(playerWindow.player);
      }
    };

    gfxWindow.addEventListener('message', onMessage);
  });
}

function loadSwfFile(contentWindows, src) {
  return contentWindows.then((contentWindows) => {
    let [gfxWindow, playerWindow] = contentWindows;

    let easel = gfxWindow.createEasel();
    let easelHost = gfxWindow.createEaselHost(playerWindow);
    let params = {
      baseUrl: document.location.href,
      url: src,
      movieParams: {},
      objectParams: {
        wmode: 'transparent'
      },
      compilerSettings: {
        sysCompiler: true,
        appCompiler: true,
        verifier: true
      },
      // bgcolor: undefined,
      displayParameters: easel.getDisplayParameters()
    };

    playerWindow.runSwfPlayer(params, null, gfxWindow);

    return onFirstFrame(gfxWindow, playerWindow);
  }).catch(error => console.error(error));
}

class SWFObject extends HTMLElement {
  constructor() {
    super();

    const html =
`
<style>
  :host {
    display: block;
  }
  .container {
    width: 100%;
    height: 100%;
  }
  iframe,
  webview {
    border: none;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
  .player {
    position: fixed;
    width: 0;
    height: 0;
    visibility: hidden;
  }
</style>
<div class="container">
  <iframe class="gfx" src="./components/shumway/iframe/viewer.gfx.html"></iframe>
  <iframe class="player" src="./components/shumway/iframe/viewer.player.html"></iframe>
</div>
`;

    let template = document.createElement('template');
    template.innerHTML = html;

    let shadowRoot = this.attachShadow({ mode: 'closed' });
    shadowRoot.appendChild(template.content.cloneNode(true));

    let gfx = window.gfx = shadowRoot.querySelector('.gfx');
    _gfxEl.set(this, gfx);

    let player = shadowRoot.querySelector('.player');
    _playerEl.set(this, player);

    let contentWindows = getContentWindows([gfx, player]);
    _contentWindows.set(this, contentWindows);

    // setTimeout(() => {
    //   this.src = this.getAttribute('src');
    // });
  }

  get src() {
    return this.getAttribute('src') || null;
  }

  set src(value) {
    this.setAttribute('src', value);

    if (value) {
      loadSwfFile(_contentWindows.get(this), value).then((player) => {
        let { stageWidth, stageHeight } = player.stage;
        let worldWidth = player.stage.width;
        let worldHeight = player.stage.height;

        _naturalWidth.set(this, stageWidth);
        _naturalHeight.set(this, stageHeight);
        _worldWidth.set(this, worldWidth);
        _worldHeight.set(this, worldHeight);

        if (typeof this.onload === 'function') {
          this.onload(this);
        }
      }).catch((error) => {
        if (typeof this.onerror === 'function') {
          this.onerror(this);
        }
      });
    }
  }

  get naturalWidth() {
    return _naturalWidth.get(this);
  }

  get naturalHeight() {
    return _naturalHeight.get(this);
  }

  get worldWidth() {
    return _worldWidth.get(this);
  }

  get worldHeight() {
    return _worldHeight.get(this);
  }
}

exports.SWFObject = SWFObject;

customElements.define('swf-object', SWFObject);
