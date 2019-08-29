import { Document } from 'cozy-doctypes'
import { TRIGGER_DOCTYPE } from 'doctypes'

// TODO to remove when https://github.com/cozy/cozy-doctypes/issues/82
// is solved
class Trigger extends Document {}
Trigger.doctype = TRIGGER_DOCTYPE

export default Trigger
