function fetchXml(url) {
  return new Promise((resolve, reject) => {
    let xhr = new XMLHttpRequest();
    xhr.onerror = (evt) => reject(evt);
    xhr.onload = () => resolve(xhr.responseXML);
    xhr.open('GET', url);
    xhr.send();
  });
}

exports.fetchXml = fetchXml;

function getThemeData(name) {
  return fetchXml('./' + name + '/theme.xml').then((xmlDoc) => {
    let result = {};

    xmlDoc.querySelectorAll('Theme > *').forEach((element) => {
      result[element.nodeName] = parseElement(element);
    });

    return result;
  });
}

exports.getThemeData = getThemeData;

function parseColor(base10) {
  let string = base10.toString(16);

  while (string.length < 6) {
    string = '0' + string;
  }

  return string;
}

exports.parseColor = parseColor;

function parseElement(element) {
  let result = {};

  for (let attr of element.attributes) {
    let numericValue = parseFloat(attr.value)
    result[attr.name] = isNaN(numericValue) ? attr.value : numericValue;
  }

  return result;
}

exports.parseElement = parseElement;

function renderImage(el, name, component, attrs) {
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

        renderTransition(el, attrs);
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

          renderTransition(el, attrs);
        }

        el.appendChild(swfImage);
      });
    };

    swfImage.src = './app/' + name + '/' + component + '.swf';
  };

  img.src = './' + name + '/' + component + '.png';
}

exports.renderImage = renderImage;

function renderVideo(el, name, attrs) {
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

  renderTransition(el, attrs);

  renderBorder(el.querySelector('.border1'), attrs.bshape, attrs.bsize,  attrs.bcolor);
  renderBorder(el.querySelector('.border2'), attrs.bshape, attrs.bsize2, attrs.bcolor2);
  renderBorder(el.querySelector('.border3'), attrs.bshape, attrs.bsize3, attrs.bcolor3);
}

exports.renderVideo = renderVideo;

function renderBorder(element, shape, size, color) {
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

  element.style.border = size + 'px solid #' + parseColor(color);
  element.style.left = -size + 'px';
  element.style.top  = -size + 'px';
}

exports.renderBorder = renderBorder;

function renderTransition(element, attrs) {
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

exports.renderTransition = renderTransition;
