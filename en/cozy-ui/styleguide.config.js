const path = require('path')

module.exports = {
  title: 'Cozy UI React components',
  sections: [
    {
      name: 'Material-UI',
      components: () => [
        '../react/MuiCozyTheme/index.jsx',
        '../react/MuiCozyTheme/Buttons',
        '../react/MuiCozyTheme/Menus'
      ]
    },
    {
      name: 'Basics',
      components: () => [
        '../react/Badge/index.jsx',
        '../react/Button/index.jsx',
        '../react/ButtonAction/index.jsx',
        '../react/Chip/index.jsx',
        '../react/Icon/index.jsx',
        '../react/Spinner/index.jsx',
        '../react/Counter/index.jsx'
      ]
    },
    {
      name: 'Forms',
      components: () => [
        '../react/Checkbox/index.jsx',
        '../react/Field/index.jsx',
        '../react/Input/index.jsx',
        '../react/Label/index.jsx',
        '../react/Radio/index.jsx',
        '../react/SelectBox/SelectBox.jsx',
        '../react/Textarea/index.jsx',
        '../react/Toggle/index.jsx'
      ]
    },
    {
      name: 'Layout',
      components: () => [
        '../react/Layout/Layout.jsx',
        '../react/Hero/index.jsx',
        '../react/Sidebar/index.jsx',
        '../react/Circle/index.jsx'
      ]
    },
    {
      name: 'Content',
      components: () => [
        '../react/Avatar/index.jsx',
        '../react/Media/Media.jsx',
        '../react/MidEllipsis/index.jsx',
        '../react/Modal/index.jsx',
        '../react/Accordion/index.jsx',
        '../react/Text/index.jsx',
        '../react/Empty/index.jsx',
        '../react/Well/index.jsx',
        '../react/ContextHeader/index.jsx'
      ]
    },
    {
      name: 'Intents',
      components: () => [
        '../react/IntentIframe/IntentIframe.jsx',
        '../react/IntentModal/IntentModal.jsx',
        '../react/IntentOpener/IntentOpener.jsx'
      ]
    },
    {
      name: 'List',
      components: () => ['../react/ListItemText/index.jsx']
    },
    {
      name: 'Navigation',
      components: () => [
        '../react/ActionMenu/index.jsx',
        '../react/Menu/index.jsx',
        '../react/Tabs/index.jsx'
      ]
    },
    {
      name: 'Special',
      components: () => [
        '../react/Overlay/index.jsx',
        '../react/Alerter/index.jsx',
        '../react/PopupOpener/index.jsx'
      ]
    }
  ],
  components: '../react/**/*.jsx',
  template: {
    head: {
      meta: [
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1.0'
        }
      ],
      links: [
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css?family=Lato:400,700,300'
        }
      ]
    }
  },
  theme: {
    fontFamily: {
      base: 'Lato, sans-serif'
    }
  },
  webpackConfig: require('./webpack.config.js'),
  serverPort: 6161,
  skipComponentsWithoutExample: true,
  styleguideDir: path.resolve(__dirname, '../build/react'),
  require: [
    path.join(__dirname, './style.styl'),
    'style-loader!css-loader!' + path.join(__dirname, '../transpiled/stylesheet.css'),
    path.join(__dirname, './styleguide.setup')
  ],
  exampleMode: 'collapse',
  usageMode: 'collapse',
  context: {
    utils: path.resolve(__dirname, 'utils'),
    isTesting: path.resolve(__dirname, 'false'),
    content: path.resolve(__dirname, 'fixtures/content')
  }
}
