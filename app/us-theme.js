class USThemeElement extends HTMLElement {
  constructor() {
    super();

    let html =
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
    width: 100%;
    height: 100%;
  }
  .background {
    width: 100%;
    height: 100%;
    z-index: 1;
  }
  .background > img,
  .background > swf-image {
    width: 100%;
    height: 100%;
  }
  .background > iframe {
    border: none;
    width: 100%;
    height: 100%;
  }
  .video {
    position: absolute;
    z-index: 1;
  }
  .artwork1,
  .artwork2,
  .artwork3,
  .artwork4 {
    position: absolute;
    z-index: 10;
  }
  .artwork1 > iframe,
  .artwork2 > iframe,
  .artwork3 > iframe,
  .artwork4 > iframe {
    border: none;
    width: 0;
    height: 0;
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
  }
</style>
<div class="theme">
  <div class="background"></div>
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

    this._themeEl = shadowRoot.querySelector('.theme');
    this._componentEls = {
      background: shadowRoot.querySelector('.background'),
      artwork1: shadowRoot.querySelector('.artwork1'),
      artwork2: shadowRoot.querySelector('.artwork2'),
      artwork3: shadowRoot.querySelector('.artwork3'),
      artwork4: shadowRoot.querySelector('.artwork4'),
      video: shadowRoot.querySelector('.video')
    };

    this._name = null;
  }

  get name() {
    return this._name;
  }

  set name(value) {
    this._name = value;
    this.render();
  }

  render() {
    this._renderImage('background');

    this._parseThemeXml().then((theme) => {
      for (let component in this._componentEls) {
        if (component !== 'video') {
          this._componentEls[component].innerHTML = '';
        }

        let attrs = theme[component];
        if (attrs) {
          if (component === 'video') {
            this._renderVideo(attrs);
          } else {
            this._renderImage(component, attrs);
          }
        }
      }

      console.log(theme);
    });
  }

  _renderImage(component, attrs) {
    let componentEl = this._componentEls[component];

    let img = document.createElement('img');
    img.onload = () => {
      if (attrs) {
        let scaleX = window.innerWidth  / 1024;
        let scaleY = window.innerHeight / 768;
        let width  = img.naturalWidth  * scaleX;
        let height = img.naturalHeight * scaleY;
        let x = (attrs.x * scaleX) - (width  / 2);
        let y = (attrs.y * scaleY) - (height / 2);

        attrs.w = width;
        attrs.h = height;

        componentEl.style.width  = width  + 'px';
        componentEl.style.height = height + 'px';
        componentEl.style.left = x + 'px';
        componentEl.style.top  = y + 'px';

        this._renderTransition(componentEl, attrs);
      }

      componentEl.appendChild(img);
    };

    img.onerror = () => {
      let swfImage = document.createElement('swf-image');
      swfImage.onload = () => {
        if (attrs) {
          let scaleX = window.innerWidth  / 1024;
          let scaleY = window.innerHeight / 768;
          let width  = swfImage.naturalWidth  * scaleX;
          let height = swfImage.naturalHeight * scaleY;
          let x = (attrs.x * scaleX) - (width  / 2);
          let y = (attrs.y * scaleY) - (height / 2);

          attrs.w = width;
          attrs.h = height;

          componentEl.style.width  = width  + 'px';
          componentEl.style.height = height + 'px';
          componentEl.style.left = x + 'px';
          componentEl.style.top  = y + 'px';

          this._renderTransition(componentEl, attrs);
        }

        componentEl.appendChild(swfImage);
      };

      swfImage.src = './app/' + this._name + '/' + component + '.swf';
    };

    img.src = './' + this._name + '/' + component + '.png';
  }

  _renderVideo(attrs) {
    let componentEl = this._componentEls.video;

    let scaleX = window.innerWidth  / 1024;
    let scaleY = window.innerHeight / 768;
    let width  = attrs.w * scaleX;
    let height = attrs.h * scaleY;
    let x = (attrs.x * scaleX) - (width  / 2);
    let y = (attrs.y * scaleY) - (height / 2);
    let rotate = attrs.r || 0;

    componentEl.style.width  = width  + 'px';
    componentEl.style.height = height + 'px';
    componentEl.style.left = x + 'px';
    componentEl.style.top  = y + 'px';
    componentEl.style.transform = 'rotate(' + rotate + 'deg)';

    let artworkEl = componentEl.querySelector('.artwork');
    artworkEl.innerHTML = '';

    let img = document.createElement('img');
    img.onload = () => {
      let width  = img.naturalWidth  * scaleX;
      let height = img.naturalHeight * scaleY;
      let imgX = (attrs.x * scaleX) - (width  / 2) - x;
      let imgY = (attrs.y * scaleY) - (height / 2) - y;

      artworkEl.style.width  = width  + 'px';
      artworkEl.style.height = height + 'px';
      artworkEl.style.left = imgX + 'px';
      artworkEl.style.top  = imgY + 'px';
      artworkEl.appendChild(img);
    };

    img.src = './' + this._name + '/video.png';

    this._renderTransition(componentEl, attrs);

    this._renderBorder(componentEl.querySelector('.border1'), attrs.bshape, attrs.bsize,  attrs.bcolor);
    this._renderBorder(componentEl.querySelector('.border2'), attrs.bshape, attrs.bsize2, attrs.bcolor2);
    this._renderBorder(componentEl.querySelector('.border3'), attrs.bshape, attrs.bsize3, attrs.bcolor3);

    console.log(attrs);
  }

  _fetchThemeXml() {
    return new Promise((resolve, reject) => {
      let xhr = new XMLHttpRequest();
      xhr.onerror = (evt) => reject(evt);
      xhr.onload = () => resolve(xhr.responseXML);
      xhr.open('GET', './' + this._name + '/theme.xml');
      xhr.send();
    });
  }

  _parseThemeXml() {
    return this._fetchThemeXml().then((xmlDoc) => {
      let result = {};

      xmlDoc.querySelectorAll('Theme > *').forEach((element) => {
        result[element.nodeName] = this._parseElement(element);
      });

      return result;
    });
  }

  _parseElement(element) {
    let result = {};

    for (let attr of element.attributes) {
      let numericValue = parseFloat(attr.value)
      result[attr.name] = isNaN(numericValue) ? attr.value : numericValue;
    }

    return result;
  }

  _parseColor(base10) {
    let string = base10.toString(16);

    while (string.length < 6) {
      string = '0' + string;
    }

    return string;
  }

  _renderBorder(element, shape, size, color) {
    element.style.borderRadius = '0';

    if (size === undefined || color === undefined) {
      element.style.border = 'none';
      element.style.left = '0';
      element.style.top = '0';
      return null;
    }

    if (shape !== undefined) {
      element.style.borderRadius = size + 'px';
    }

    element.style.border = size + 'px solid #' + this._parseColor(color);
    element.style.left = -size + 'px';
    element.style.top  = -size + 'px';
  }

  _renderTransition(element, attrs) {
    requestAnimationFrame(() => {
      let baseTransform = element.style.transform;

      switch (attrs.start) {
        case 'top':
          element.style.transform += ' translateY(' + ( -768 - (attrs.y + attrs.h / 2)) + 'px)';
          break;
        case 'right':
          element.style.transform += ' translateX(' + ( 1024 - (attrs.x - attrs.w / 2)) + 'px)';
          break;
        case 'bottom':
          element.style.transform += ' translateY(' + (  768 - (attrs.y - attrs.h / 2)) + 'px)';
          break;
        case 'left':
          element.style.transform += ' translateX(' + (-1024 - (attrs.x + attrs.w / 2)) + 'px)';
          break;
        case 'none':
          switch (attrs.type) {
            case 'grow':
              element.style.transform += ' scale(.0001)';
              break;
            case 'grow x':
              element.style.transform += ' scaleX(.0001)';
              break;
            case 'grow y':
              element.style.transform += ' scaleY(.0001)';
              break;
            case 'tv zoom out':
              element.style.transform += ' scale(4)';
              element.style.opacity = '0';
              break;
            default:
              break;
          }
          break;
        default:
          break;
      }

      let transitionTimingFunction;
      switch (attrs.type) {
        case 'ease':
          transitionTimingFunction = 'ease';
          break;
        case 'elastic bounce':
          transitionTimingFunction = 'cubic-bezier(.5,1,.5,2)';
          break;
        case 'fade':
          transitionTimingFunction = 'linear';
          element.style.opacity = '0';
          break;
        default:
          transitionTimingFunction = 'linear';
          break;
      }

      requestAnimationFrame(() => {
        element.style.transition = 'all ' + attrs.time + 's';
        element.style.transitionTimingFunction = transitionTimingFunction;
        element.style.transitionDelay = attrs.delay + 's';
        element.style.transform = baseTransform;
        element.style.opacity = '1';
      });
    });
  }
}

customElements.define('us-theme', USThemeElement);
