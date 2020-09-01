const path = require('path')
const webpackMerge = require('webpack-merge')

module.exports = {
  title: 'Cozy UI React components',
  pagePerSection: true,
  sections: [
    {
      name: 'Bar',
      components: () => [
        '../react/BarButton/index.jsx',
        '../react/BarTitle/index.jsx'
      ]
    },
    {
      name: 'Basics',
      components: () => [
        '../react/Badge/index.jsx',
        '../react/Button/index.jsx',
        '../react/ButtonAction/index.jsx',
        '../react/Card/index.jsx',
        '../react/Chip/index.jsx',
        '../react/CompositeRow/index.jsx',
        '../react/Counter/index.jsx',
        '../react/DropdownButton/index.jsx',
        '../react/Icon/index.jsx',
        '../react/IconButton/index.jsx',
        '../react/IconStack/index.jsx',
        '../react/InlineCard/index.jsx',
        '../react/PercentageBar/index.jsx',
        '../react/PercentageLine/index.jsx',
        '../react/Spinner/index.jsx',
        '../react/Stack/index.jsx',
        '../react/ThresholdBar/index.jsx'
      ]
    },
    {
      name: 'Forms',
      components: () => [
        '../react/Checkbox/index.jsx',
        '../react/DateMonthPicker/index.jsx',
        '../react/Field/index.jsx',
        '../react/FileInput/index.jsx',
        '../react/Input/index.jsx',
        '../react/InputGroup/index.jsx',
        '../react/Label/index.jsx',
        '../react/NestedSelect/NestedSelect.jsx',
        '../react/Radio/index.jsx',
        '../react/SelectBox/SelectBox.jsx',
        '../react/Stepper/index.jsx',
        '../react/Textarea/index.jsx',
        '../react/MuiCozyTheme/Switch'
      ]
    },
    {
      name: 'Layout components',
      components: () => [
        '../react/Circle/index.jsx',
        '../react/MuiCozyTheme/Divider/index.jsx',
        '../react/Hero/index.jsx',
        '../react/hooks/useBreakpoints/index.jsx',
        '../react/Layout/Layout.jsx',
        '../react/NarrowContent/index.jsx',
        '../react/Page/index.jsx',
        '../react/SectionHeader/index.jsx',
        '../react/Sidebar/index.jsx',
        '../react/ViewStack/index.jsx'
      ]
    },
    {
      name: 'Content',
      components: () => [
        '../react/Accordion/index.jsx',
        '../react/AppTitle/index.jsx',
        '../react/Avatar/index.jsx',
        '../react/BottomDrawer/index.jsx',
        '../react/ContextHeader/index.jsx',
        '../react/Empty/index.jsx',
        '../react/Figure/Figure.jsx',
        '../react/Figure/FigureBlock.jsx',
        '../react/Filename/index.jsx',
        '../react/Infos/index.jsx',
        '../react/InfosCarrousel/index.jsx',
        '../react/LoadMore/index.jsx',
        '../react/Media/Media.jsx',
        '../react/MidEllipsis/index.jsx',
        '../react/Modal/index.jsx',
        '../react/OrderedList/index.jsx',
        '../react/Table/index.jsx',
        '../react/Text/index.jsx',
        '../react/Tooltip/index.jsx',
        '../react/UnorderedList/index.jsx',
        '../react/Well/index.jsx',
        '../react/Wizard/index.jsx'
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
        '../react/AppLinker/index.jsx',
        '../react/Breadcrumbs/index.jsx',
        '../react/Menu/index.jsx',
        '../react/Tabs/index.jsx'
      ]
    },
    {
      name: 'Special',
      components: () => [
        '../react/Alerter/index.jsx',
        '../react/AppIcon/index.jsx',
        '../react/AppSections/index.jsx',
        '../react/CipherIcon/index.jsx',
        '../react/CozyTheme/index.jsx',
        '../react/Overlay/index.jsx',
        '../react/PasswordExample/index.jsx',
        '../react/Popup/index.jsx',
        '../react/PopupOpener/index.jsx',
        '../react/PushClientBanner/index.jsx',
        '../react/PushClientButton/index.jsx',
        '../react/QuotaAlert/index.jsx',
        '../react/Viewer/index.jsx'
      ]
    },
    {
      name: 'Material-UI',
      components: () => [
        '../react/MuiCozyTheme/Buttons',
        '../react/MuiCozyTheme/ExpansionPanel',
        '../react/MuiCozyTheme/Grid',
        '../react/MuiCozyTheme/index.jsx',
        '../react/MuiCozyTheme/List',
        '../react/MuiCozyTheme/Menus',
        '../react/MuiCozyTheme/RaisedList',
        '../react/MuiCozyTheme/TextField'
      ]
    },
    {
      name: 'Labs',
      components: () => [
        '../react/Labs/GridItem',
        '../react/Labs/ExperimentalDialog',
        '../react/Labs/IconGrid',
        '../react/Labs/CollectionField',
        '../react/Labs/PasswordInput'
      ]
    },
    {
      name: 'Files',
      components: () => ['../react/HistoryRow', '../react/UploadQueue']
    },
    {
      name: 'Contacts',
      components: () => [
        '../react/ContactsList',
        '../react/ContactsListModal',
        '../react/ContactPicker'
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
    SectionsRenderer: path.join(__dirname, 'components/SectionsRenderer.jsx')
  },
  theme: {
    fontFamily: {
      base: 'Lato, sans-serif'
    }
  },
  webpackConfig: webpackMerge(require('./webpack.config.js'), {
    resolve: {
      alias: {
        'cozy-ui/transpiled/react': path.resolve(__dirname, '../react/'),
        'cozy-ui': path.join(__dirname, '..')
      }
    }
  }),
  serverPort: 6161,
  skipComponentsWithoutExample: true,
  styleguideDir: path.resolve(__dirname, '../build/react'),
  require: [
    path.join(__dirname, './style.styl'),
    path.join(__dirname, './styleguide.setup')
  ],
  exampleMode: 'collapse',
  usageMode: 'collapse',
  context: {
    utils: path.resolve(__dirname, 'utils'),
    isTesting: path.resolve(__dirname, '../helpers/isTesting'),
    content: path.resolve(__dirname, 'fixtures/content')
  }
}
