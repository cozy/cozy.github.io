import React from 'react'
import TransactionCategoryEditor from 'ducks/transactions/TransactionCategoryEditor'
import useSwitch from 'hooks/useSwitch'

export default () => Wrapped => props => {
  const [modalOpened, show, hide] = useSwitch(false)

  const handleShow = ev => {
    ev.preventDefault()
    show()
  }

  return (
    <>
      <Wrapped {...props} showCategoryChoice={handleShow} />
      {modalOpened ? (
        <TransactionCategoryEditor
          beforeUpdate={hide}
          onCancel={hide}
          transaction={props.transaction}
        />
      ) : null}
    </>
  )
}
