import type { Section } from '../types'

export const theResourceHierarchy: Section = {
  id: 'the-resource-hierarchy',
  title: 'The resource hierarchy: organization, folders, project',
  scene: 'how-hierarchy',
  narration:
    "Every Google Cloud resource belongs to exactly one project, and projects can sit inside folders, which sit inside an organization. That hierarchy decides where billing goes, which A P Is are on, and how permissions flow down. This lab reads it. The first command describes the project. Its i d is sun media dev, the name people use. Its number is a long numeral that Google uses internally, and it will turn up in service account names and error messages. The parent field is missing, and the second command shows why. Asking for the project's ancestors returns one line: the project itself. There is no folder and no organization above it. The side pane draws the full hierarchy anyway, with the two missing levels greyed out. In a company, the organization at the top would usually be the company's domain, folders would group teams or environments, and policies set up there would flow down into every project beneath. Here there is just the project, and below it the resources the course will create: buckets, datasets, topics and keys, each belonging to this project alone. The note gives the reason a project matters so much. It's the unit of billing, of A P Is, and of identity and access. A course that builds its whole platform in one project can tear it down cleanly afterwards. Next, the A P Is: every service is switched on, project by project.",
}
