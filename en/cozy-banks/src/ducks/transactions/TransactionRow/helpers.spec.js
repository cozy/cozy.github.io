import { hasParentWithClass } from './helpers'

import styles from 'ducks/transactions/Transactions.styl'

describe('hasParentWithClass', () => {
  it('should return true if a none direct parent has the specific class', () => {
    const grandParent = document.createElement('div')
    grandParent.classList.add(styles.TransactionRowMobile__actions)
    const parent = document.createElement('div')
    grandParent.appendChild(parent)
    const child = document.createElement('div')
    parent.appendChild(child)

    expect(
      hasParentWithClass(child, styles.TransactionRowMobile__actions)
    ).toBeTruthy()
  })

  it('should return false if a node without parent has the specific class', () => {
    const node = document.createElement('div')
    node.classList.add(styles.TransactionRowMobile__actions)

    expect(
      hasParentWithClass(node, styles.TransactionRowMobile__actions)
    ).toBeFalsy()
  })
})
