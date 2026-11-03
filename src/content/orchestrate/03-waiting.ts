import type { Section } from '../types'

export const waiting: Section = {
  id: 'waiting',
  title: 'Waiting for the batch',
  scene: 'orch-sensor',
  narration:
    "The schedule says half past two, but the device platform's export arrives when it arrives. Loading a half-written night would be worse than loading none. The output is mocked. The editor shows the sensor. It checks for one object in the raw bucket: the night's underscore SUCCESS marker, which the exporter writes last, after every part file. It looks every five minutes for up to six hours, in reschedule mode, so between looks it gives its worker slot back instead of sitting on it. In the terminal, the sensor is tested alone for the thirty first. The marker is not there yet, so the task is marked up for reschedule: not failed, just not yet. Then the export finishes, here by hand, writing the empty marker into the night's folder. The sensor is tested again, finds it, and succeeds: Bronze may load. The side pane draws the loop: is it there; not yet, wait; there, go. The marker is the same idea as Course 5's sealed nights: a folder is complete only when it says so. Next, what happens when a task fails.",
}
