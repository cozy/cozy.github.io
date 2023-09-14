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
        '../react/AccordionActions',
        '../react/Alert',
        '../react/AlertTitle',
        '../react/AppBar',
        '../react/AppIcon',
        '../react/AppLinker',
        '../react/AppTile',
        '../react/AppTitle',
        '../react/Backdrop',
        '../react/Badge',
        '../react/Banner',
        '../react/BottomNavigation',
        '../react/BottomNavigationAction',
        '../react/Box',
        '../react/Breadcrumbs',
        '../react/Button',
        '../react/ButtonBase',
        '../react/Buttons',
        '../react/CardActions',
        '../react/CardActionArea',
        '../react/CardContent',
        '../react/CardHeader',
        '../react/CardMedia',
        '../react/CssBaseline',
        '../react/Checkbox',
        '../react/Chips',
        '../react/CipherIcon',
        '../react/CircleButton',
        '../react/CircularChart',
        '../react/CircularProgress',
        '../react/ClickAwayListener',
        '../react/Collapse',
        '../react/Container',
        '../react/Counter',
        '../react/Dialog',
        '../react/DialogActions',
        '../react/DialogContent',
        '../react/DialogContentText',
        '../react/DialogTitle',
        '../react/Divider',
        '../react/Drawer',
        '../react/DropdownButton',
        '../react/DropdownText',
        '../react/Empty',
        '../react/Fab',
        '../react/Fade',
        '../react/FilledInput',
        '../react/FormControl',
        '../react/FormControlLabel',
        '../react/FormGroup',
        '../react/FormHelperText',
        '../react/FormLabel',
        '../react/GhostFileBadge',
        '../react/Grid',
        '../react/GridList',
        '../react/GridListTile',
        '../react/GridListTileBar',
        '../react/Grow',
        '../react/Hidden',
        '../react/Icon',
        '../react/IconButton',
        '../react/Labs/IconGrid',
        '../react/IconStack',
        '../react/InfosBadge',
        '../react/InputAdornment',
        '../react/InputBase',
        '../react/LinearProgress',
        '../react/Link',
        '../react/List',
        '../react/ListItem',
        '../react/ListItemAvatar',
        '../react/ListItemText',
        '../react/ListSubheader',
        '../react/Menu',
        '../react/MenuItem',
        '../react/MenuList',
        '../react/MobileStepper',
        '../react/NativeSelect',
        '../react/NoSsr',
        '../react/OutlinedInput',
        '../react/Paper',
        '../react/PasswordField',
        '../react/PieChart',
        '../react/Progress',
        '../react/ProgressionBanner',
        '../react/RadioGroup',
        '../react/Radios',
        '../react/RootRef',
        '../react/SearchBar',
        '../react/Select',
        '../react/SelectionBar',
        '../react/ScopedCssBaseline',
        '../react/Skeleton',
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
        '../react/Stepper',
        '../react/SvgIcon',
        '../react/SwipeableDrawer',
        '../react/Switch',
        '../react/Tab',
        '../react/Tabs',
        '../react/TextareaAutosize',
        '../react/TextField',
        '../react/Thumbnail',
        '../react/Timeline',
        '../react/TimelineConnector',
        '../react/TimelineContent',
        '../react/TimelineDot',
        '../react/TimelineItem',
        '../react/TimelineOppositeContent',
        '../react/TimelineSeparator',
        '../react/Toolbar',
        '../react/Tooltip',
        '../react/Typography',
        '../react/Zoom'
      ]
    },
    {
      name: 'Extra',
      components: () => [
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
        '../react/Table',
        '../react/Textarea',
        '../react/UnorderedList',
        '../react/Wizard'
      ]
    },
    {
      name: 'Deprecated',
      components: () => [
        '../react/deprecated/ActionMenu',
        '../react/deprecated/Alerter',
        '../react/deprecated/Button',
        '../react/deprecated/ButtonAction',
        '../react/deprecated/BottomDrawer',
        '../react/deprecated/Chip',
        '../react/deprecated/CompositeRow',
        '../react/deprecated/GridItem',
        '../react/deprecated/Infos',
        '../react/deprecated/InfosCarrousel',
        '../react/deprecated/InlineCard',
        '../react/deprecated/IntentModal/IntentModal.jsx',
        '../react/deprecated/IntentOpener/IntentOpener.jsx',
        '../react/deprecated/Media/Media.jsx',
        '../react/deprecated/Menus',
        '../react/deprecated/Modal',
        '../react/deprecated/NarrowContent',
        '../react/deprecated/Overlay',
        '../react/deprecated/PercentageBar',
        '../react/deprecated/PercentageLine',
        '../react/deprecated/QuotaAlert',
        '../react/deprecated/PushClientButton',
        '../react/deprecated/Radio',
        '../react/deprecated/RaisedList',
        '../react/deprecated/ViewStack'
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
