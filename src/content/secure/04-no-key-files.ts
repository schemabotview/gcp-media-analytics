import type { Section } from '../types'

export const noKeyFiles: Section = {
  id: 'no-key-files',
  title: 'No key files: act as an account, briefly',
  scene: 'secure-no-key-files',
  narration:
    "The usual way to use a service account from a laptop is to download a key file for it, a long lived credential that works for anyone holding a copy. It ends up in downloads folders, in chat messages and in git history. This platform never creates one. Instead, Priya is allowed to act as each account when she needs to. The highlighted block in the I A M module grants her the service account token creator role on all five accounts. That role lets one identity ask Google for a short lived access token belonging to another. In the terminal, the apply adds those five grants. Then the last command lists S A ingest's user managed keys, the kind you can download, and there are none. Listed zero items. The side pane draws how it works instead. Priya holds the token creator grant. When she asks to act as S A ingest, Google's I A M credentials A P I checks that grant and mints an access token for the account. The token expires within the hour, so a copy that leaks stops working on its own. The table below records the key list: empty, so there is no key file to lose. In an organization, a policy can go further and refuse key creation outright. This project has no organization, so that guard isn't shown here. Next, impersonation in use, and the first refusal.",
}
