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
  // ── DEBUG: Raycast diagnostics (remove in production) ──
  const DEBUG_RAYCAST = true

  if (DEBUG_RAYCAST) {
    console.log('[Raycast] ═══════════════════════════════════════')
    console.log('[Raycast] click event:', { clientX: event.clientX, clientY: event.clientY })
  }

  if (loadedModels.size === 0) {
    if (DEBUG_RAYCAST) console.log('[Raycast] ABORT: loadedModels is empty')
    return null
  }

  const rect = container.getBoundingClientRect()
  const Three = await getThreeAsync();
  const mouse = new Three.Vector2()
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

  if (DEBUG_RAYCAST) {
    console.log('[Raycast] mouse (NDC):', { x: mouse.x.toFixed(4), y: mouse.y.toFixed(4) })
    console.log('[Raycast] container rect:', { left: rect.left, top: rect.top, width: rect.width, height: rect.height })

    // Step 1 – Camera state
    console.log('[Raycast] camera:', {
      position: camera.position?.toArray?.() ?? camera.position,
      projectionMatrix: camera.projectionMatrix?.elements?.slice(0, 4) + '...',
      near: camera.near,
      far: camera.far,
      isPerspectiveCamera: camera.isPerspectiveCamera,
      isOrthographicCamera: camera.isOrthographicCamera,
      zoom: camera.zoom,
    })

    // Step 2 – Fragment models count & bounding boxes
    console.log('[Raycast] loadedModels count:', loadedModels.size)
    let idx = 0
    for (const [id, model] of loadedModels) {
      const hasObject = !!model.object
      let bboxInfo = null
      if (hasObject) {
        // compute bounding box from the whole object
        try {
          const Box3 = await getBox3Async()
          const bbox = new Box3().setFromObject(model.object)
          bboxInfo = {
            min: bbox.min?.toArray?.(),
            max: bbox.max?.toArray?.(),
            isEmpty: bbox.isEmpty?.(),
            center: bbox.getCenter(new Three.Vector3())?.toArray?.(),
          }
        } catch (e) {
          bboxInfo = { error: String(e) }
        }
      }
      // Also check children count
      let childCount = 0
      if (hasObject && model.object.traverse) {
        model.object.traverse(() => childCount++)
      }
      console.log(`[Raycast] model ${idx} "${id}":`, {
        hasObject,
        childCount,
        bbox: bboxInfo,
        type: model.object?.type,
        visible: model.object?.visible,
      })
      idx++
    }
  }

  // Step 3 & 4 – Ray direction and raycast parameters
  if (DEBUG_RAYCAST) {
    const rc = await ensureRaycasterAsync(); rc.setFromCamera(mouse, camera);
    console.log('[Raycast] raycaster state:', {
      origin: rc.ray.origin.toArray(),
      direction: rc.ray.direction.toArray(),
      near: rc.near,
      far: rc.far,
    })
    console.log('[Raycast] fragments object keys:', fragments ? Object.keys(fragments) : 'null')
    console.log('[Raycast] fragments.core exists:', !!fragments?.core)
    console.log('[Raycast] fragments.core.raycastFirst exists:', typeof fragments?.core?.raycastFirst)
    console.log('[Raycast] fragments.groups size:', fragments?.groups?.size)
    console.log('[Raycast] fragments.list size:', fragments?.list?.size)
  }

  // Prefer fragments-provided raycast if present
  try {
    if (fragments && fragments.core && typeof fragments.core.raycastFirst === 'function') {
      // Build a ray object compatible with fragments.core (min surface). We'll pass camera/world info
      const rc = await ensureRaycasterAsync(); rc.setFromCamera(mouse, camera);
      const origin = rc.ray.origin.clone()
      const direction = rc.ray.direction.clone()

      if (DEBUG_RAYCAST) {
        console.log('[Raycast] attempting fragments.core.raycastFirst with:', {
          origin: origin.toArray(),
          direction: direction.toArray(),
        })
      }

      // fragments.core.raycastFirst usually expects a Ray and a material or options
      const hit = fragments.core.raycastFirst({ origin, direction }, /* options */ 0)

      if (DEBUG_RAYCAST) {
        console.log('[Raycast] fragments.core.raycastFirst result:', hit ? {
          hasHit: true,
          instanceId: hit.instanceId,
          faceIndex: hit.faceIndex,
          point: hit.point?.toArray?.(),
          distance: hit.distance,
          object: hit.object ? { type: hit.object.type, name: hit.object.name } : null,
        } : { hasHit: false, raw: hit })
      }

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
    console.warn('[Raycast] Fragments core raycast failed', e)
    if (DEBUG_RAYCAST) console.warn('[Raycast] Falling back to THREE.Raycaster')
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

  if (DEBUG_RAYCAST) {
    console.log('[Raycast] fallback raycaster:', {
      origin: rc.ray.origin.toArray(),
      direction: rc.ray.direction.toArray(),
    })
  }

  const modelObjects: any[] = []
  for (const model of loadedModels.values()) {
    if (model.object) modelObjects.push(model.object)
  }

  if (DEBUG_RAYCAST) {
    console.log('[Raycast] fallback modelObjects count:', modelObjects.length)
    for (let i = 0; i < modelObjects.length; i++) {
      const obj = modelObjects[i]
      console.log(`[Raycast] fallback obj ${i}:`, {
        type: obj?.type,
        name: obj?.name,
        visible: obj?.visible,
        layer: obj?.layers?.mask,
        hasGeometry: !!obj?.geometry,
      })
      // Check child meshes
      let meshCount = 0
      obj?.traverse?.((child: any) => { if (child?.isMesh) meshCount++ })
      console.log(`[Raycast] fallback obj ${i} child meshes:`, meshCount)
    }
  }

  const intersects = (await ensureRaycasterAsync()).intersectObjects(modelObjects, true)

  if (DEBUG_RAYCAST) {
    console.log('[Raycast] fallback intersectObjects result:', {
      count: intersects.length,
      first: intersects[0] ? {
        distance: intersects[0].distance,
        point: intersects[0].point?.toArray?.(),
        faceIndex: intersects[0].faceIndex,
        object: intersects[0].object ? { type: intersects[0].object.type } : null,
      } : null,
    })
  }

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
