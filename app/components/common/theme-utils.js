const StreamZip = require('node-stream-zip');

const fs = require('fs');
const path = require('path');
const tmp = require('tmp');
const xml2js = require('xml2js');

const ROOT_PATH = path.join(process.cwd(), 'HyperSpin');
const DATABASES_PATH = path.join(ROOT_PATH, 'Databases');
const MEDIA_PATH = path.join(ROOT_PATH, 'Media');
const SETTINGS_PATH = path.join(ROOT_PATH, 'Settings');

const DEFAULT_SCREEN_WIDTH = 1024;
const DEFAULT_SCREEN_HEIGHT = 768;

tmp.setGracefulCleanup();

function debounce(fn, delay, scope) {
  let timeout = null;

  return function() {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(scope || this, arguments), delay);
  }
}

exports.debounce = debounce;

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
    .then((tmpPath) => fetchXml(tmpPath))
    .then((xmlDoc) => {
      let result = {};

      xmlDoc.querySelectorAll('Theme > *').forEach((el) => {
        result[el.nodeName] = parseElement(el);
      });

      return result;
    })
    .catch((error) => {
      if (game !== 'default') {
        return getThemeData(system, 'default');
      } else {
        console.error(error);
      }
    });
}

exports.getThemeData = getThemeData;

function getGameList(system) {
  return new Promise((resolve, reject) => {
    const dbPath = path.join(DATABASES_PATH, system, system + '.xml');

    fs.readFile(dbPath, 'utf8', (error, string) => {
      if (error) {
        console.error(error);
        reject(error);
        return;
      }

      xml2js.parseString(string, (error, json) => {
        if (error) {
          console.error(error);
          reject(error);
          return;
        }

        let gameList = json.menu.game.map((node) => {
          let game = node.$ || {};
          if (node.description) {
            game.description = node.description;
          }
          return game;
        });

        resolve(gameList);
      });
    });
  });
}

exports.getGameList = getGameList;

function parseColor(color) {
  let string = color.toString(16);

  while (string.length < 6) {
    string = '0' + string;
  }

  return string;
}

exports.parseColor = parseColor;

function parseElement(el) {
  let result = {};

  for (let attr of el.attributes) {
    let numericValue = attr.value.startsWith('0x') ? parseInt(attr.value, 16) : parseFloat(attr.value);
    result[attr.name] = isNaN(numericValue) ? attr.value : numericValue;
  }

  return result;
}

exports.parseElement = parseElement;

function getWheelImagePath(system, name) {
  return path.join(MEDIA_PATH, system, 'Images', 'Wheel', name + '.png');
}

exports.getWheelImagePath = getWheelImagePath;

function getFrontendImagePath(name) {
  return path.join(MEDIA_PATH, 'Frontend', 'Images', name + '.png');
}

exports.getFrontendImagePath = getFrontendImagePath;

function getFrontendVideoPath(name) {
  try {
    let flvPath = path.join(MEDIA_PATH, 'Frontend', 'Video', name + '.flv');
    fs.accessSync(flvPath);
    return flvPath;
  } catch (e) {}

  try {
    let mp4Path = path.join(MEDIA_PATH, 'Frontend', 'Video', name + '.mp4');
    fs.accessSync(mp4Path);
    return mp4Path;
  } catch (e) {}
}

exports.getFrontendVideoPath = getFrontendVideoPath;

function getSettingsPath(system) {
  return path.join(SETTINGS_PATH, system + '.ini');
}

exports.getSettingsPath = getSettingsPath;

function getSpecialImagePath(system, name) {
  try {
    let swfPath = path.join(MEDIA_PATH, system, 'Images', 'Special', name + '.swf');
    fs.accessSync(swfPath);
    return swfPath;
  } catch (e) {}

  try {
    let pngPath = path.join(MEDIA_PATH, system, 'Images', 'Special', name + '.png');
    fs.accessSync(pngPath);
    return pngPath;
  } catch (e) {}

  return null;
}

exports.getSpecialImagePath = getSpecialImagePath;

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
              }, 5000);

              resolve(path.join(process.cwd(), tmpPath));
            });
          });

          return;
        }
      }

      let error = new Error('File not found in zip: ' + prefix);
      error.name = 'FileNotFoundInZipError';
      reject(error);
    });

    zip.on('error', (error) => {
      reject(error);
    });
  });
}

exports.getTempFileFromZip = getTempFileFromZip;

function renderSpecialImage(el, system, name, attrs) {
  console.log(el, attrs);
  return new Promise((resolve) => {
    let imagePath = getSpecialImagePath(system, name);
    if (!imagePath) {
      resolve();
      return;
    }

    let extension = path.extname(imagePath).toLowerCase();
    if (extension === '.swf') {
      let swfImage = document.createElement('swf-image');
      swfImage.onload = () => {
        requestAnimationFrame(() => {
          let scaleX = window.innerWidth  / DEFAULT_SCREEN_WIDTH;
          let scaleY = window.innerHeight / DEFAULT_SCREEN_HEIGHT;
          let width  = swfImage.naturalWidth  * scaleX;
          let height = swfImage.naturalHeight * scaleY;
          let worldWidth  = swfImage.worldWidth  * scaleX;
          let worldHeight = swfImage.worldHeight * scaleY;
          let x = (attrs.x * scaleX) - (worldWidth  / 2);
          let y = (attrs.y * scaleY) - (worldHeight / 2);

          el.style.width  = width  + 'px';
          el.style.height = height + 'px';
          el.style.left = x + 'px';
          el.style.top  = y + 'px';
          el.style.transform = 'translate3d(0,0,0)';

          el.appendChild(swfImage);
          resolve({ el });
        });
      };

      swfImage.onerror = (error) => {
        console.error(error);
        resolve();
      };

      swfImage.src = imagePath;
    } else {
      let img = document.createElement('img');
      img.onload = () => {
        requestAnimationFrame(() => {
          let scaleX = window.innerWidth  / DEFAULT_SCREEN_WIDTH;
          let scaleY = window.innerHeight / DEFAULT_SCREEN_HEIGHT;
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

          el.appendChild(img);
          resolve({ el });
        });
      };

      img.onerror = (error) => {
        console.error(error);
        resolve();
      };

      img.src = imagePath;
    }
  });
}

exports.renderSpecialImage = renderSpecialImage;

function renderImage(el, system, game, component, attrs) {
  return new Promise((resolve) => {
    let zipPath = path.join(MEDIA_PATH, system, 'Themes', game + '.zip');
    getTempFileFromZip(zipPath, component).then((tmpPath) => {
      let extension = path.extname(tmpPath).toLowerCase();
      if (extension === '.swf') {
        let swfImage = document.createElement('swf-image');
        swfImage.onload = () => {
          requestAnimationFrame(() => {
            if (attrs) {
              let scaleX = window.innerWidth  / DEFAULT_SCREEN_WIDTH;
              let scaleY = window.innerHeight / DEFAULT_SCREEN_HEIGHT;
              let width  = swfImage.naturalWidth  * scaleX;
              let height = swfImage.naturalHeight * scaleY;
              let worldWidth  = swfImage.worldWidth  * scaleX;
              let worldHeight = swfImage.worldHeight * scaleY;
              let x = (attrs.x * scaleX) - (worldWidth  / 2);
              let y = (attrs.y * scaleY) - (worldHeight / 2);
              let rotate = attrs.r || 0;

              attrs.w = width;
              attrs.h = height;

              el.style.width  = width  + 'px';
              el.style.height = height + 'px';
              el.style.left = x + 'px';
              el.style.top  = y + 'px';
              el.style.transform = 'translate3d(0,0,0) rotate(' + rotate + 'deg)';
            }

            el.appendChild(swfImage);
            resolve({ el, attrs });
          });
        };

        swfImage.onerror = (error) => {
          console.error(error);
          resolve();
        };

        swfImage.src = tmpPath;
      } else {
        let img = document.createElement('img');
        img.onload = () => {
          requestAnimationFrame(() => {
            if (attrs) {
              let scaleX = window.innerWidth  / DEFAULT_SCREEN_WIDTH;
              let scaleY = window.innerHeight / DEFAULT_SCREEN_HEIGHT;
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
            }

            el.appendChild(img);
            resolve({ el, attrs });
          });
        };

        img.onerror = (error) => {
          console.error(error);
          resolve();
        };

        img.src = tmpPath;
      }
    }).catch((error) => {
      if (game !== 'default') {
        resolve(renderImage(el, system, 'default', component, attrs));
      } else {
        console.error(error);
        resolve();
      }
    });
  });
}

exports.renderImage = renderImage;

function loadVideoMetadata(el, src) {
  return new Promise((resolve, reject) => {
    el.onloadedmetadata = () => {
      let { videoWidth, videoHeight } = el;
      resolve({ videoWidth, videoHeight });
    };

    el.onerror = () => {
      reject();
    };

    el.src = src;
  });
}

exports.loadVideoMetadata = loadVideoMetadata;

function fitAspectRatio(width, height, aspectRatio) {
  return { width: width, height: Math.ceil(width / aspectRatio) };
}

function renderVideo(el, system, game, attrs) {
  return new Promise((resolve) => {
    let videoEl = el.querySelector('video-player');
    videoEl.dataset.forceaspect = attrs.forceaspect || 'none';
    videoEl.dataset.overlaybelow = attrs.overlaybelow;

    let src = path.join(MEDIA_PATH, system, 'Video', game + '.mp4');
    loadVideoMetadata(videoEl, src).then(({ videoWidth, videoHeight }) => {
      let totalBorderSize = (attrs.bsize || 0) + (attrs.bsize2 || 0) + (attrs.bsize3 || 0);
      let scaleX = window.innerWidth  / DEFAULT_SCREEN_WIDTH;
      let scaleY = window.innerHeight / DEFAULT_SCREEN_HEIGHT;
      let width  = (attrs.w * scaleX) - totalBorderSize;
      let height = (attrs.h * scaleY) - totalBorderSize;

      if (videoEl.dataset.forceaspect === 'none') {
        let aspectRatio = videoWidth / videoHeight;
        let fittedSize = fitAspectRatio(width, height, aspectRatio);
        width  = fittedSize.width;
        height = fittedSize.height;
      }

      let x = (attrs.x * scaleX) - (width  / 2);
      let y = (attrs.y * scaleY) - (height / 2);
      let rotate = attrs.r || 0;

      el.style.width  = width  + 'px';
      el.style.height = height + 'px';
      el.style.left = x + 'px';
      el.style.top  = y + 'px';
      el.style.transform = 'translate3d(0,0,0) rotate(' + rotate + 'deg)';
      el.dataset.below = attrs.below;

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
            resolve({ el, attrs });
          });
        };

        img.src = tmpPath;
      }).catch(() => resolve({ el, attrs }));

      renderBorder(el.querySelector('.border1'), attrs.bshape, attrs.bsize,  attrs.bcolor);
      renderBorder(el.querySelector('.border2'), attrs.bshape, attrs.bsize2, attrs.bcolor2);
      renderBorder(el.querySelector('.border3'), attrs.bshape, attrs.bsize3, attrs.bcolor3);
    }).catch(() => resolve({ el, attrs }));
  });
}

exports.renderVideo = renderVideo;

function renderBorder(el, shape, size, color) {
  el.style.borderRadius = '0';

  if (size === undefined || color === undefined) {
    el.style.border = 'none';
    el.style.left = '0';
    el.style.top = '0';
    return null;
  }

  if (shape !== undefined) {
    el.style.borderRadius = size + 'px';
  }

  el.style.border = size + 'px solid #' + parseColor(color);
  el.style.left = -size + 'px';
  el.style.top  = -size + 'px';
}

exports.renderBorder = renderBorder;

function renderTransition(el, attrs) {
  console.log(el, attrs);
  let baseTransform = el.style.transform;

  switch (attrs.start) {
    case 'top':
      el.style.transform += ' translateY(' + (-DEFAULT_SCREEN_HEIGHT - (attrs.y + attrs.h / 2)) + 'px)';
      break;
    case 'right':
      el.style.transform += ' translateX(' + (  DEFAULT_SCREEN_WIDTH - (attrs.x - attrs.w / 2)) + 'px)';
      break;
    case 'bottom':
      el.style.transform += ' translateY(' + ( DEFAULT_SCREEN_HEIGHT - (attrs.y - attrs.h / 2)) + 'px)';
      break;
    case 'left':
      el.style.transform += ' translateX(' + ( -DEFAULT_SCREEN_WIDTH - (attrs.x + attrs.w / 2)) + 'px)';
      break;
    case 'none':
      switch (attrs.type) {
        case 'grow':
          el.style.transform += ' scale(.0001)';
          break;
        case 'grow x':
          el.style.transform += ' scaleX(.0001)';
          break;
        case 'grow y':
          el.style.transform += ' scaleY(.0001)';
          break;
        case 'tv zoom out':
          el.style.transform += ' scale(4)';
          el.style.opacity = '.0001';
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
      el.style.opacity = '.0001';
      break;
    default:
      transitionTimingFunction = 'linear';
      break;
  }

  requestAnimationFrame(() => {
    el.style.transition = 'all ' + attrs.time + 's';
    el.style.transitionTimingFunction = transitionTimingFunction;
    el.style.transitionDelay = attrs.delay + 's';
    el.style.transform = baseTransform;
    el.style.opacity = '1';
  });
}

exports.renderTransition = renderTransition;
