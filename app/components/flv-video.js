const { FlvPlayer } = require('flv.js');

const path = require('path');

let _videoEl = new WeakMap();
let _flvPlayer = new WeakMap();

class FLVVideoElement extends HTMLElement {
  constructor() {
    super();

    const html =
`
<style>
  :host {
    display: inline-block;
  }
</style>
<video></video>
`;

    let template = document.createElement('template');
    template.innerHTML = html;

    let shadowRoot = this.attachShadow({ mode: 'closed' });
    shadowRoot.appendChild(template.content.cloneNode(true));

    let videoEl = shadowRoot.querySelector('video');
    videoEl.onloadedmetadata = () => this.onloadedmetadata();
    videoEl.onerror = () => this.onerror();
    _videoEl.set(this, videoEl);

    setTimeout(() => {
      this.src = this.getAttribute('src');
    });
  }

  get src() {
    return this.getAttribute('src') || null;
  }

  set src(value) {
    if (value === this.src) {
      return;
    }

    this.setAttribute('src', value);

    let oldFlvPlayer = _flvPlayer.get(this);
    if (oldFlvPlayer) {
      oldFlvPlayer.detachMediaElement();
      oldFlvPlayer.unload();
      oldFlvPlayer.destroy();
    }

    if (!value) {
      return;
    }

    let type = path.extname(value.toLowerCase()) === 'flv' ? 'flv' : 'mp4';

    let flvPlayer = new FlvPlayer({ type: type, url: value });
    flvPlayer.attachMediaElement(_videoEl.get(this));
    flvPlayer.muted = this.hasAttribute('muted');
    flvPlayer.load();

    _flvPlayer.set(this, flvPlayer);

    if (this.hasAttribute('autoplay')) {
      this.play();
    }
  }

  play() {
    let flvPlayer = _flvPlayer.get(this);
    if (flvPlayer) {
      flvPlayer.play();
    }
  }

  pause() {
    let flvPlayer = _flvPlayer.get(this);
    if (flvPlayer) {
      flvPlayer.pause();
    }
  }

  onloadedmetadata() {}
  onerror() {}
}

exports.FLVVideoElement = FLVVideoElement;

customElements.define('flv-video', FLVVideoElement);
