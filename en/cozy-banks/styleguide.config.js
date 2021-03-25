const path = require('path')
const glob = require('glob')

module.exports = {
  require: [
    ...glob.sync(path.resolve(__dirname, 'build/app.*.css')),
    path.resolve(__dirname, 'docs/styleguide/style.css'),
    path.resolve(__dirname, 'docs/styleguide/setup.js'),
    'cozy-ui/transpiled/react/stylesheet.css'
  ],
  serverPort: 6061,
  styleguideDir: 'docs/build/styleguide',
  styleguideComponents: {
    Wrapper: path.resolve(__dirname, 'docs/styleguide/Wrapper')
  },
  sections: [
    {
      name: 'General',
      components: () => [
        // 'src/components/Table/index.jsx',
        'src/components/SharingIcon/SharingIcon.jsx',
        'src/components/SelectDates/SelectDates.jsx',
        'src/components/Select/index.jsx',
        'src/components/Switch.jsx',
        'src/components/PageModal/PageModal.jsx',
        'src/components/KonnectorChip/index.js'
      ]
    },
    {
      name: 'Banks',
      components: () => [
        'src/components/Figure/Figure.jsx',
        'src/components/Figure/FigureBlock.jsx',
        'src/ducks/balance/components/AccountRow.jsx'
      ]
    },
    {
      name: 'Chart',
      components: () => ['src/components/Chart/LineChart.jsx']
    },
    {
      name: 'Balance',
      components: () => ['src/ducks/balance/History.jsx']
    },
    {
      name: 'Loading',
      components: () => ['src/components/Loading/Loading.jsx']
    },
    {
      name: 'Misc',
      components: () => ['src/components/DisplayError.js']
    }
  ]
}
