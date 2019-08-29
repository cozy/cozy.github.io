import { Document } from 'cozy-doctypes'
import { ACCOUNT_DOCTYPE, BILLS_DOCTYPE, TRANSACTION_DOCTYPE } from 'doctypes'
import { Settings } from 'ducks/settings/services'

class Transaction extends Document {}
Transaction.doctype = TRANSACTION_DOCTYPE
Transaction.idAttributes = ['_id']

class Bill extends Document {}
Bill.doctype = BILLS_DOCTYPE
Bill.idAttributes = ['_id']

class BankAccount extends Document {}
BankAccount.doctype = ACCOUNT_DOCTYPE
BankAccount.idAttributes = ['_id']

export { Transaction, Bill, Settings, BankAccount }
