import * as THREE from 'three'
import { adaptModel, FragmentModel } from './modelAdapter'

const raycaster = new THREE.Raycaster()

export async function performSelectionFromEvent(event: MouseEvent, container: HTMLElement, camera: any, loadedModels: Map<string, any>, fragments: any) {
  if (loadedModels.size === 0) return null

  const rect = container.getBoundingClientRect()
  const mouse = new THREE.Vector2()
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

  // Prefer fragments-provided raycast if present
  try {
    if (fragments && fragments.core && typeof fragments.core.raycastFirst === 'function') {
      // Build a ray object compatible with fragments.core (min surface). We'll pass camera/world info
      raycaster.setFromCamera(mouse, camera)
      const origin = raycaster.ray.origin.clone()
      const direction = raycaster.ray.direction.clone()

      // fragments.core.raycastFirst usually expects a Ray and a material or options
      const hit = fragments.core.raycastFirst({ origin, direction }, /* options */ 0)
      if (hit) {
        // try mapping to expressID via models
        for (const model of loadedModels.values()) {
          const adapted = adaptModel(model)
          const ids = adapted.getIds ? adapted.getIds() : []
          // crude mapping attempt: find closest model where bbox contains hit.point
          if (model.object) {
            const bbox = new THREE.Box3().setFromObject(model.object)
            if (bbox.containsPoint(hit.point)) {
              // if instanced, try instance->id mapping
              if (hit.instanceId !== undefined && Array.isArray(ids) && ids.length > hit.instanceId) {
                return { expressID: ids[hit.instanceId], object: hit.object }
              }

              // otherwise, try reading userData on hit.object
              if (hit.object && hit.object.userData) {
                const eid = hit.object.userData.expressID || hit.object.userData.id
                if (eid) return { expressID: eid, object: hit.object }
              }
            }
          }
        }
      }
    }
  } catch (e) {
    // fallback to default
    console.warn('Fragments core raycast failed', e)
  }

  // Fallback: ensure geometries have bounds trees for fast queries (if using mesh BVH polyfill)
  for (const model of loadedModels.values()) {
    if (model.object) {
      model.object.traverse((child: any) => {
        if (child && child.geometry && typeof child.geometry.computeBoundsTree === 'function') {
          try { child.geometry.computeBoundsTree() } catch (e) { /* ignore */ }
        }
      })
    }
  }

  raycaster.setFromCamera(mouse, camera)

  const modelObjects: THREE.Object3D[] = []
  for (const model of loadedModels.values()) {
    if (model.object) modelObjects.push(model.object)
  }

  const intersects = raycaster.intersectObjects(modelObjects, true)
  if (intersects.length > 0) {
    const intersect = intersects[0]

    // try to obtain expressID safely
    const expressID = await getExpressIdFromIntersection(intersect, loadedModels)
    if (expressID) return { expressID, object: intersect.object }
  }

  return null
}

async function getExpressIdFromIntersection(intersect: THREE.Intersection, loadedModels: Map<string, any>) {
  let obj: any = intersect.object

  while (obj) {
    if (obj.userData) {
      if (obj.userData.expressID) return obj.userData.expressID
      if (obj.userData.id) return obj.userData.id
    }
    obj = obj.parent
  }

  if (intersect.instanceId !== undefined) {
    // map instanceId to expressID using model.getIds or adapter
    for (const [modelId, model] of loadedModels) {
      const adapted = adaptModel(model)
      const ids = adapted.getIds ? adapted.getIds() : adapted.getAllIds ? adapted.getAllIds() : []
      if (ids && ids.length > intersect.instanceId) {
        // as a best-effort, check if the point is in the model bbox
        try {
          if (model.object) {
            const bbox = new THREE.Box3().setFromObject(model.object)
            if (bbox.containsPoint(intersect.point)) return ids[intersect.instanceId]
          }
        } catch (e) {
          // ignore
        }
      }
    }
  }

  return null
}
