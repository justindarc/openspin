let _componentEls = new WeakMap();
let _name = new WeakMap();

function _fetchXml(url) {
  return new Promise((resolve, reject) => {
    let xhr = new XMLHttpRequest();
    xhr.onerror = (evt) => reject(evt);
    xhr.onload = () => resolve(xhr.responseXML);
    xhr.open('GET', url);
    xhr.send();
  });
}

function _getThemeData(name) {
  return _fetchXml('./' + name + '/theme.xml').then((xmlDoc) => {
    let result = {};

    xmlDoc.querySelectorAll('Theme > *').forEach((element) => {
      result[element.nodeName] = _parseElement(element);
    });

    return result;
  });
}

function _parseColor(base10) {
  let string = base10.toString(16);

  while (string.length < 6) {
    string = '0' + string;
  }

  return string;
}

function _parseElement(element) {
  let result = {};

  for (let attr of element.attributes) {
    let numericValue = parseFloat(attr.value)
    result[attr.name] = isNaN(numericValue) ? attr.value : numericValue;
  }

  return result;
}

function _renderImage(el, name, component, attrs) {
  let img = document.createElement('img');
  img.onload = () => {
    requestAnimationFrame(() => {
      if (attrs) {
        let scaleX = window.innerWidth  / 1024;
        let scaleY = window.innerHeight / 768;
        let width  = img.naturalWidth  * scaleX;
        let height = img.naturalHeight * scaleY;
        let x = (attrs.x * scaleX) - (width  / 2);
        let y = (attrs.y * scaleY) - (height / 2);

        attrs.w = width;
        attrs.h = height;

        el.style.width  = width  + 'px';
        el.style.height = height + 'px';
        el.style.left = x + 'px';
        el.style.top  = y + 'px';
        el.style.transform = 'translate3d(0,0,0)';

        _renderTransition(el, attrs);
      }

      el.appendChild(img);
    });
  };

  img.onerror = () => {
    let swfImage = document.createElement('swf-image');
    swfImage.onload = () => {
      requestAnimationFrame(() => {
        if (attrs) {
          let scaleX = window.innerWidth  / 1024;
          let scaleY = window.innerHeight / 768;
          let width  = swfImage.naturalWidth  * scaleX;
          let height = swfImage.naturalHeight * scaleY;
          let x = (attrs.x * scaleX) - (width  / 2);
          let y = (attrs.y * scaleY) - (height / 2);

          attrs.w = width;
          attrs.h = height;

          el.style.width  = width  + 'px';
          el.style.height = height + 'px';
          el.style.left = x + 'px';
          el.style.top  = y + 'px';
          el.style.transform = 'translate3d(0,0,0)';

          _renderTransition(el, attrs);
        }

        el.appendChild(swfImage);
      });
    };

    swfImage.src = './app/' + name + '/' + component + '.swf';
  };

  img.src = './' + name + '/' + component + '.png';
}

function _renderVideo(el, name, attrs) {
  let scaleX = window.innerWidth  / 1024;
  let scaleY = window.innerHeight / 768;
  let width  = attrs.w * scaleX;
  let height = attrs.h * scaleY;
  let x = (attrs.x * scaleX) - (width  / 2);
  let y = (attrs.y * scaleY) - (height / 2);
  let rotate = attrs.r || 0;

  el.style.width  = width  + 'px';
  el.style.height = height + 'px';
  el.style.left = x + 'px';
  el.style.top  = y + 'px';
  el.style.transform = 'translate3d(0,0,0) rotate(' + rotate + 'deg)';

  let artworkEl = el.querySelector('.artwork');
  artworkEl.innerHTML = '';

  let img = document.createElement('img');
  img.onload = () => {
    requestAnimationFrame(() => {
      let width  = img.naturalWidth  * scaleX;
      let height = img.naturalHeight * scaleY;
      let imgX = (attrs.x * scaleX) - (width  / 2) - x;
      let imgY = (attrs.y * scaleY) - (height / 2) - y;

      artworkEl.style.width  = width  + 'px';
      artworkEl.style.height = height + 'px';
      artworkEl.style.left = imgX + 'px';
      artworkEl.style.top  = imgY + 'px';
      artworkEl.style.transform = 'translate3d(0,0,0)';

      artworkEl.appendChild(img);
    });
  };

  img.src = './' + name + '/video.png';

  _renderTransition(el, attrs);

  _renderBorder(el.querySelector('.border1'), attrs.bshape, attrs.bsize,  attrs.bcolor);
  _renderBorder(el.querySelector('.border2'), attrs.bshape, attrs.bsize2, attrs.bcolor2);
  _renderBorder(el.querySelector('.border3'), attrs.bshape, attrs.bsize3, attrs.bcolor3);
}

function _renderBorder(element, shape, size, color) {
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

  element.style.border = size + 'px solid #' + _parseColor(color);
  element.style.left = -size + 'px';
  element.style.top  = -size + 'px';
}

function _renderTransition(element, attrs) {
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

class USThemeElement extends HTMLElement {
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

    _componentEls.set(this, {
      background: shadowRoot.querySelector('.background'),
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

    _getThemeData(name).then((theme) => {
      for (let component in componentEls) {
        let componentEl = componentEls[component];

        if (component !== 'video') {
          componentEl.innerHTML = '';
        }

        let attrs = theme[component];
        if (attrs || component === 'background') {
          if (component === 'video') {
            _renderVideo(componentEl, name, attrs);
          } else {
            _renderImage(componentEl, name, component, attrs);
          }
        }
      }
    });
  }
}

customElements.define('us-theme', USThemeElement);
