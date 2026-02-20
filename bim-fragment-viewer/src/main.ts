import * as THREE from 'three'
import * as OBC from '@thatopen/components'
import Stats from 'stats.js'
import './style.css'
import { adaptModel } from '../shared/modelAdapter'

// ============================================
// LOGGING SYSTEM
// ============================================
class LogManager {
  private logs: any[] = []
  private container: HTMLElement
  private countEl: HTMLElement

  constructor() {
    this.container = document.getElementById('logs-content')!
    this.countEl = document.getElementById('log-count')!
    this.setupConsoleCapture()
  }

  private setupConsoleCapture() {
    const originalLog = console.log
    const originalWarn = console.warn
    const originalError = console.error

    console.log = (...args: any[]) => {
      this.add('info', args.join(' '))
      originalLog.apply(console, args)
    }

    console.warn = (...args: any[]) => {
      this.add('warn', args.join(' '))
      originalWarn.apply(console, args)
    }

    console.error = (...args: any[]) => {
      this.add('error', args.join(' '))
      originalError.apply(console, args)
    }
  }

  add(level: string, message: string) {
    const entry = {
      timestamp: new Date().toLocaleTimeString(),
      level,
      message: message.toString().substring(0, 500),
    }

    this.logs.push(entry)
    this.renderEntry(entry)
    this.updateCount()
    this.container.scrollTop = this.container.scrollHeight
  }

  private renderEntry(entry: any) {
    const el = document.createElement('div')
    el.className = `log-entry ${entry.level}`
    el.innerHTML = `
      <span class="timestamp">${entry.timestamp}</span>
      <span class="message">${this.escapeHtml(entry.message)}</span>
    `
    this.container.appendChild(el)
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  private updateCount() {
    this.countEl.textContent = `${this.logs.length} entries`
  }

  clear() {
    this.logs = []
    this.container.innerHTML = ''
    this.updateCount()
    this.add('info', 'Logs cleared. Ready for new operations...')
  }
}

// ============================================
// BIM FRAGMENT VIEWER APP
// ============================================
class BIMFragmentViewer {
  private components: any
  private world: any
  private fragments: any
  private stats: any
  private logManager: LogManager
  private loadedModels: Map<string, any> = new Map()

  private container: HTMLElement
  private searchInput: HTMLInputElement
  private searchBtn: HTMLButtonElement
  private clearSearchBtn: HTMLButtonElement
  private resultsPanel: HTMLElement
  private propertiesContent: HTMLElement
  private selectedElementEl: HTMLElement

  // Raycaster for selection
  private raycaster: THREE.Raycaster
  private mouse: THREE.Vector2
  private selectedElement: any = null

  constructor() {
    this.logManager = new LogManager()
    console.log('🚀 Initializing BIM Fragment Viewer...')

    this.container = document.getElementById('viewer-container')!
    this.searchInput = document.getElementById('search-input') as HTMLInputElement
    this.searchBtn = document.getElementById('search-btn') as HTMLButtonElement
    this.clearSearchBtn = document.getElementById('clear-search-btn') as HTMLButtonElement
    this.resultsPanel = document.getElementById('results-panel')!
    this.propertiesContent = document.getElementById('properties-content')!
    this.selectedElementEl = document.getElementById('selected-element')!

    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()

    this.components = new OBC.Components()
    this.fragments = this.components.get(OBC.FragmentsManager)

    this.init()
  }

  private async init() {
    try {
      // Setup world
      const worlds = this.components.get(OBC.Worlds)
      this.world = worlds.create()

      this.world.scene = new OBC.SimpleScene(this.components)
      this.world.renderer = new OBC.SimpleRenderer(this.components, this.container)
      this.world.camera = new OBC.SimpleCamera(this.components)

      this.components.init()
      console.log('✅ Components and world initialized')

      // Setup scene
      ;(this.world.scene as any).setup()
      ;(this.world.scene.three as any).background = new THREE.Color(0x1a1a2e)
      console.log('✅ Scene setup complete')

      // Add lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
      this.world.scene.three.add(ambientLight)

      const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
      directionalLight.position.set(10, 20, 10)
      this.world.scene.three.add(directionalLight)
      console.log('✅ Lights added to scene')

      // Add grid
      const grids = this.components.get(OBC.Grids)
      grids.create(this.world)

      // Initialize FragmentsManager with worker
      await this.initFragmentsWorker()

      // Setup model loading handler
      this.setupModelLoading()

      // Setup stats
      this.stats = new Stats()
      this.stats.showPanel(0)
      this.stats.dom.style.position = 'absolute'
      this.stats.dom.style.top = '10px'
      this.stats.dom.style.left = '10px'
      this.stats.dom.style.zIndex = '1'
      this.stats.dom.style.pointerEvents = 'none'
      this.container.appendChild(this.stats.dom)

      // Start animation loop
      this.animate()
      console.log('✅ Animation loop started')

      // Setup event listeners
      this.setupEventListeners()
      this.enableSearchUI()

      console.log('✅ BIM Fragment Viewer fully initialized!')
      console.log('💡 Loading sample fragment models...')

      // Auto-load sample fragments
      await this.loadSampleFragments()

    } catch (error) {
      console.error('❌ Initialization failed:', error)
    }
  }

  private async initFragmentsWorker() {
    // Try to fetch worker from CDN with a local fallback
    const githubUrl = 'https://thatopen.github.io/engine_fragment/resources/worker.mjs'
    console.log(`Attempting to fetch worker from CDN: ${githubUrl}`)

    let workerBlob: Blob | null = null
    try {
      const fetchedUrl = await fetch(githubUrl)
      if (fetchedUrl.ok) {
        workerBlob = await fetchedUrl.blob()
        console.log('✅ Fetched worker from CDN')
      } else {
        console.warn('CDN worker fetch returned non-ok:', fetchedUrl.status)
      }
    } catch (cdnErr) {
      console.warn('CDN worker fetch failed:', cdnErr)
    }

    // If CDN failed, try local paths
    if (!workerBlob) {
      const localCandidates = [
        '/resources/worker.mjs',
        '/public/worker.mjs',
        './resources/worker.mjs',
      ]
      for (const p of localCandidates) {
        try {
          console.log(`Trying local worker path: ${p}`)
          const resp = await fetch(p)
          if (resp.ok) {
            workerBlob = await resp.blob()
            console.log('✅ Loaded local worker:', p)
            break
          }
        } catch (localErr) {
          // ignore and try next
        }
      }
    }

    if (!workerBlob) {
      console.error('❌ Could not load fragments worker from CDN or local fallback. Fragments may not function correctly.')
      return
    }

    const workerFile = new File([workerBlob], 'worker.mjs', {
      type: 'text/javascript',
    })
    const workerUrl = URL.createObjectURL(workerFile)

    this.fragments.init(workerUrl)
    console.log('✅ FragmentsManager initialized with worker')

    // Setup camera update for culling/LOD
    this.world.camera.controls.addEventListener('update', () => {
      this.fragments.core.update()
    })

    // Fix z-fighting on materials (deterministic)
    this.fragments.core.models.materials.list.onItemSet.add(({ value: material }: any) => {
      if (!('isLodMaterial' in material && material.isLodMaterial)) {
        material.polygonOffset = true
        material.polygonOffsetUnits = 1
        // Use a small deterministic offset instead of Math.random() which causes non-deterministic visuals
        material.polygonOffsetFactor = 1
      }
    })

    // Log model capabilities when a model is added (helps debugging missing APIs)
    this.fragments.list.onItemSet.add(({ value: model }: any) => {
      try {
        const caps: any = {
          id: model.modelId,
          hasGetIds: typeof model.getIds === 'function',
          hasGetAllIds: typeof model.getAllIds === 'function',
          hasGetProperties: typeof model.getProperties === 'function',
          hasGetElementData: typeof model.getElementData === 'function',
          hasObject: !!model.object,
        }
        console.log('[Fragments] Model capabilities:', caps)
      } catch (e) {
        // ignore
      }
    })
  }

  private setupModelLoading() {
    // Handle model loading - add to scene when loaded
    this.fragments.list.onItemSet.add(({ value: model }: any) => {
      console.log(`[FragmentsManager] Model loaded: ${model.modelId}`)
      model.useCamera(this.world.camera.three)
      this.world.scene.three.add(model.object)
      this.fragments.core.update(true)
      this.loadedModels.set(model.modelId, model)
    })

    // Handle model disposal
    this.fragments.list.onItemDeleted.add(({ value: model }: any) => {
      console.log(`[FragmentsManager] Model disposed: ${model.modelId}`)
      this.loadedModels.delete(model.modelId)
      this.world.scene.three.remove(model.object)
    })
  }

  private animate() {
    this.stats.begin()
    this.world.renderer.update()
    this.stats.end()
    requestAnimationFrame(() => this.animate())
  }

  private setupEventListeners() {
    // Clear logs button
    const clearLogsBtn = document.getElementById('clear-logs-btn') as HTMLButtonElement
    clearLogsBtn.addEventListener('click', () => this.logManager.clear())

    // Load sample button
    const sampleBtn = document.getElementById('load-sample-btn') as HTMLButtonElement
    sampleBtn.addEventListener('click', () => this.loadSampleFragments())

    // Search functionality
    this.searchBtn.addEventListener('click', () => this.performSearch())
    this.searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.performSearch()
    })
    this.clearSearchBtn.addEventListener('click', () => this.clearSearch())

    // Click handler for 3D selection
    this.container.addEventListener('click', async (e) => {
      // delegate to shared raycast helper
      try {
        // Lazy import shared helper to avoid bundling issues
        const helper = await import('../shared/raycastHelper')
        const result = await helper.performSelectionFromEvent(e as MouseEvent, this.container, this.world.camera.three, this.loadedModels, this.fragments)
        if (result && result.expressID) {
          await this.selectElement(result.expressID, result.object)
          return
        }
      } catch (err) {
        console.warn('Shared raycast helper failed, falling back to local handler', err)
        this.handle3DClick(e as MouseEvent)
      }
    })
  }

  private enableSearchUI() {
    this.searchInput.disabled = false
    this.searchBtn.disabled = false
    this.clearSearchBtn.disabled = false
  }

  private async loadSampleFragments() {
    const fragPaths = [
      'https://thatopen.github.io/engine_components/resources/frags/school_arq.frag',
      'https://thatopen.github.io/engine_components/resources/frags/school_str.frag',
    ]

    console.log('[FragmentsManager] Loading sample fragments...')

    await Promise.all(
      fragPaths.map(async (path) => {
        const modelId = path.split('/').pop()?.split('.').shift()
        if (!modelId) return null

        // Skip if already loaded
        if (this.loadedModels.has(modelId)) {
          console.log(`[FragmentsManager] Model ${modelId} already loaded, skipping`)
          return null
        }

        console.log(`[FragmentsManager] Fetching: ${modelId}`)
        const file = await fetch(path)
        const buffer = await file.arrayBuffer()
        console.log(`[FragmentsManager] Loading buffer for: ${modelId} (${(buffer.byteLength / 1024).toFixed(1)} KB)`)
        return this.fragments.core.load(buffer, { modelId })
      })
    )

    console.log('[FragmentsManager] All fragments loaded successfully!')

    // Fit camera to loaded models
    this.fitCameraToModels()
  }

  private fitCameraToModels() {
    if (this.loadedModels.size === 0) return

    const bbox = new THREE.Box3()
    for (const model of this.loadedModels.values()) {
      if (model.object) {
        bbox.expandByObject(model.object)
      }
    }

    const center = bbox.getCenter(new THREE.Vector3())
    const size = bbox.getSize(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z)

    this.world.camera.controls.setLookAt(
      center.x + maxDim * 1.5,
      center.y + maxDim * 1.5,
      center.z + maxDim * 1.5,
      center.x,
      center.y,
      center.z,
      true
    )

    console.log(`📐 Camera fitted to models: ${size.x.toFixed(2)} x ${size.y.toFixed(2)} x ${size.z.toFixed(2)}`)
  }

  private async handle3DClick(event: MouseEvent) {
    if (this.loadedModels.size === 0) return

    const rect = this.container.getBoundingClientRect()
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    this.raycaster.setFromCamera(this.mouse, this.world.camera.three)

    // Intersect with all loaded model objects
    const modelObjects: THREE.Object3D[] = []
    for (const model of this.loadedModels.values()) {
      if (model.object) {
        modelObjects.push(model.object)
      }
    }

    const intersects = this.raycaster.intersectObjects(modelObjects, true)

    if (intersects.length > 0) {
      const intersect = intersects[0]
      const expressID = this.getExpressIdFromIntersection(intersect)

      if (expressID) {
        await this.selectElement(expressID, intersect.object)
        return
      }
    }

    this.clearSelection()
  }

  private getExpressIdFromIntersection(intersect: THREE.Intersection): number | null {
    // Try to get expressID from userData
    let obj: any = intersect.object

    while (obj) {
      if (obj.userData) {
        if (obj.userData.expressID) return obj.userData.expressID
        if (obj.userData.id) return obj.userData.id
      }
      obj = obj.parent
    }

    // Try to get from instanceId if it's an instanced mesh
    if (intersect.instanceId !== undefined) {
      // Find the model that owns this instanced mesh
      for (const model of this.loadedModels.values()) {
        if (model.object) {
          // Check if this object belongs to this model
          const modelBbox = new THREE.Box3().setFromObject(model.object)
          if (modelBbox.containsPoint(intersect.point)) {
            // Get IDs from the model
            const ids = model.getAllIds ? model.getAllIds() : []
            if (ids.length > intersect.instanceId) {
              return ids[intersect.instanceId]
            }
          }
        }
      }
    }

    return null
  }

  private async selectElement(expressID: number, object: THREE.Object3D) {
    console.log(`👆 Selected element: ID ${expressID}`)

    this.selectedElement = { id: expressID, object }
    this.selectedElementEl.textContent = `Element ID: ${expressID}`

    // Highlight the selected element
    this.highlightElement(expressID)

    // Show properties
    await this.showProperties(expressID)
  }

  private highlightElement(expressID: number) {
    // Use FragmentsManager.highlight
    try {
      // Find which model contains this element
      for (const [modelId, model] of this.loadedModels) {
        const adapted = adaptModel(model)
        const ids = adapted.getIds ? adapted.getIds() : []
        if (ids.includes(expressID)) {
          const modelIdMap = new Map()
          modelIdMap.set(modelId, new Set([expressID]))
          this.fragments.highlight(
            { r: 0, g: 1, b: 0, a: 1 }, // Green highlight
            modelIdMap
          )
          break
        }
      }
    } catch (e) {
      // Highlight not available, skip
    }
  }

  private async showProperties(expressID: number) {
    try {
      this.propertiesContent.innerHTML = '<p class="placeholder">Loading properties...</p>'

      // Try to get element data from the models
      let elementData: any = null

      for (const [modelId, model] of this.loadedModels) {
        // Try to get element info from the model
        const elementInfo = await this.getElementInfo(model, expressID)
        if (elementInfo) {
          elementData = elementInfo
          elementData.modelId = modelId
          break
        }
      }

      if (!elementData) {
        elementData = {
          expressID,
          name: `Element ${expressID}`,
          type: 'BIM Element',
        }
      }

      // Build properties HTML
      let html = ''

      if (elementData.name || elementData.Name) {
        html += `<div class="prop-group"><h4>Name</h4><p>${elementData.name || elementData.Name}</p></div>`
      }
      if (elementData.type || elementData.Type || elementData.ifcClass) {
        html += `<div class="prop-group"><h4>Type</h4><p>${elementData.type || elementData.Type || elementData.ifcClass}</p></div>`
      }
      if (elementData.modelId) {
        html += `<div class="prop-group"><h4>Model</h4><p>${elementData.modelId}</p></div>`
      }
      html += `<div class="prop-group"><h4>Express ID</h4><p>${expressID}</p></div>`

      // Display other properties
      const excludeKeys = ['Name', 'name', 'type', 'Type', 'expressID', 'id', 'ifcClass', 'modelId']
      const otherProps = Object.entries(elementData).filter(([key]) => !excludeKeys.includes(key))

      if (otherProps.length > 0) {
        html += '<div class="prop-group"><h4>Properties</h4>'
        for (const [key, value] of otherProps) {
          if (typeof value !== 'object') {
            html += `<div class="prop-item"><span class="prop-name">${key}:</span> <span class="prop-value">${value}</span></div>`
          }
        }
        html += '</div>'
      }

      this.propertiesContent.innerHTML = html
      console.log(`📊 Displayed properties for element ${expressID}`)

    } catch (error) {
      console.error('❌ Error fetching properties:', error)
      this.propertiesContent.innerHTML = '<p class="placeholder">Error loading properties</p>'
    }
  }

  private async getElementInfo(model: any, expressID: number): Promise<any> {
    // Try to get element info from the fragment model
    try {
      // Check if model has getProperties or similar method
      if (model.getProperties) {
        return await model.getProperties(expressID)
      }

      // Check if model has getElementData or similar
      if (model.getElementData) {
        return await model.getElementData(expressID)
      }

      // Try to get basic info from model metadata
      if (model.getIds && model.getIds().includes(expressID)) {
        return {
          expressID,
          name: model.getName ? model.getName(expressID) : `Element ${expressID}`,
          type: model.getType ? model.getType(expressID) : 'Unknown',
        }
      }
    } catch (e) {
      // Ignore errors
    }

    return null
  }

  private clearSelection() {
    this.selectedElement = null
    this.selectedElementEl.textContent = 'No element selected'
    this.propertiesContent.innerHTML = '<p class="placeholder">Click on an element in the 3D view to see its properties</p>'

    // Clear highlight
    try {
      this.fragments.resetHighlight()
    } catch (e) {
      // Ignore
    }

    console.log('🧹 Selection cleared')
  }

  private async performSearch() {
    const query = this.searchInput.value.trim().toLowerCase()

    if (!query) {
      console.warn('⚠️ Please enter a search term')
      return
    }

    console.log(`🔍 Searching for: "${query}"`)

    try {
      if (this.loadedModels.size === 0) {
        console.warn('⚠️ No models loaded. Please load fragments first.')
        return
      }

      // Search through all loaded models
      const results: Array<{ id: number; name: string; type: string; modelId: string }> = []

      for (const [modelId, model] of this.loadedModels) {
        const ids = model.getIds ? model.getIds() : []

        for (const id of ids) {
          const name = model.getName ? model.getName(id) : `Element ${id}`
          const type = model.getType ? model.getType(id) : 'Unknown'

          if (name.toLowerCase().includes(query) || type.toLowerCase().includes(query)) {
            results.push({ id, name, type, modelId })
          }
        }
      }

      // Display results
      this.displayResults(results, query)

      // Highlight results
      if (results.length > 0) {
        this.highlightResults(results)
        console.log(`✅ Found and highlighted ${results.length} matching elements`)
      } else {
        console.log(`📭 No results found for "${query}"`)
      }

    } catch (error) {
      console.error('❌ Search error:', error)
    }
  }

  private highlightResults(results: Array<{ id: number; modelId: string }>) {
    try {
      // Group results by model
      const byModel = new Map<string, Set<number>>()
      for (const result of results) {
        if (!byModel.has(result.modelId)) {
          byModel.set(result.modelId, new Set())
        }
        byModel.get(result.modelId)!.add(result.id)
      }

      // Highlight each model's elements
      for (const [modelId, ids] of byModel) {
        const modelIdMap = new Map()
        modelIdMap.set(modelId, ids)
        this.fragments.highlight(
          { r: 1, g: 0.5, b: 0, a: 1 }, // Orange highlight
          modelIdMap
        )
      }
    } catch (e) {
      // Highlight not available
    }
  }

  private displayResults(results: Array<{ id: number; name: string; type: string; modelId: string }>, query: string) {
    this.resultsPanel.innerHTML = ''

    if (results.length === 0) {
      return
    }

    console.log(`📋 Found ${results.length} results for "${query}"`)

    // Show first 20 results
    results.slice(0, 20).forEach(result => {
      const el = document.createElement('div')
      el.className = 'result-item'
      el.innerHTML = `
        <div class="type">${result.type}</div>
        <div class="name">${result.name}</div>
        <div class="id">ID: ${result.id} (${result.modelId})</div>
      `
      el.addEventListener('click', async () => {
        // Find the model and select the element
        const model = this.loadedModels.get(result.modelId)
        if (model && model.object) {
          // Try to find the object in the model
          let targetObj: THREE.Object3D | null = null
          model.object.traverse((child: THREE.Object3D) => {
            if (child.userData && child.userData.expressID === result.id) {
              targetObj = child
            }
          })
          await this.selectElement(result.id, targetObj || model.object)
        }
      })
      this.resultsPanel.appendChild(el)
    })

    if (results.length > 20) {
      const moreEl = document.createElement('div')
      moreEl.className = 'result-item'
      moreEl.innerHTML = `<div class="name">... and ${results.length - 20} more results</div>`
      this.resultsPanel.appendChild(moreEl)
    }
  }

  private clearSearch() {
    this.searchInput.value = ''
    this.resultsPanel.innerHTML = ''

    // Clear highlight
    try {
      this.fragments.resetHighlight()
    } catch (e) {
      // Ignore
    }

    console.log('🧹 Search cleared')
  }
}

// ============================================
// BOOTSTRAP
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  new BIMFragmentViewer()
})
