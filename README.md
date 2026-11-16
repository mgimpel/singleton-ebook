<div align="center">
  <img src="public/icon.svg" role="img" width="200" alt="Singleton Ebook Logo"/>
<br>

[![license][badge-license]][link-license] [![OS][badge-platforms]][link-website]
<br>
[![pnpm version][badge-pnpm]][link-pnpm] [![node version][badge-node]][link-node] [![tauri version][badge-tauri]][link-tauri] [![vite version][badge-vite]][link-vite] [![react version][badge-react]][link-react] [![mantine version][badge-mantine]][link-mantine]
</div>

# Singleton Ebook

The Singleton Ebook project aims de develop a lightweight Ebook reader for a single book, so that the Book can be installed as an app.

It is targeted primarily at mobile phones and tablets (Android, iPhone, iPad). Desktop (Windows, Mac, Linux) and web access.

The application is built on:

- [Tauri](https://tauri.app/) Cross-platform framework
- [Vite](https://vite.dev/) Frontend toolong
- [React](https://react.dev/) React framework
- [Mantine](https://mantine.dev/) React component library
- [foliate-js](https://github.com/johnfactotum/foliate-js) Javascript library to render EBooks

## Test, Build and run

Make sure you have installed the prerequisites for your OS: https://tauri.app/start/prerequisites/.

### Checkout the code

```bash
git clone https://github.com/mgimpel/singleton-ebook.git
git submodule update --init
```

### Desktop (Windows, Mac and Linux) build and run

```bash
cd singleton-ebook
pnpm install
pnpm tauri dev   # to run
pnpm tauri build # to build
```

[badge-license]: https://img.shields.io/github/license/mgimpel/singleton-ebook?color=blue
[badge-platforms]: https://img.shields.io/badge/platforms-macOS%2C%20Windows%2C%20Linux%2C%20Android%2C%20iOS%2C%20Web-green
[badge-pnpm]: https://img.shields.io/badge/pnpm-%E2%89%A512-F69220?logo=pnpm&logoColor=white
[badge-node]: https://img.shields.io/node/v/vite?logo=nodedotjs&logoColor=white
[badge-tauri]: https://img.shields.io/badge/tauri-%E2%89%A52-blue?logo=tauri&logoColor=white
[badge-vite]: https://img.shields.io/badge/vite-%E2%89%A58.3-8A2BE2?logo=vite&logoColor=white
[badge-react]: https://img.shields.io/badge/react-%E2%89%A519.3-blue?logo=react&logoColor=white
[badge-mantine]: https://img.shields.io/badge/mantine-%E2%89%A59.8-blue?logo=mantine&logoColor=white
[link-license]: https://github.com/mgimpel/singleton-ebook?tab=BSD-3-Clause-1-ov-file
[link-website]: https://github.com/mgimpel/singleton-ebook
[link-pnpm]: https://pnpm.io/
[link-node]: https://nodejs.org/en/about/previous-releases
[link-tauri]: https://tauri.app/
[link-vite]: https://vite.dev/
[link-react]: https://react.dev/
[link-mantine]: https://mantine.dev/
