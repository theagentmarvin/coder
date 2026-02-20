import { describe, it, expect } from 'vitest'
import { adaptModel, FragmentModel } from '../../shared/modelAdapter'

describe('adaptModel', () => {
  describe('model with standard methods', () => {
    it('should return expected values when model has getIds/getProperties/getName/getType', () => {
      const mockModel = {
        object: { name: 'test-object' },
        modelId: 'model-123',
        getIds: () => [1, 2, 3],
        getProperties: async (id: number) => ({ id, name: `Property ${id}` }),
        getName: (id: number) => `Name ${id}`,
        getType: (id: number) => `Type ${id}`,
      }

      const adapter = adaptModel(mockModel)

      expect(adapter.getIds?.()).toEqual([1, 2, 3])
      expect(adapter.modelId).toBe('model-123')
      expect(adapter.object?.name).toBe('test-object')
    })

    it('should return correct properties from getProperties', async () => {
      const mockModel = {
        getProperties: async (id: number) => ({ expressID: id, type: 'test' }),
      }

      const adapter = adaptModel(mockModel)
      const props = await adapter.getProperties?.(42)

      expect(props).toEqual({ expressID: 42, type: 'test' })
    })

    it('should return correct name from getName', () => {
      const mockModel = {
        getName: (id: number) => `Custom Name ${id}`,
      }

      const adapter = adaptModel(mockModel)
      const name = adapter.getName?.(42)

      expect(name).toBe('Custom Name 42')
    })

    it('should return correct type from getType', () => {
      const mockModel = {
        getType: (id: number) => `Custom Type ${id}`,
      }

      const adapter = adaptModel(mockModel)
      const type = adapter.getType?.(42)

      expect(type).toBe('Custom Type 42')
    })

    it('should use getItemName as fallback for getName', () => {
      const mockModel = {
        getItemName: (id: number) => `Item Name ${id}`,
      }

      const adapter = adaptModel(mockModel)
      const name = adapter.getName?.(42)

      expect(name).toBe('Item Name 42')
    })
  })

  describe('model with ids array', () => {
    it('should use ids array when getIds is not available', () => {
      const mockModel = {
        ids: [10, 20, 30],
      }

      const adapter = adaptModel(mockModel)

      expect(adapter.getIds?.()).toEqual([10, 20, 30])
    })
  })

  describe('model with getAllIds fallback', () => {
    it('should use getAllIds when getIds is not available', () => {
      const mockModel = {
        getAllIds: () => [100, 200, 300],
      }

      const adapter = adaptModel(mockModel)

      expect(adapter.getIds?.()).toEqual([100, 200, 300])
      expect(adapter.getAllIds?.()).toEqual([100, 200, 300])
    })
  })

  describe('instanced mesh case', () => {
    it('should use getIdsFromInstances when model.object.isInstancedMesh is true', () => {
      const mockModel = {
        object: {
          isInstancedMesh: true,
        },
        getIdsFromInstances: () => [5, 6, 7],
      }

      const adapter = adaptModel(mockModel)

      expect(adapter.getIds?.()).toEqual([5, 6, 7])
    })

    it('should not use getIdsFromInstances when isInstancedMesh is false', () => {
      const children: any[] = []
      const mockModel = {
        object: {
          isInstancedMesh: false,
          traverse: (fn: Function) => children.forEach(fn),
        },
        getIdsFromInstances: () => [5, 6, 7],
      }

      const adapter = adaptModel(mockModel)

      // Should fall back to scanning (empty in this case)
      expect(adapter.getIds?.()).toEqual([])
    })
  })

  describe('model missing methods - scanning children with userData', () => {
    it('should scan children and return ids from userData.expressID', () => {
      const mockChild1 = { userData: { expressID: 101 } }
      const mockChild2 = { userData: { expressID: 102 } }
      const mockChild3 = { userData: {} }

      const mockModel = {
        object: {
          traverse: (fn: Function) => {
            fn(mockChild1)
            fn(mockChild2)
            fn(mockChild3)
          },
        },
      }

      const adapter = adaptModel(mockModel)
      const ids = adapter.getIds?.()

      expect(ids).toContain(101)
      expect(ids).toContain(102)
      expect(ids).toHaveLength(2)
    })

    it('should scan children and return ids from userData.id as fallback', () => {
      const mockChild1 = { userData: { id: 201 } }
      const mockChild2 = { userData: { id: 202 } }

      const mockModel = {
        object: {
          traverse: (fn: Function) => {
            fn(mockChild1)
            fn(mockChild2)
          },
        },
      }

      const adapter = adaptModel(mockModel)
      const ids = adapter.getIds?.()

      expect(ids).toContain(201)
      expect(ids).toContain(202)
    })

    it('should return unique ids when duplicates exist', () => {
      const mockChild1 = { userData: { expressID: 301 } }
      const mockChild2 = { userData: { expressID: 301 } }
      const mockChild3 = { userData: { id: 301 } }

      const mockModel = {
        object: {
          traverse: (fn: Function) => {
            fn(mockChild1)
            fn(mockChild2)
            fn(mockChild3)
          },
        },
      }

      const adapter = adaptModel(mockModel)
      const ids = adapter.getIds?.()

      expect(ids).toEqual([301])
    })

    it('should handle object without traverse method gracefully', () => {
      const mockModel = {
        object: {},
      }

      const adapter = adaptModel(mockModel)
      // The adapter falls through to the scanning fallback but object.traverse is not a function
      // This is expected to throw since the adapter assumes traverse exists when falling back
      expect(() => adapter.getIds?.()).toThrow()
    })
  })

  describe('getProperties fallback', () => {
    it('should use getElementData as fallback for getProperties', async () => {
      const mockModel = {
        getElementData: async (id: number) => ({ elementId: id, data: 'test' }),
      }

      const adapter = adaptModel(mockModel)
      const props = await adapter.getProperties?.(55)

      expect(props).toEqual({ elementId: 55, data: 'test' })
    })

    it('should return null when no properties method available', async () => {
      const mockModel = {}

      const adapter = adaptModel(mockModel)
      const props = await adapter.getProperties?.(1)

      expect(props).toBeNull()
    })
  })

  describe('edge cases', () => {
    it('should return empty object when rawModel is null', () => {
      const adapter = adaptModel(null)
      expect(adapter).toEqual({})
    })

    it('should return empty object when rawModel is undefined', () => {
      const adapter = adaptModel(undefined)
      expect(adapter).toEqual({})
    })

    it('should use group as object fallback', () => {
      const mockModel = {
        group: { name: 'group-object' },
      }

      const adapter = adaptModel(mockModel)

      expect(adapter.object?.name).toBe('group-object')
    })

    it('should use mesh as object fallback', () => {
      const mockModel = {
        mesh: { name: 'mesh-object' },
      }

      const adapter = adaptModel(mockModel)

      expect(adapter.object?.name).toBe('mesh-object')
    })

    it('should use name as modelId fallback', () => {
      const mockModel = {
        name: 'model-name',
      }

      const adapter = adaptModel(mockModel)

      expect(adapter.modelId).toBe('model-name')
    })

    it('should handle modelId = 0 correctly', () => {
      const mockModel = {
        modelId: 0,
      }

      const adapter = adaptModel(mockModel)

      // Current behavior: modelId 0 is preserved as number 0 
      // (the ?? chain falls through but the === check converts it back)
      expect(adapter.modelId).toBe(0)
    })

    it('should return default name when getName throws', () => {
      const mockModel = {
        getName: () => {
          throw new Error('Test error')
        },
      }

      const adapter = adaptModel(mockModel)
      const name = adapter.getName?.(99)

      expect(name).toBe('Element 99')
    })

    it('should return default type when getType throws', () => {
      const mockModel = {
        getType: () => {
          throw new Error('Test error')
        },
      }

      const adapter = adaptModel(mockModel)
      const type = adapter.getType?.(99)

      expect(type).toBe('Unknown')
    })

    it('should return default name when no name method available', () => {
      const mockModel = {}

      const adapter = adaptModel(mockModel)
      const name = adapter.getName?.(77)

      expect(name).toBe('Element 77')
    })

    it('should return default type when no type method available', () => {
      const mockModel = {}

      const adapter = adaptModel(mockModel)
      const type = adapter.getType?.(77)

      expect(type).toBe('Unknown')
    })
  })
})
