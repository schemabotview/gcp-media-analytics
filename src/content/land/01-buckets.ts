import type { Section } from '../types'

export const buckets: Section = {
  id: 'buckets',
  title: 'Buckets and the raw zone: one bucket, flat names',
  scene: 'land-buckets',
  narration:
    "The raw zone is where each night's extracts will land, exactly as received, and after two courses of work it already exists as one Cloud Storage bucket. Before putting anything in it, it's worth reading it back the way Google sees it. The editor shows the storage module. The bucket lives in one region, London. Its storage class is Standard, the class for data that's read often. Uniform bucket level access means permissions are granted with I A M on the whole bucket, never object by object. And every new object is encrypted with Sun's own key, from the previous course. In the terminal, describing the bucket returns its real settings: the default key, the Standard class, the location, public access prevention enforced, uniform access on. The table in the side pane reads those values back and says what each one means. One line comes from Google, not from our code: soft delete, seven days, so a deleted object can still be restored for a week. Below the table is the idea the rest of this course depends on. A bucket holds objects, and nothing else. There are no folders inside it. An object called source equals billing, slash d t equals the thirty first, slash charges dot C S V is one object with one long name. The slashes are just characters in that name. Next, on Priya's laptop, those names become a partitioning scheme.",
}
