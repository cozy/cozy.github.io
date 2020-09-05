site_name: Cozy Developer Documentation
docs_dir: src
site_url: https://docs.cozy.io/
site_dir: docs/en
site_favicon: img/favicon.png
repo_url: https://github.com/cozy/cozy.github.io/
edit_uri: edit/dev/src/
site_description: Cozy documentation
site_author: CozyCloud - https://cozy.io
extra_css:
- css/extra.css
extra_javascript:
- extra.js
nav:
- Home: index.md
- Tutorials:
  - Create Your Application: tutorials/app.md
  - Develop a Connector:
    - Introduction: tutorials/konnector/index.md
    - Basic structure: tutorials/konnector/getting-started.md
    - Scrape data: tutorials/konnector/scrape-data.md
    - Save data: tutorials/konnector/save-data.md
    - Package your connector: tutorials/konnector/packaging.md
  - Self-Host on Debian: tutorials/selfhost-debian.md
- How-to:
  - Dev:
    - Run an App in a Cozy using Docker: howTos/dev/runCozyDocker.md
    - Develop a service from your application: howTos/dev/services.md
    - Use Hot Module Replacement in Your App: howTos/dev/hmr.md
    - Make a Mobile App Using Cordova: howTos/dev/cordova.md
    - Connect a Mobile App to Your Local Stack: howTos/dev/connect-mobile-app-local-stack.md
    - Send and Receive E-mails in Development: howTos/dev/sendmail.md
    - Our Front-End Git Flow: references/git-flow.md
    - Technical introduction to the Cozy platform: references/tech-intro.md
  - Synchronize:
    - Install Cozy Drive on GNU/Linux: howTos/sync/linux.md
- Libraries:
  - Develop an application:
    - Access data (client): <cozy-client>
    - Build a UI (ui): <cozy-ui>
    - Define data (doctypes): <cozy-doctypes>
    - Advanced:
      - Realtime data (realtime): <cozy-realtime>
      - Native devices (device-helper): <cozy-device-helper>
  - Develop a konnector:
    - Scrape data (konnector-libs): <cozy-konnector-libs>
    - konitor: <konitor>
  - Publish on the store (app-publish): <cozy-app-publish>
  - Dev tools:
    - Babel preset: <babel-preset-cozy-app>
    - Commitlint: <commitlint-config-cozy>
    - ESLint: <eslint-config-cozy-app>
    - ACH: <ach>
  - Advanced:
    - Stack server: <cozy-stack>
    - Registry server: <cozy-apps-registry>
- Applications:
  - Cozy Banks: <cozy-banks>
theme:
  custom_dir: cozy-theme
  name: material
  palette:
    primary: blue
    accent: blue
  logo:
    icon: cloud
  font:
    text: Lato
    code: Ubuntu Mono
  feature:
    tabs: true
markdown_extensions:
- admonition
- codehilite
- extra
- footnotes
- meta
- sane_lists
- smarty
- toc:
    permalink: true
- markdown_sphinxjs:
    directory: /tmp/cozy_docs
    jsdoc_cache: /tmp/jsdoc_data_cache.json
extra:
  search:
    tokenizer: "[^a-z\u0430-\u044F\u04510-9\\-\\.]"
