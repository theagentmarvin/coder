import { adaptModel } from './modelAdapter'

// Use require dynamically to avoid TypeScript requiring @types/three in every subproject
declare const require: any

let raycaster: any = null
let ThreeConstructor: any = null
async function ensureRaycasterAsync(): Promise<any> {
  if (!raycaster) {
    if (!ThreeConstructor) {
      if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {
        const mod = await (import('three' as any) as Promise<any>)
        ThreeConstructor = (mod && (mod as any).default) ? (mod as any).default : mod
      } else {
        // Node environment
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        ThreeConstructor = require('three')
      }
    }
    raycaster = new ThreeConstructor.Raycaster()
  }
  return raycaster
}

async function getBox3Async(): Promise<any> {
  if (!ThreeConstructor) {
    if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {
      const mod = await (import('three' as any) as Promise<any>)
      ThreeConstructor = (mod && (mod as any).default) ? (mod as any).default : mod
    } else {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      ThreeConstructor = require('three')
    }
  }
  return ThreeConstructor.Box3
}

async function getThreeAsync(): Promise<any> {
  if (!ThreeConstructor) {
    if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {
      const mod = await (import('three' as any) as Promise<any>)
      ThreeConstructor = (mod && (mod as any).default) ? (mod as any).default : mod
    } else {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      ThreeConstructor = require('three')
    }
  }
  return ThreeConstructor
}

export async function performSelectionFromEvent(event: MouseEvent, container: HTMLElement, camera: any, loadedModels: Map<string, any>, fragments: any) {
  if (loadedModels.size === 0) return null

  const rect = container.getBoundingClientRect()
  const Three = await getThreeAsync();
  const mouse = new Three.Vector2()
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

  // Prefer fragments-provided raycast if present
  try {
    if (fragments && fragments.core && typeof fragments.core.raycastFirst === 'function') {
      // Build a ray object compatible with fragments.core (min surface). We'll pass camera/world info
      const rc = await ensureRaycasterAsync(); rc.setFromCamera(mouse, camera);
      const origin = (await ensureRaycasterAsync()).ray.origin.clone()
      const direction = (await ensureRaycasterAsync()).ray.direction.clone()

      // fragments.core.raycastFirst usually expects a Ray and a material or options
      const hit = fragments.core.raycastFirst({ origin, direction }, /* options */ 0)
      if (hit) {
        // try mapping to expressID via models
        for (const model of loadedModels.values()) {
          const adapted = adaptModel(model)
          const ids = adapted.getIds ? adapted.getIds() : []
          // crude mapping attempt: find closest model where bbox contains hit.point
          if (model.object) {
            const Box3 = await getBox3Async(); const bbox = new Box3().setFromObject(model.object)
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

  const rc = await ensureRaycasterAsync(); rc.setFromCamera(mouse, camera);

  const modelObjects: any[] = []
  for (const model of loadedModels.values()) {
    if (model.object) modelObjects.push(model.object)
  }

  const intersects = (await ensureRaycasterAsync()).intersectObjects(modelObjects, true)
  if (intersects.length > 0) {
    const intersect = intersects[0]

    // try to obtain expressID safely
    const expressID = await getExpressIdFromIntersection(intersect, loadedModels)
    if (expressID) return { expressID, object: intersect.object }
  }

  return null
}

async function getExpressIdFromIntersection(intersect: any, loadedModels: Map<string, any>) {
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
    for (const [, model] of loadedModels) {
      const adapted = adaptModel(model)
      const ids = adapted.getIds ? adapted.getIds() : adapted.getAllIds ? adapted.getAllIds() : []
      if (ids && ids.length > intersect.instanceId) {
        // as a best-effort, check if the point is in the model bbox
        try {
          if (model.object) {
            const Box3 = await getBox3Async(); const bbox = new Box3().setFromObject(model.object)
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
