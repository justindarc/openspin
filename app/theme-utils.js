const StreamZip = require('node-stream-zip');
const fs = require('fs');
const path = require('path');
const tmp = require('tmp');

const ROOT_PATH = path.join(process.cwd(), 'HyperSpin');
const DATABASES_PATH = path.join(ROOT_PATH, 'Databases');
const MEDIA_PATH = path.join(ROOT_PATH, 'Media');

tmp.setGracefulCleanup();

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

function getThemeData(system, game) {
  let zipPath = path.join(MEDIA_PATH, system, 'Themes', game + '.zip');
  return getTempFileFromZip(zipPath, 'theme.xml')
    .then((tmpPath) => fetchXml('../' + tmpPath))
    .then((xmlDoc) => {
      let result = {};

      xmlDoc.querySelectorAll('Theme > *').forEach((element) => {
        result[element.nodeName] = parseElement(element);
      });

      return result;
    })
    .catch((error) => {
      console.error(error);
    });
}

exports.getThemeData = getThemeData;

function parseColor(color) {
  let string = color.toString(16);

  while (string.length < 6) {
    string = '0' + string;
  }

  return string;
}

exports.parseColor = parseColor;

function parseElement(element) {
  let result = {};

  for (let attr of element.attributes) {
    let numericValue = attr.value.startsWith('0x') ? parseInt(attr.value, 16) : parseFloat(attr.value);
    result[attr.name] = isNaN(numericValue) ? attr.value : numericValue;
  }

  return result;
}

exports.parseElement = parseElement;

function getTempFileFromZip(zipPath, prefix) {
  return new Promise((resolve, reject) => {
    let zip = new StreamZip({
      file: zipPath,
      storeEntries: true
    });

    zip.on('ready', () => {
      let zipEntries = zip.entries();
      for (let filename in zipEntries) {
        if (path.basename(filename).toLowerCase().startsWith(prefix)) {
          let zipEntry = zipEntries[filename];
          let extension = path.extname(filename);

          tmp.tmpName({ template: './tmp/theme-XXXXXX' + extension }, (error, tmpPath) => {
            if (error) {
              reject(error);
              return;
            }

            zip.extract(filename, tmpPath, (error) => {
              if (error) {
                reject(error);
                return;
              }

              // Cleanup temp file later.
              setTimeout(() => {
                fs.unlink(tmpPath, (error) => {
                  if (error) {
                    console.error(error);
                  }
                });
              }, 1000);

              resolve(tmpPath);
            });
          });

          break;
        }
      }
    });
  });
}

function renderImage(el, system, game, component, attrs) {
  let zipPath = path.join(MEDIA_PATH, system, 'Themes', game + '.zip');
  getTempFileFromZip(zipPath, component).then((tmpPath) => {
    let extension = path.extname(tmpPath).toLowerCase();
    if (extension === '.swf') {
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
            let rotate = attrs.r || 0;

            attrs.w = width;
            attrs.h = height;

            el.style.width  = width  + 'px';
            el.style.height = height + 'px';
            el.style.left = x + 'px';
            el.style.top  = y + 'px';
            el.style.transform = 'translate3d(0,0,0) rotate(' + rotate + 'deg)';

            renderTransition(el, attrs);
          }

          el.appendChild(swfImage);
        });
      };

      swfImage.src = tmpPath;
    } else {
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
            let rotate = attrs.r || 0;

            attrs.w = width;
            attrs.h = height;

            el.style.width  = width  + 'px';
            el.style.height = height + 'px';
            el.style.left = x + 'px';
            el.style.top  = y + 'px';
            el.style.transform = 'translate3d(0,0,0) rotate(' + rotate + 'deg)';

            renderTransition(el, attrs);
          }

          el.appendChild(img);
        });
      };

      img.src = '../' + tmpPath;
    }
  });
}

exports.renderImage = renderImage;

function renderVideo(el, system, game, attrs) {
  console.log(el, system, game, attrs);
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
  el.dataset.below = attrs.below;

  let videoEl = window.vid = el.querySelector('video');
  videoEl.src = path.join(MEDIA_PATH, system, 'Video', game + '.mp4');
  videoEl.dataset.forceaspect = attrs.forceaspect || 'none';
  videoEl.dataset.overlaybelow = attrs.overlaybelow;

  let artworkEl = el.querySelector('.artwork');
  artworkEl.innerHTML = '';

  let zipPath = path.join(MEDIA_PATH, system, 'Themes', game + '.zip');
  getTempFileFromZip(zipPath, 'video').then((tmpPath) => {
    let img = document.createElement('img');
    img.onload = () => {
      requestAnimationFrame(() => {
        let width  = img.naturalWidth  * scaleX;
        let height = img.naturalHeight * scaleY;
        let overlayOffsetX = attrs.overlayoffsetx || 0;
        let overlayOffsetY = attrs.overlayoffsety || 0;
        let imgX = ((attrs.x + overlayOffsetX) * scaleX) - (width  / 2) - x;
        let imgY = ((attrs.y + overlayOffsetY) * scaleY) - (height / 2) - y;

        artworkEl.style.width  = width  + 'px';
        artworkEl.style.height = height + 'px';
        artworkEl.style.left = imgX + 'px';
        artworkEl.style.top  = imgY + 'px';
        artworkEl.style.transform = 'translate3d(0,0,0)';

        artworkEl.appendChild(img);
      });
    };

    img.src = '../' + tmpPath;
  });

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
