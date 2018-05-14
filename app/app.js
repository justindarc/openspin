const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');

const ROOT_PATH = path.join(process.cwd(), 'HyperSpin');
const DATABASES_PATH = path.join(ROOT_PATH, 'Databases');
const MEDIA_PATH = path.join(ROOT_PATH, 'Media');

var wheelEl;

var gameList = [];

function renderMenu(name) {
  const dbPath = path.join(DATABASES_PATH, name, name + '.xml');

  fs.readFile(dbPath, 'utf8', (error, string) => {
    if (error) {
      console.error(error);
      return;
    }

    xml2js.parseString(string, (error, json) => {
      if (error) {
        console.error(error);
        return;
      }

      gameList = json.menu.game.map(game => game.$);

      wheelEl.itemCount = gameList.length;
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  let changeThemeTimeout = null;
  let wheelActiveTimeout = null;

  wheelEl = document.getElementById('wheel');

  wheelEl.addEventListener('render', (evt) => {
    let src = path.join(MEDIA_PATH, 'Main Menu', 'Images', 'Wheel', gameList[evt.detail.index].name + '.png');
    evt.detail.element.innerHTML = '<img src="' + src + '">';
  });

  wheelEl.addEventListener('change', (evt) => {
    let game = gameList[evt.detail.selectedIndex].name;

    clearTimeout(changeThemeTimeout);
    clearTimeout(wheelActiveTimeout);

    wheelEl.classList.add('active');

    changeThemeTimeout = setTimeout(() => {
      requestAnimationFrame(() => {
        let oldBackground = document.getElementById('background');
        oldBackground.style.opacity = 0;
        oldBackground.remove();

        let oldForeground = document.getElementById('foreground');
        oldForeground.style.opacity = 0;
        oldForeground.remove();

        let background = document.createElement('us-theme-background');
        background.id = 'background';
        background.system = 'Main Menu';
        background.game = game;
        background.style.opacity = 0;

        document.body.prepend(background);

        let foreground = document.createElement('us-theme-foreground');
        foreground.id = 'foreground';
        foreground.system = 'Main Menu';
        foreground.game = game;
        foreground.style.opacity = 0;

        document.body.append(foreground);

        requestAnimationFrame(() => {
          background.style.opacity = 1;
          foreground.style.opacity = 1;

          wheelActiveTimeout = setTimeout(() => {
            wheelEl.classList.remove('active');
          }, 500);
        });
      });
    }, 500);
  });

  renderMenu('Main Menu');
});
