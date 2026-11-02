import type { Course } from '../types'
import { cloudIam } from './01-cloud-iam'
import { iamInheritance } from './02-iam-inheritance'
import { serviceAccounts } from './03-service-accounts'
import { noKeyFiles } from './04-no-key-files'
import { permissionDenied } from './05-permission-denied'
import { secretManager } from './06-secret-manager'
import { kmsCmek } from './07-kms-cmek'
import { leastPrivilege } from './08-least-privilege'

// Course 4 · Identity first. Every section recorded on GCP, in the owner's project.
export const secure: Course = {
  id: 'secure',
  title: 'Identity first',
  sections: [cloudIam, iamInheritance, serviceAccounts, noKeyFiles, permissionDenied, secretManager, kmsCmek, leastPrivilege],
}
