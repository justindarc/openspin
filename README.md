
<p align="center"><img src="logo/OpenSpin3.png" alt="OpenSpin" height="150px"></p>

# OpenSpin

An open source drop-in replacement for [HyperSpin](http://hyperspin-fe.com/), a big screen front-end system for launching games and other media

### Dependencies

OpenSpin uses [Electron.js](https://electronjs.org/) which enables it to be built using web technologies running in [Chromium](https://www.chromium.org/) and deployed across all major desktop platforms. It also relies on [NPM](https://www.npmjs.com/) for package management. To get started, clone this repository, then from its directory run:

```bash
npm install
```

Since many HyperSpin themes and assets rely on [Flash](https://en.wikipedia.org/wiki/Adobe_Flash), it is necessary to utilize the [Pepper Flash plugin](https://electronjs.org/docs/tutorial/using-pepper-flash-plugin) which can be found by installing [Google Chrome](https://www.google.com/chrome/) and navigating to `chrome://plugins`.

Copy the Pepper Flash plugin from a working Google Chrome browser installation and place it in the appropriate folder within the `./plugins/PepperFlash` directory in this repository. For 32-bit operating systems, use the `ia32` directory and for 64-bit operating systems, use the `x64` directory.

### Running

While this project is still in early development, it is currently necessary to place an existing HyperSpin installation within the root directory of this repository. The correct folder structure should be as follows:

```
openspin/
|-- app/
|-- HyperSpin/        <-- Copy existing HyperSpin installation here
    |-- Databases/
    |-- Media/
    |-- Settings/
    |-- HyperSpin.exe
    |-- ...
|-- node_modules/
|-- plugins/
|-- tmp/
|-- LICENSE
|-- main.js
|-- package.json
|-- README.md
```

NOTE: This is just a temporary solution and will likely change in the near future to something far more convenient.

Once the `HyperSpin` folder is placed within the root of this repository, the application can be started in development mode by running:

```bash
npm start
```

### Building

To build an application executable for distribution, run:

```bash
npm run build
```

### License

MIT License
