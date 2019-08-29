import { RECIPIENT_DOCTYPE } from 'doctypes'

export const findSharing = (cozy, doctype, id) => {
  if (!id) throw new Error('Missing mandatory parameter `id`')

  const sharing = {
    sharing_type: 'master-slave'
  }

  return cozy.data.find(doctype, id)
    .then(account => {
      // Temporary to be able to get the owner from the account label
      sharing.account = account
      sharing.owner = account.owner
      const { recipients } = account
      const hasRecipients = recipients && recipients.length
      return hasRecipients
        ? Promise.all(
            recipients.map(recipient => cozy.data.find(RECIPIENT_DOCTYPE, recipient.recipient.id))
          )
         : []
    }).then(recipients => {
      sharing.recipients = recipients
      return sharing
    })
}
