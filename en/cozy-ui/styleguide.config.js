const path = require('path')
const webpackMerge = require('webpack-merge')

module.exports = {
  title: 'Cozy UI React components',
  pagePerSection: true,
  sections: [
    {
      name: 'Bar',
      components: () => ['../react/BarButton', '../react/BarTitle']
    },
    {
      name: 'Basics',
      components: () => [
        '../react/Badge',
        '../react/Banner',
        '../react/InfosBadge',
        '../react/GhostFileBadge',
        '../react/Button',
        '../react/Buttons',
        '../react/ButtonAction',
        '../react/Card',
        '../react/CircleButton',
        '../react/Chip',
        '../react/Chips',
        '../react/Counter',
        '../react/DropdownText',
        '../react/DropdownButton',
        '../react/Fab',
        '../react/Icon',
        '../react/IconButton',
        '../react/IconStack',
        '../react/Paper',
        '../react/PercentageBar',
        '../react/Progress',
        '../react/ProgressionBanner',
        '../react/Spinner',
        '../react/Stack',
        '../react/Thumbnail'
      ]
    },
    {
      name: 'Forms',
      components: () => [
        '../react/Checkbox',
        '../react/DateMonthPicker',
        '../react/Field',
        '../react/MuiCozyTheme/TextField',
        '../react/Labs/CollectionField',
        '../react/FileInput',
        '../react/Input',
        '../react/InputGroup',
        '../react/Label',
        '../react/NestedSelect/NestedSelect.jsx',
        '../react/Radios',
        '../react/SearchBar',
        '../react/SelectBox/SelectBox.jsx',
        '../react/Stepper',
        '../react/Textarea',
        '../react/MuiCozyTheme/Switch'
      ]
    },
    {
      name: 'Layout components',
      components: () => [
        '../react/Circle',
        '../react/MuiCozyTheme/Divider',
        '../react/MuiCozyTheme/Accordion',
        '../react/Hero',
        '../react/Layout/Layout.jsx',
        '../react/NarrowContent',
        '../react/Page',
        '../react/SectionHeader',
        '../react/SelectionBar',
        '../react/Sidebar',
        '../react/ViewStack'
      ]
    },
    {
      name: 'Content',
      components: () => [
        '../react/AppTitle',
        '../react/Avatar',
        '../react/BottomDrawer',
        '../react/BottomSheet',
        '../react/Empty',
        '../react/Figure/Figure.jsx',
        '../react/Figure/FigureBlock.jsx',
        '../react/Filename',
        '../react/FilePath',
        '../react/FilePathLink',
        '../react/MuiCozyTheme/Grid',
        '../react/FileImageLoader',
        '../react/Infos',
        '../react/InfosCarrousel',
        '../react/LoadMore',
        '../react/Media/Media.jsx',
        '../react/MidEllipsis',
        '../react/CozyDialogs',
        '../react/Dialog',
        '../react/Table',
        '../react/Typography',
        '../react/Tooltip',
        '../react/UnorderedList',
        '../react/Wizard'
      ]
    },
    {
      name: 'Intents',
      components: () => [
        '../react/IntentIframe/IntentIframe.jsx',
        '../react/IntentDialogOpener/IntentDialogOpener.jsx'
      ]
    },
    {
      name: 'List',
      components: () => [
        '../react/MuiCozyTheme/List',
        '../react/MuiCozyTheme/ListSubheader',
        '../react/MuiCozyTheme/ListItem',
        '../react/ListItemText',
        '../react/OrderedList'
      ]
    },
    {
      name: 'Navigation',
      components: () => [
        '../react/ActionsMenu',
        '../react/MuiCozyTheme/Menus',
        '../react/AppLinker',
        '../react/Breadcrumbs',
        '../react/MuiCozyTheme/MuiBreadcrumbs',
        '../react/Tabs',
        '../react/Tab',
        '../react/NavigationList'
      ]
    },
    {
      name: 'Special',
      components: () => [
        '../react/Alert',
        '../react/AlertTitle',
        '../react/Alerter',
        '../react/AppIcon',
        '../react/AppTile',
        '../react/SquareAppIcon',
        '../react/AppSections',
        '../react/CipherIcon',
        '../react/CircularChart',
        '../react/CozyTheme',
        '../react/FilePicker',
        '../react/Overlay',
        '../react/PasswordExample',
        '../react/PieChart',
        '../react/Popup',
        '../react/PopupOpener',
        '../react/PushClientButton',
        '../react/QuotaAlert',
        '../react/Paywall',
        '../react/Viewer'
      ]
    },
    {
      name: 'Hooks',
      components: () => [
        '../react/hooks/useConfirmExit/index.jsx',
        '../react/hooks/useBreakpoints/index.jsx',
        '../react/hooks/useBrowserOffline.jsx',
        '../react/hooks/useCycle.jsx',
        '../react/hooks/useEventListener.js',
        '../react/hooks/usePeriodicRender.js',
        '../react/hooks/useScroll.jsx'
      ]
    },
    {
      name: 'Labs',
      components: () => [
        '../react/Labs/GridItem',
        '../react/Labs/IconGrid',
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
    },
    {
      name: 'Deprecated',
      components: () => [
        '../react/ActionMenu',
        '../react/CompositeRow',
        '../react/InlineCard',
        '../react/IntentModal/IntentModal.jsx',
        '../react/IntentOpener/IntentOpener.jsx',
        '../react/Modal',
        '../react/MuiCozyTheme/RaisedList',
        '../react/PercentageLine',
        '../react/Radio'
      ]
    },
    {
      name: '@material-ui',
      components: () => [
        '../react/AccordionActions',
        '../react/AppBar',
        '../react/Backdrop',
        '../react/BottomNavigation',
        '../react/BottomNavigationAction',
        '../react/Box',
        '../react/MuiCozyTheme/Buttons',
        '../react/CardActionArea',
        '../react/CardActions',
        '../react/CardContent',
        '../react/CardHeader',
        '../react/CardMedia',
        '../react/CircularProgress',
        '../react/ClickAwayListener',
        '../react/Collapse',
        '../react/Container',
        '../react/CssBaseline',
        '../react/DialogActions',
        '../react/DialogContent',
        '../react/DialogContentText',
        '../react/DialogTitle',
        '../react/Drawer',
        '../react/Fade',
        '../react/FilledInput',
        '../react/FormControl',
        '../react/FormControlLabel',
        '../react/FormGroup',
        '../react/FormHelperText',
        '../react/FormLabel',
        '../react/GridList',
        '../react/GridListTile',
        '../react/GridListTileBar',
        '../react/Grow',
        '../react/Hidden',
        '../react/InputBase',
        '../react/InputAdornment',
        '../react/LinearProgress',
        '../react/Link',
        '../react/ListItemAvatar',
        '../react/MuiCozyTheme/Menu',
        '../react/MenuItem',
        '../react/MenuList',
        '../react/MobileStepper',
        '../react/NativeSelect',
        '../react/NoSsr',
        '../react/OutlinedInput',
        '../react/RadioGroup',
        '../react/RootRef',
        '../react/ScopedCssBaseline',
        '../react/Select',
        '../react/Slide',
        '../react/Slider',
        '../react/Snackbar',
        '../react/SnackbarContent',
        '../react/Step',
        '../react/StepButton',
        '../react/StepConnector',
        '../react/StepContent',
        '../react/StepIcon',
        '../react/StepLabel',
        '../react/SvgIcon',
        '../react/Skeleton',
        '../react/SwipeableDrawer',
        '../react/TextareaAutosize',
        '../react/Toolbar',
        '../react/Zoom'
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
