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
        '../react/AppIcon',
        '../react/AppLinker',
        '../react/AppTile',
        '../react/AppTitle',
        '../react/Badge',
        '../react/Banner',
        '../react/Breadcrumbs',
        '../react/Buttons',
        '../react/Checkbox',
        '../react/Chips',
        '../react/CipherIcon',
        '../react/CircleButton',
        '../react/CircularChart',
        '../react/Counter',
        '../react/Dialog',
        '../react/Divider',
        '../react/DropdownButton',
        '../react/DropdownText',
        '../react/Empty',
        '../react/Fab',
        '../react/GhostFileBadge',
        '../react/Grid',
        '../react/Icon',
        '../react/IconButton',
        '../react/Labs/IconGrid',
        '../react/IconStack',
        '../react/InfosBadge',
        '../react/List',
        '../react/ListItem',
        '../react/ListItemText',
        '../react/ListSubheader',
        '../react/Menu',
        '../react/Paper',
        '../react/PasswordField',
        '../react/PieChart',
        '../react/PointerAlert',
        '../react/Progress',
        '../react/ProgressionBanner',
        '../react/Radios',
        '../react/SearchBar',
        '../react/SelectionBar',
        '../react/Skeletons',
        '../react/Snackbar',
        '../react/Stepper',
        '../react/Switch',
        '../react/Tabs',
        '../react/TextField',
        '../react/Thumbnail',
        '../react/Tooltip',
        '../react/Typography'
      ]
    },
    {
      name: 'Extra',
      components: () => [
        '../react/ActionsBar',
        '../react/ActionsMenu',
        '../react/AppSections',
        '../react/BottomSheet',
        '../react/ContactsList',
        '../react/ContactsListModal',
        '../react/ContactPicker',
        '../react/CozyDialogs',
        '../react/CozyDialogs/SpecificDialogs',
        '../react/FileImageLoader',
        '../react/FilePicker',
        '../react/HistoryRow',
        '../react/IntentDialogOpener/IntentDialogOpener.jsx',
        '../react/IntentIframe/IntentIframe.jsx',
        '../react/Layout/Layout.jsx',
        '../react/MidEllipsis',
        '../react/NavigationList',
        '../react/NestedSelect/NestedSelect.jsx',
        '../react/Paywall',
        '../react/Sidebar',
        '../react/SquareAppIcon',
        '../react/QualificationGrid',
        '../react/QualificationItem',
        '../react/UploadQueue',
        '../react/Viewer'
      ]
    },
    {
      name: 'Providers',
      components: () => [
        '../react/providers/Alert',
        '../react/providers/Breakpoints',
        '../react/providers/CozyTheme'
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
        '../react/Avatar',
        '../react/BarButton',
        '../react/BarTitle',
        '../react/legacy/Breadcrumbs',
        '../react/Card',
        '../react/Circle',
        '../react/Labs/CollectionField',
        '../react/DateMonthPicker',
        '../react/Field',
        '../react/Figure/Figure.jsx',
        '../react/Figure/FigureBlock.jsx',
        '../react/Filename',
        '../react/FilePath',
        '../react/FilePathLink',
        '../react/FileInput',
        '../react/Hero',
        '../react/Input',
        '../react/InputGroup',
        '../react/Label',
        '../react/LoadMore',
        '../react/Page',
        '../react/PasswordExample',
        '../react/Labs/PasswordInput',
        '../react/Popup',
        '../react/PopupOpener',
        '../react/SelectBox/SelectBox.jsx',
        '../react/Spinner',
        '../react/Stack',
        '../react/Textarea',
        '../react/UnorderedList',
        '../react/Wizard'
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
    SectionsRenderer: path.join(__dirname, 'components/SectionsRenderer.jsx'),
    TableOfContentsRenderer: path.join(
      __dirname,
      'components/TableOfContentsRenderer.jsx'
    ),
    Wrapper: path.join(__dirname, 'components/Wrapper')
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
