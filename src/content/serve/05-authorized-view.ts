import type { Section } from '../types'

export const authorizedView: Section = {
  id: 'authorized-view',
  title: 'Sharing without exposing',
  scene: 'serve-view',
  narration:
    "Marketing wants to know how titles performed by region. They should never see which households watched what. The output is mocked. The editor shows the arrangement in Terraform. Marketing gets a dataset of its own, holding one view, title audience: minutes per title and region, and households merged from sketches, never a household I D. The view is then authorized on Gold: Gold's own access list names the view, so the view may read Gold's table, while the people who query the view have no access to Gold at all. Marketing's group is a reader of its own dataset, and nothing else. In the terminal, the view answers marketing's question about the derby: a thousand and eighty seven households in London, about five hundred and thirty each in the North West and the Midlands, with their minutes. Then Gold's access list is shown: the view is there, authorized, and no group appears on Gold. A query by marketing on Gold itself would be refused. The side pane draws the chain: dataset, authorized view, reader. One copy of the data, two audiences, each seeing only what it should. Next, making the dashboard's most common query nearly free.",
}
