const { ViewController } = require('../components/view-element.js');

const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');

const ROOT_PATH = path.join(process.cwd(), 'HyperSpin');
const DATABASES_PATH = path.join(ROOT_PATH, 'Databases');
const MEDIA_PATH = path.join(ROOT_PATH, 'Media');

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

        let gameList = json.menu.game.map(game => game.$);
        resolve(gameList);
      });
    });
  });
}

class WheelViewController extends ViewController {
  constructor(view, system) {
    super(view);

    this.system = system;

    this.background = view.querySelector('us-theme-background');
    this.foreground = view.querySelector('us-theme-foreground');
    this.wheel = view.querySelector('us-wheel');

    this.gameList = [];

    let changeThemeTimeout = null;
    let wheelActiveTimeout = null;

    this.wheel.addEventListener('render', (evt) => {
      let src = path.join(MEDIA_PATH, this.system, 'Images', 'Wheel', this.gameList[evt.detail.index].name + '.png');
      evt.detail.element.innerHTML = '<img src="' + src + '">';
    });

    this.wheel.addEventListener('change', (evt) => {
      let game = this.gameList[evt.detail.selectedIndex].name;

      clearTimeout(changeThemeTimeout);
      clearTimeout(wheelActiveTimeout);

      this.wheel.classList.add('active');

      changeThemeTimeout = setTimeout(() => {
        requestAnimationFrame(() => {
          let oldBackground = this.background;
          oldBackground.style.opacity = 0;
          oldBackground.remove();

          let oldForeground = this.foreground;
          oldForeground.style.opacity = 0;
          oldForeground.remove();

          this.background = document.createElement('us-theme-background');
          this.background.system = this.system;
          this.background.game = game;
          this.background.style.opacity = 0;

          this.view.prepend(this.background);

          this.foreground = document.createElement('us-theme-foreground');
          this.foreground.system = this.system;
          this.foreground.game = game;
          this.foreground.style.opacity = 0;

          this.view.append(this.foreground);

          requestAnimationFrame(() => {
            this.background.style.opacity = 1;
            this.foreground.style.opacity = 1;

            wheelActiveTimeout = setTimeout(() => {
              this.wheel.classList.remove('active');
            }, 500);
          });
        });
      }, 500);
    });

    this.wheel.addEventListener('select', (evt) => {
      let game = this.gameList[evt.detail.selectedIndex].name;
      // TODO: Determine if the selected item is another system or a game.
      this.onGameSelect(game);
      this.onSystemSelect(game);
    });

    this.wheel.addEventListener('exit', () => {
      this.onExit();
    });

    getGameList(this.system).then((gameList) => {
      this.gameList = gameList;
      this.wheel.itemCount = this.gameList.length;
    });
  }

  onGameSelect(game) {}
  onSystemSelect(system) {}
  onExit() {}
}

module.exports = WheelViewController;
