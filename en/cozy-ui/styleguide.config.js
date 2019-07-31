const path = require('path')
const webpackMerge = require('webpack-merge')

module.exports = {
  title: 'Cozy UI React components',
  sections: [
    {
      name: 'Bar',
      components: () => ['../react/BarButton/index.jsx']
    },
    {
      name: 'Basics',
      components: () => [
        '../react/Badge/index.jsx',
        '../react/Button/index.jsx',
        '../react/ButtonAction/index.jsx',
        '../react/Card/index.jsx',
        '../react/InlineCard/index.jsx',
        '../react/Chip/index.jsx',
        '../react/Icon/index.jsx',
        '../react/Spinner/index.jsx',
        '../react/Counter/index.jsx',
        '../react/PercentageLine/index.jsx',
        '../react/Stack/index.jsx'
      ]
    },
    {
      name: 'Forms',
      components: () => [
        '../react/Checkbox/index.jsx',
        '../react/Field/index.jsx',
        '../react/Input/index.jsx',
        '../react/InputGroup/index.jsx',
        '../react/Label/index.jsx',
        '../react/Radio/index.jsx',
        '../react/SelectBox/SelectBox.jsx',
        '../react/Textarea/index.jsx',
        '../react/Toggle/index.jsx',
        '../react/FileInput/index.jsx'
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
        '../react/Infos/index.jsx',
        '../react/ContextHeader/index.jsx',
        '../react/Filename/index.jsx',
        '../react/AppTitle/index.jsx',
        '../react/Figure/Figure.jsx',
        '../react/Figure/FigureBlock.jsx'
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
        '../react/Tabs/index.jsx',
        '../react/AppLinker/index.jsx'
      ]
    },
    {
      name: 'Special',
      components: () => [
        '../react/Overlay/index.jsx',
        '../react/Alerter/index.jsx',
        '../react/Popup/index.jsx',
        '../react/PopupOpener/index.jsx',
        '../react/PushClientButton/index.jsx',
        '../react/PushClientBanner/index.jsx',
        '../react/Viewer/index.jsx',
        '../react/AppSections/index.jsx',
        '../react/AppIcon/index.jsx'
      ]
    },
    {
      name: 'Material-UI',
      components: () => [
        '../react/MuiCozyTheme/index.jsx',
        '../react/MuiCozyTheme/Buttons',
        '../react/MuiCozyTheme/Menus',
        '../react/MuiCozyTheme/List',
        '../react/MuiCozyTheme/ExpansionPanel'
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
  styleguideComponents: {
    SectionsRenderer: path.join(__dirname, 'IconSpriteInjector.jsx')
  },
  theme: {
    fontFamily: {
      base: 'Lato, sans-serif'
    }
  },
  webpackConfig: webpackMerge(require('./webpack.config.js'), {
    resolve: {
      alias: {
        'cozy-ui': path.join(__dirname, '..')
      }
    }
  }),
  serverPort: 6161,
  skipComponentsWithoutExample: true,
  styleguideDir: path.resolve(__dirname, '../build/react'),
  require: [
    path.join(__dirname, './style.styl'),
    'style-loader!css-loader!' +
      path.join(__dirname, '../transpiled/react/stylesheet.css'),
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
