const { ipcRenderer } = require('electron');

function getContentWindows(iframeIds) {
  let iframes = iframeIds.map(id => document.getElementById(id));
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

function getQueryParams() {
  let result = {};

  window.location.search.substring(1).split('&')
    .map(paramString => paramString.split('='))
    .forEach(paramPair => result[paramPair[0]] = paramPair[1]);

  return result;
}

document.addEventListener('DOMContentLoaded', () => {
  const queryParams = getQueryParams();

  getContentWindows(['gfx', 'player']).then((contentWindows) => {
    let [gfxWindow, playerWindow] = contentWindows;

    let easel = gfxWindow.createEasel();
    gfxWindow.createEaselHost(playerWindow);

    let params = {
      baseUrl: document.location.href,
      url: queryParams.path,
      movieParams: {},
      objectParams: {/*wmode: 'transparent'*/},
      compilerSettings: {
        sysCompiler: true,
        appCompiler: true,
        verifier: true
      },
      displayParameters: easel.getDisplayParameters()
    };

    playerWindow.runSwfPlayer(params, null, gfxWindow);

    onFirstFrame(gfxWindow, playerWindow).then((player) => {
      let naturalWidth = player.stage.stageWidth;
      let naturalHeight = player.stage.stageHeight;
      let worldWidth = player.stage.width;
      let worldHeight = player.stage.height;

      ipcRenderer.sendToHost('render', {
        queryParams,
        naturalWidth,
        naturalHeight,
        worldWidth,
        worldHeight
      });

      document.body.innerHTML = '';

      contentWindows = gfxWindow = playerWindow = easel = params = null;
    });
  }).catch(() => ipcRenderer.sendToHost('error'));
});
