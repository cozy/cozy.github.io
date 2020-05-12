import { runService } from './service'
import { doRecurrenceMatching } from 'ducks/recurrence/service'

runService(({ client }) => doRecurrenceMatching(client))
