import type { Section } from '../types'

export const lifecycle: Section = {
  id: 'lifecycle',
  title: 'Hot to cold: lifecycle rules',
  scene: 'land-lifecycle',
  narration:
    "A night in the raw zone is read hard for a few days: by the landing gate, by the loaders, by anyone checking a number. After a month it's rarely touched, and after a year almost never, yet it must be kept. Cloud Storage has cheaper storage classes for exactly that, and lifecycle rules move objects between them by age, without anyone touching a file. The editor shows the rules, written once as a small map and expanded by Terraform. At thirty days an object moves to Nearline, at ninety to Coldline, at three hundred and sixty five to Archive. In the terminal, the apply updates the bucket in place. Describing its lifecycle configuration returns the three rules as Google stored them, each a set storage class action with an age condition: Archive, Coldline and Nearline. The side pane follows one object through its life. It lands in Standard on day zero, while the gate and the loaders read it. At thirty days it moves to Nearline, at ninety to Coldline, and after a year to Archive, where it's kept and almost never read. The card at the bottom says what each move trades. Every colder class lowers the price of keeping an object and raises the price of reading it. Together with the retention policy, a night now lands once, is sealed by the gate, can't be deleted early, and costs less every month it is kept. With the raw zone settled, the next course turns to the platform's other clock: the live stream.",
}
