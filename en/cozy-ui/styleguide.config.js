const path = require('path')

const webpackMerge = require('webpack-merge')

module.exports = {
  title: 'Cozy UI React components',
  pagePerSection: true,
  sections: [
    {
      name: 'Cozy-ui documentation',
      components: () => ['../docs/components/Readme']
    },
    {
      name: 'Core',
      components: () => [
        '../react/Accordion',
        '../react/Alert',
        '../react/AppTitle',
        '../react/Avatar',
        '../react/Badge',
        '../react/Breadcrumbs',
        '../react/Buttons',
        '../react/Checkbox',
        '../react/Chips',
        '../react/CircularProgress',
        '../react/Dialog',
        '../react/Divider',
        '../react/DropdownButton',
        '../react/DropdownText',
        '../react/Empty',
        '../react/Fab',
        '../react/Grid',
        '../react/Icon',
        '../react/IconButton',
        '../react/Labs/IconGrid',
        '../react/LinearProgress',
        '../react/List',
        '../react/ListItem',
        '../react/ListItemText',
        '../react/ListSubheader',
        '../react/Menu',
        '../react/Paper',
        '../react/PasswordField',
        '../react/PointerAlert',
        '../react/ProgressionBanner',
        '../react/Radios',
        '../react/SearchBar',
        '../react/Skeletons',
        '../react/Snackbar',
        '../react/Stepper',
        '../react/MobileStepper',
        '../react/Switch',
        '../react/Tabs',
        '../react/TextField',
        '../react/ToggleButton',
        '../react/ToggleButtonGroup',
        '../react/Tooltip',
        '../react/Typography',
        '../react/Markdown'
      ]
    },
    {
      name: 'Extra',
      components: () => [
        '../react/ActionsBar',
        '../react/ActionsMenu',
        '../react/BottomSheet',
        '../react/CozyDialogs',
        '../react/CozyDialogs/SpecificDialogs',
        '../react/EditBadge',
        '../react/DatePicker',
        '../react/HistoryRow',
        '../react/Layout/Layout.jsx',
        '../react/MidEllipsis',
        '../react/NavigationList',
        '../react/NestedSelect/NestedSelect.jsx',
        '../react/Sidebar',
        '../react/Table'
      ]
    },
    {
      name: 'Providers',
      components: () => [
        '../react/providers/Alert',
        '../react/providers/Breakpoints',
        '../react/providers/ConfirmDialog',
        '../react/providers/CozyTheme',
        '../react/providers/Selection'
      ]
    },
    {
      name: 'Hooks',
      components: () => [
        '../react/hooks/useBrowserOffline.jsx',
        '../react/hooks/useConfirmExit/index.jsx',
        '../react/hooks/useCycle.jsx',
        '../react/hooks/useEventListener.js',
        '../react/hooks/usePeriodicRender.js',
        '../react/hooks/useScroll.jsx'
      ]
    },
    {
      name: 'Legacy',
      components: () => [
        '../react/BarTitle',
        '../react/legacy/Breadcrumbs',
        '../react/DateMonthPicker',
        '../react/Filename',
        '../react/FilePath',
        '../react/FilePathLink',
        '../react/FileInput',
        '../react/legacy/Input',
        '../react/InputGroup',
        '../react/LoadMore',
        '../react/Labs/PasswordInput',
        '../react/SelectBox/SelectBox.jsx',
        '../react/Spinner',
        '../react/Stack',
        '../react/UnorderedList'
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
          href: 'https://fonts.googleapis.com/css?family=Inter:400,500,600'
        }
      ]
    }
  },
  styleguideComponents: {
    SectionsRenderer: path.join(__dirname, 'components/SectionsRenderer.jsx'),
    TableOfContentsRenderer: path.join(
      __dirname,
      'components/TableOfContentsRenderer.jsx'
    ),
    Wrapper: path.join(__dirname, 'components/Wrapper')
  },
  theme: {
    fontFamily: {
      base: 'sans-serif'
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
    isTesting: path.resolve(__dirname, '../react/helpers/isTesting'),
    content: path.resolve(__dirname, 'fixtures/content')
  },
  styles: {
    Playground: {
      preview: {
        padding: 0
      }
    }
  }
}
