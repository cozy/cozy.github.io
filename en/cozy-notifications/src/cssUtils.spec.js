const { resolveCSSProperties, extractCSSProps } = require('./cssUtils')

test('extractCSSProps', () => {
  expect(
    extractCSSProps(`
    // a comment
    --red : $f00
    --green: $0f0
    --blue  $00f
  `)
  ).toEqual({
    '--red': '$f00',
    '--blue': '$00f',
    '--green': '$0f0'
  })
})

test('resolveCSSProperties', () => {
  const styleContent = `
  :root {
    --red: $f00;
  }
  h1 {
    color: var(--red);
  }
  `
  const overrideProps = {
    '--red': 'crimson'
  }
  expect(resolveCSSProperties(styleContent)).toBe(`
  :root {
    --red: $f00;
  }
  h1 {
    color: $f00;
  }
  `)
  expect(resolveCSSProperties(styleContent, overrideProps)).toBe(`
  :root {
    --red: $f00;
  }
  h1 {
    color: crimson;
  }
  `)
})
