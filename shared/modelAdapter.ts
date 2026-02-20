// Shared model adapter — avoid importing Three.js types to keep this file buildable from multiple subprojects.

export type FragmentModel = {
  object?: any
  getIds?: () => number[]
  getAllIds?: () => number[]
  getProperties?: (id: number) => Promise<any>
  getName?: (id: number) => string
  getType?: (id: number) => string
  modelId?: string
}

// Normalize different model shapes to a small, stable adapter surface.
export function adaptModel(rawModel: any): FragmentModel {
  if (!rawModel) return {}

  const adapter: FragmentModel = {
    object: rawModel.object ?? rawModel.group ?? rawModel.mesh ?? undefined,
    modelId: rawModel.modelId ?? rawModel.name ?? (rawModel.modelId === 0 ? String(0) : undefined),
  }

  // getIds / getAllIds
  if (typeof rawModel.getIds === 'function') {
    adapter.getIds = () => rawModel.getIds()
  } else if (Array.isArray(rawModel.ids)) {
    adapter.getIds = () => rawModel.ids
  } else if (typeof rawModel.getAllIds === 'function') {
    adapter.getAllIds = () => rawModel.getAllIds()
    adapter.getIds = () => rawModel.getAllIds()
  } else if (rawModel.object && rawModel.object.isInstancedMesh && typeof rawModel.getIdsFromInstances === 'function') {
    adapter.getIds = () => rawModel.getIdsFromInstances()
  } else {
    // fallback: attempt to scan children userData for expressID (expensive)
    adapter.getIds = () => {
      const ids = new Set<number>()
      if (!adapter.object) return []
      adapter.object.traverse((child: any) => {
        if (child && child.userData) {
          if (child.userData.expressID) ids.add(Number(child.userData.expressID))
          if (child.userData.id) ids.add(Number(child.userData.id))
        }
      })
      return Array.from(ids)
    }
  }

  // getProperties
  if (typeof rawModel.getProperties === 'function') {
    adapter.getProperties = (id: number) => rawModel.getProperties(id)
  } else if (typeof rawModel.getElementData === 'function') {
    adapter.getProperties = (id: number) => rawModel.getElementData(id)
  } else {
    adapter.getProperties = async (_id: number) => null
  }

  // getName / getType
  adapter.getName = (id: number) => {
    try {
      if (typeof rawModel.getName === 'function') return rawModel.getName(id)
      if (typeof rawModel.getItemName === 'function') return rawModel.getItemName(id)
    } catch (e) {
      // ignore
    }
    return `Element ${id}`
  }

  adapter.getType = (id: number) => {
    try {
      if (typeof rawModel.getType === 'function') return rawModel.getType(id)
    } catch (e) {}
    return 'Unknown'
  }

  return adapter
}
