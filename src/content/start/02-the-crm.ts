import type { Section } from '../types'

export const theCrm: Section = {
  id: 'the-crm',
  title: 'The CRM: households, packages, and every version',
  scene: 'start-crm',
  narration:
    "The C R M is a PostgreSQL database, and here it runs for real. The editor shows its schema. Packages are Sun's four television bundles with a monthly price. Households hold who the customer is, including an email and a phone number, the region, and the broadband exchange that serves them. Subscriptions join the two, and the highlighted columns are the important part: a valid from date and a valid to date. A household never has its package overwritten. An upgrade closes the old row and opens a new one. In the terminal, the load script fills both the C R M and billing from the generator's files. The first query counts households by their current package: Entertainment is the most common, then Essentials, Sports and Ultimate, five thousand households in all. The second query asks for every version of one household, H H one zero zero four two. It was on Entertainment until the fifteenth of October, then switched to Sports, and that second row has no end date, so it is current. The side pane draws the tables and how they relate. One household has many subscription versions, and each version points at one package. Below, the two versions of that household and the package mix. This history matters later, when Silver has to answer which package a household had on any given night. Next, the files the vendors send.",
}
