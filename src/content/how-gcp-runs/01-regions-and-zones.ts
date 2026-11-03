import type { Section } from '../types'

export const regionsAndZones: Section = {
  id: 'regions-and-zones',
  title: 'Regions and zones: where London is',
  scene: 'how-regions',
  narration:
    "Before anything is built, it helps to know where it will physically live. Google Cloud is divided into regions, and each region into zones, and the platform's every regional resource will sit in one place: europe west two, London. This is a read only lab, recorded once on the project, and it creates nothing. In the terminal, the first command counts Google's regions: forty three. The second asks about London's, and its status is up. The third lists the zones inside it: europe west two a, b and c. The side pane draws what those answers mean. Around the outside is Google's network, with all forty three regions joined by its own private network. Inside, the London region, and inside that, three zones. A zone is a separate part of the region, with its own power, cooling and networking, so trouble in one shouldn't take down the others. The table below shows what that means for the resources in this course. A zonal resource, like a single Dataproc worker, lives in one zone and doesn't survive that zone failing. A regional one, like a bucket, a BigQuery dataset or a K M S key, is spread across the region's zones and survives a zone failing. Global resources, like I A M and the project itself, don't belong to any one region. Next, what owns all of these resources: the project, and whatever sits above it.",
}
