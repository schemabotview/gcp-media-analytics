import type { Section } from '../types'

export const retries: Section = {
  id: 'retries',
  title: 'Retries and SLAs',
  scene: 'orch-retries',
  narration:
    "Some failures are a blip and some are a fact, and a nightly job must tell them apart. The output is mocked. The editor shows the D A G's defaults. Every task may be retried twice, a minute apart: enough for a busy service to recover, not enough to hide a real problem for long. A failure emails the team, and an S L A marks the night late if a task hasn't finished four hours after the schedule. In the terminal, the whole D A G is tested for the thirty first. The sensor passes. Bronze's first try fails: BigQuery answers five oh three, a temporary error. A minute later the second try succeeds, and the night carries on: G2, Silver, the guide, G3. Then gate three fails. G3's verdict for the night is false, the guide's gap from Course 8, and it is false on every try, so after three tries the task is failed, the team is emailed, and everything after it is marked upstream failed. Gold is not built on a night the gates rejected. The side pane lists each task's tries and state, and the difference: a blip is retried away, a fact stays failed. Next, fixing the night.",
}
