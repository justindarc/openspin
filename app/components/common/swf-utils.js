function getSwfInfo(path) {
  return new Promise((resolve, reject) => {
    let webView = document.createElement('webview');
    webView.preload = './components/shumway/swf-info.js';
    webView.src = './components/shumway/swf-info.html?path=' + path;
    webView.style.visibility = 'hidden';

    webView.addEventListener('ipc-message', (evt) => {
      if (evt.channel !== 'render') {
        if (evt.channel === 'error') {
          webView.remove();
          reject();
        }

        return;
      }

      webView.remove();

      let swfInfo = evt.args[0];
      resolve(swfInfo);
    });

    document.body.appendChild(webView);
  });
}

exports.getSwfInfo = getSwfInfo;

function createSwfObject(path) {
  return getSwfInfo(path).then((swfInfo) => {
    let object = document.createElement('object');
    object.data = path;
    object.width  = swfInfo.naturalWidth;
    object.height = swfInfo.naturalHeight;

    let scaleParam = document.createElement('param');
    scaleParam.name = 'scale';
    scaleParam.value = 'exactfit';
    object.appendChild(scaleParam);

    let wmodeParam = document.createElement('param');
    wmodeParam.name = 'wmode';
    wmodeParam.value = 'transparent';
    object.appendChild(wmodeParam);

    return [object, swfInfo];
  }).catch(() => console.error('Unable to get SWF info', path));
}

exports.createSwfObject = createSwfObject;
