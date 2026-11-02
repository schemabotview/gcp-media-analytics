import type { SceneModel } from '@graphlearning/graphl-flow'
import { BUILT, mapScene } from './map'

// Scenes no section shows yet, reachable as `#/<id>` for review: the platform's map as it stands at
// the end of the pilot course, and finished. They leave this file when a section takes them.
export const previewScenes: Record<string, SceneModel> = {
  'preview-map-land': mapScene(BUILT.land),
  'preview-map-final': mapScene(BUILT.operate),
}
