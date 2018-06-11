const Flag = require('./flag.js');
const Noise = require('./noise.js');
const Pixelate = require('./pixelate.js');

const StreamZip = require('node-stream-zip');

const electron = require('electron');
const fs = require('fs');
const path = require('path');
const tmp = require('tmp');
const xml2js = require('xml2js');

const PROCESS_PATH = electron.remote.getCurrentWindow().appPath;
const ROOT_PATH = path.join(PROCESS_PATH, 'HyperSpin');
const DATABASES_PATH = path.join(ROOT_PATH, 'Databases');
const MEDIA_PATH = path.join(ROOT_PATH, 'Media');
const SETTINGS_PATH = path.join(ROOT_PATH, 'Settings');

const DEFAULT_SCREEN_WIDTH = 1024;
const DEFAULT_SCREEN_HEIGHT = 768;

const TRANSITION_CHASE_PAUSE = 2000;

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
    .then((tmpFilePath) => fetchXml(tmpFilePath))
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

function getVideoPath(system, name) {
  try {
    let flvPath = path.join(MEDIA_PATH, system, 'Video', name + '.flv');
    fs.accessSync(flvPath);
    return flvPath;
  } catch (e) {}

  try {
    let mp4Path = path.join(MEDIA_PATH, system, 'Video', name + '.mp4');
    fs.accessSync(mp4Path);
    return mp4Path;
  } catch (e) {}

  if (system !== 'Frontend' || name !== 'No Video') {
    return getVideoPath('Frontend', 'No Video');
  }

  return null;
}

exports.getVideoPath = getVideoPath;

function getTempFilePath(pattern) {
  return new Promise((resolve, reject) => {
    tmp.tmpName({ template: path.join(PROCESS_PATH, 'tmp', pattern) }, (error, tmpFilePath) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(tmpFilePath);
    });
  });
}

exports.getTempFilePath = getTempFilePath;

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

          getTempFilePath('theme-XXXXXX' + extension).then((tmpFilePath) => {
            zip.extract(filename, tmpFilePath, (error) => {
              if (error) {
                reject(error);
                return;
              }

              // Cleanup temp file later.
              setTimeout(() => {
                fs.unlink(tmpFilePath, (error) => {
                  if (error) {
                    console.error(error);
                  }
                });
              }, 5000);

              resolve(tmpFilePath);
            });
          }).catch(error => reject(error));
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
    getTempFileFromZip(zipPath, component).then((tmpFilePath) => {
      let extension = path.extname(tmpFilePath).toLowerCase();
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
              el.style.transform = 'rotate(' + rotate + 'deg)';
            }

            el.appendChild(swfImage);
            resolve({ el, attrs });
          });
        };

        swfImage.onerror = (error) => {
          console.error(error);
          resolve();
        };

        swfImage.src = tmpFilePath;
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
              el.style.transform = 'rotate(' + rotate + 'deg)';
            }

            el.appendChild(img);
            resolve({ el, attrs });
          });
        };

        img.onerror = (error) => {
          console.error(error);
          resolve();
        };

        img.src = tmpFilePath;
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
    if (!src) {
      reject();
    }

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

    let src = getVideoPath(system, game);
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
      el.style.transform = 'rotate(' + rotate + 'deg)';
      el.dataset.below = attrs.below;

      let artworkEl = el.querySelector('.artwork');
      artworkEl.innerHTML = '';

      let zipPath = path.join(MEDIA_PATH, system, 'Themes', game + '.zip');
      getTempFileFromZip(zipPath, 'video').then((tmpFilePath) => {
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

            artworkEl.appendChild(img);
            resolve({ el, attrs });
          });
        };

        img.src = tmpFilePath;
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
  let baseTransform = el.style.transform;
  let keyframes = [];
  let options = {
    delay: (attrs.delay || 0) * 1000,
    duration: (attrs.time || 0) * 1000,
    easing: 'linear',
    fill: 'forwards'
  };

  let flag;
  let noise;
  let pixelate;

  switch (attrs.start) {
    case 'top':
      keyframes.push({ transform: baseTransform + ' translateY(' + (-(attrs.y + attrs.h)) + 'px)' });
      break;
    case 'right':
      keyframes.push({ transform: baseTransform + ' translateX(' + (DEFAULT_SCREEN_WIDTH  - (attrs.x - attrs.w)) + 'px)' });
      break;
    case 'bottom':
      keyframes.push({ transform: baseTransform + ' translateY(' + (DEFAULT_SCREEN_HEIGHT - (attrs.y - attrs.h)) + 'px)' });
      break;
    case 'left':
      keyframes.push({ transform: baseTransform + ' translateX(' + (-(attrs.x + attrs.w)) + 'px)' });
      break;
    case 'none':
      switch (attrs.type) {
        case 'blur':
          keyframes.push({ transform: baseTransform, opacity: '.0001', filter: 'blur(20px)' });
          keyframes.push({ transform: baseTransform, opacity: '1',     filter: 'blur(0)' });
          break;
        case 'fade':
          keyframes.push({ transform: baseTransform, opacity: '.0001' });
          break;
        case 'flag':
          keyframes.push({ transform: baseTransform, opacity: '.0001' });

          flag = new Flag(el.querySelector('img'));
          break;
        case 'flip':
          keyframes.push({ transform: baseTransform + ' rotateY(90deg)' });
          break;
        case 'grow':
          keyframes.push({ transform: baseTransform + ' scale(.0001)' });
          break;
        case 'grow bounce':
          keyframes.push({ transform: baseTransform + ' scale(.0001)' });

          options.easing = 'cubic-bezier(.25,1.5,.5,2)';
          break;
        case 'grow center shrink':
          keyframes.push({ transform: baseTransform +
            ' translate(' +
              (-attrs.x + (DEFAULT_SCREEN_WIDTH  / 2)) + 'px,' +
              (-attrs.y + (DEFAULT_SCREEN_HEIGHT / 2)) + 'px)' +
            ' scale(.0001)' });
          keyframes.push({ transform: baseTransform +
            ' translate(' +
              (-attrs.x + (DEFAULT_SCREEN_WIDTH  / 2)) + 'px,' +
              (-attrs.y + (DEFAULT_SCREEN_HEIGHT / 2)) + 'px)' +
            ' scale(2.5)', offset: .2 });
          keyframes.push({ transform: baseTransform +
            ' translate(' +
              (-attrs.x + (DEFAULT_SCREEN_WIDTH  / 2)) + 'px,' +
              (-attrs.y + (DEFAULT_SCREEN_HEIGHT / 2)) + 'px)' +
            ' scale(2.5)', offset: .8 });
          keyframes.push({ transform: baseTransform });
          break;
        case 'grow x':
          keyframes.push({ transform: baseTransform + ' scaleX(.0001)' });
          break;
        case 'grow y':
          keyframes.push({ transform: baseTransform + ' scaleY(.0001)' });
          break;
        case 'none':
          keyframes.push({ transform: baseTransform, visibility: 'hidden' });
          break;
        case 'pixelate':
          keyframes.push({ transform: baseTransform, opacity: '.0001' });

          pixelate = new Pixelate(el.querySelector('img'));
          pixelate.amount = 1;
          break;
        case 'pixelate zoom out':
          keyframes.push({ transform: baseTransform + ' scale(2)', opacity: '.0001' });

          pixelate = new Pixelate(el.querySelector('img'));
          pixelate.amount = 1;
          break;
        case 'pump':
          keyframes.push({ transform: baseTransform + ' scale(.125)',  offset: 0 });
          keyframes.push({ transform: baseTransform + ' scale(.375)',  offset: .2 });
          keyframes.push({ transform: baseTransform + ' scale(.25)',   offset: .25 });
          keyframes.push({ transform: baseTransform + ' scale(.625)',  offset: .45 });
          keyframes.push({ transform: baseTransform + ' scale(.5)',    offset: .5 });
          keyframes.push({ transform: baseTransform + ' scale(.875)',  offset: .7 });
          keyframes.push({ transform: baseTransform + ' scale(.75)',   offset: .75 });
          keyframes.push({ transform: baseTransform + ' scale(1.125)', offset: .95 });
          keyframes.push({ transform: baseTransform + ' scale(1)',     offset: 1 });
          break;
        case 'strobe':
          keyframes.push({ transform: baseTransform, opacity: '.0001' });

          let strobes = (attrs.time || 0) * 4;
          let opacityPerKeyframe = 1 / strobes;
          let opacity = 0;
          for (let i = 0; i < strobes; i++) {
            opacity += opacityPerKeyframe;
            keyframes.push({ transform: baseTransform, opacity: '.0001',      offset: opacity - opacityPerKeyframe + .0001 });
            keyframes.push({ transform: baseTransform, opacity: '.0001',      offset: opacity - (opacityPerKeyframe / 2) });
            keyframes.push({ transform: baseTransform, opacity: '' + opacity, offset: opacity - (opacityPerKeyframe / 2) + .0001 });
            keyframes.push({ transform: baseTransform, opacity: '' + opacity, offset: opacity });
          }

          keyframes.push({ transform: baseTransform, opacity: '1' });
          break;
        case 'sweep left':
          keyframes.push({ transform: baseTransform + ' translateX(' + (-(attrs.x + attrs.w)) + 'px)' });
          keyframes.push({ transform: baseTransform + ' translateX(' + (DEFAULT_SCREEN_WIDTH  - (attrs.x - attrs.w)) + 'px)', offset: .5 });
          keyframes.push({ transform: baseTransform + ' translateY(' + (-(attrs.y + attrs.h)) + 'px)', offset: .50001 });
          keyframes.push({ transform: baseTransform });
          break;
        case 'tv':
          keyframes.push({ transform: baseTransform, opacity: '.0001' });

          noise = new Noise(document.createElement('img'), { width: attrs.w, height: attrs.h });
          noise.el.style.position = 'absolute';
          noise.el.style.zIndex = '3';
          el.prepend(noise.el);
          break;
        case 'tv zoom out':
          keyframes.push({ transform: baseTransform + ' scale(4)', opacity: '.0001' });

          noise = new Noise(document.createElement('img'), { width: attrs.w, height: attrs.h });
          noise.el.style.position = 'absolute';
          noise.el.style.zIndex = '3';
          el.prepend(noise.el);
          break;
        case 'zoom out':
          keyframes.push({ transform: baseTransform + ' scale(4)', opacity: '.0001' });
          break;
        default:
          break;
      }
      break;
    default:
      break;
  }

  switch (attrs.type) {
    case 'chase':
      options.duration = (options.duration + TRANSITION_CHASE_PAUSE) * 2;
      options.iterations = Infinity;

      let delayOffset = TRANSITION_CHASE_PAUSE / options.duration;
      options.iterationStart = delayOffset;

      keyframes = [
        { transform: baseTransform + ' translateX(' + (-(attrs.x + attrs.w)) + 'px)' },
        { transform: baseTransform + ' translateX(' + (-(attrs.x + attrs.w)) + 'px)', offset: .00001 + delayOffset },
        { transform: baseTransform + ' translateX(' + (DEFAULT_SCREEN_WIDTH - (attrs.x - attrs.w)) + 'px)', offset: .5 },
        { transform: baseTransform + ' translateX(' + (DEFAULT_SCREEN_WIDTH - (attrs.x - attrs.w)) + 'px) rotateY(180deg)', offset: .50001 + delayOffset },
        { transform: baseTransform + ' translateX(' + (-(attrs.x + attrs.w)) + 'px) rotateY(180deg)' }
      ];
      break;
    case 'ease':
      options.easing = 'ease';
      break;
    case 'elastic bounce':
      options.easing = 'cubic-bezier(.25,1.5,.5,2)';
      break;
    case 'fade':
      options.easing = 'linear';
      if (keyframes.length > 0) {
        keyframes[0].opacity = '.0001';
      }
      break;
    default:
      break;
  }

  // If there are no keyframes, this transition is not supported.
  if (keyframes.length === 0) {
    console.log('Unsupported transition', el, attrs);
    return;
  }

  // If there is only one keyframe, this is a finite transition
  // and it needs its "landing" keyframe added.
  else if (keyframes.length === 1) {
    if (keyframes[0].opacity) {
      keyframes.push({ transform: baseTransform + ' scale(1)', opacity: '1' });
    } else if (keyframes[0].visibility) {
      keyframes.push({ transform: baseTransform + ' scale(1)', visibility: 'visible' });
    } else {
      keyframes.push({ transform: baseTransform + ' scale(1)' });
    }
  }

  let firstKeyframe = keyframes[0];
  for (let property in firstKeyframe) {
    el.style[property] = firstKeyframe[property];
  }

  let animation = el.animate(keyframes, options);
  animation.pause();

  requestAnimationFrame(() => {
    if (flag) {
      setTimeout(() => {
        flag.animate(0, options.duration);
      }, options.delay);
    }

    if (noise) {
      setTimeout(() => {
        let noiseAnimation = noise.el.animate([
          { opacity: '1' }, { opacity: '0' }
        ], {
          duration: options.duration,
          easing: 'linear',
          fill: 'forwards'
        });

        noiseAnimation.onfinish = () => {
          noise.pause();
          noise.el.remove();
        };

        noiseAnimation.play();
      }, options.delay + 2000);
    }

    if (pixelate) {
      setTimeout(() => {
        pixelate.animate(0, options.duration);
      }, options.delay);
    }

    animation.play();
  });
}

exports.renderTransition = renderTransition;
