import Stats from "stats.js";
import * as BUI from "@thatopen/ui";
import * as OBC from "@thatopen/components";
import * as THREE from "three";

// Initialize BUI Manager
BUI.Manager.init();

// Create components instance with error handling
let components: OBC.Components;
let world: any;
let fragments: OBC.FragmentsManager;

try {
  components = new OBC.Components();

  // Setup world
  const worlds = components.get(OBC.Worlds);
  world = worlds.create<
    OBC.SimpleScene,
    OBC.OrthoPerspectiveCamera,
    OBC.SimpleRenderer
  >();

  world.scene = new OBC.SimpleScene(components);
  world.scene.setup();
  world.scene.three.background = null;

  const container = document.getElementById("container")!;
  world.renderer = new OBC.SimpleRenderer(components, container);
  world.camera = new OBC.OrthoPerspectiveCamera(components);

  // Initialize components
  components.init();

  // Add grid
  components.get(OBC.Grids).create(world);

  // Get FragmentsManager
  fragments = components.get(OBC.FragmentsManager);
} catch (error) {
  console.error("Failed to initialize OBC components:", error);
  const loadingEl = document.querySelector(".loading");
  if (loadingEl) {
    loadingEl.textContent = "Error initializing viewer. Check console.";
  }
  throw error;
}

// Track loading state
let fragmentsLoaded = false;
let loadingInProgress = false;
let loadedModelIds: string[] = [];

// Load fragments models
const loadFragments = async () => {
  if (loadingInProgress) return;
  loadingInProgress = true;
  fragmentsLoaded = false;
  updateUI();

  const fragPaths = [
    "https://thatopen.github.io/engine_components/resources/frags/school_arq.frag",
    "https://thatopen.github.io/engine_components/resources/frags/school_str.frag",
  ];

  try {
    for (const path of fragPaths) {
      const modelId = path.split("/").pop()?.split(".").shift();
      if (!modelId) continue;
      if (loadedModelIds.includes(modelId)) continue;

      const file = await fetch(path);
      const buffer = await file.arrayBuffer();
      const data = new Uint8Array(buffer);

      // Load the fragment
      const group = fragments.load(data, {
        name: modelId,
        coordinate: true,
      });

      // Add to scene
      world.scene.three.add(group);
      loadedModelIds.push(modelId);

      console.log(`Loaded model: ${modelId}`, group);
    }

    // Fit camera to scene after loading
    const meshes: THREE.Mesh[] = [];
    fragments.groups.forEach((group) => {
      group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          meshes.push(child);
        }
      });
    });
    if (meshes.length > 0) {
      await world.camera.fit(meshes, 0.5);
    }

    fragmentsLoaded = true;
    showNotification("Models loaded successfully!");
  } catch (error) {
    console.error("Error loading fragments:", error);
    showNotification("Error loading models", true);
  } finally {
    loadingInProgress = false;
    updateUI();
  }
};

// Delete architectural model
const deleteArchModel = () => {
  for (const [id, group] of fragments.groups) {
    if (/arq/.test(id)) {
      fragments.disposeGroup(group);
      loadedModelIds = loadedModelIds.filter((mid) => mid !== id);
    }
  }
  if (fragments.groups.size === 0) {
    fragmentsLoaded = false;
  }
  updateUI();
};

// Delete all models
const deleteAllModels = () => {
  const groups = [...fragments.groups.values()];
  for (const group of groups) {
    fragments.disposeGroup(group);
  }
  loadedModelIds = [];
  fragmentsLoaded = false;
  updateUI();
};

// Export fragments
const downloadFragments = async () => {
  for (const [id, group] of fragments.groups) {
    const fragsBuffer = fragments.export(group);
    const blob = new Blob([fragsBuffer as unknown as BlobPart], {
      type: "application/octet-stream",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${id}.frag`;
    link.click();
    URL.revokeObjectURL(link.href);
  }
};

// Create UI Panel
let panel: HTMLElement;

const [panelComponent, updatePanel] = BUI.Component.create<
  BUI.PanelSection,
  {}
>((_) => {
  const onLoadFragments = async ({ target }: { target: BUI.Button }) => {
    target.loading = true;
    await loadFragments();
    target.loading = false;
  };

  // Loading indicator
  let loadingIndicator: BUI.TemplateResult | undefined;
  if (loadingInProgress) {
    loadingIndicator = BUI.html`
      <div style="padding: 12px; text-align: center; color: #666;">
        <div class="loading-spinner"></div>
        <span style="font-size: 13px; margin-top: 8px; display: block;">Loading models...</span>
      </div>
    `;
  }

  // Load button - always visible
  let loadFragmentsBtn: BUI.TemplateResult | undefined;
  if (fragments.groups.size < 2 && !loadingInProgress) {
    loadFragmentsBtn = BUI.html`
      <bim-button 
        label="Load Models" 
        icon="solar:download-bold"
        @click=${onLoadFragments}
        style="--bim-button-bg: #2196F3;">
      </bim-button>
    `;
  }

  // Dispose architectural model button
  let disposeArchModelBtn: BUI.TemplateResult | undefined;
  if ([...fragments.groups.keys()].some((key) => /arq/.test(key))) {
    disposeArchModelBtn = BUI.html`
      <bim-button 
        label="Remove Arch Model" 
        icon="solar:trash-bin-trash-bold"
        @click=${deleteArchModel}>
      </bim-button>
    `;
  }

  // Download and dispose all buttons - only when models exist
  let downloadFragmentsBtn: BUI.TemplateResult | undefined;
  let disposeModelsBtn: BUI.TemplateResult | undefined;
  if (fragments.groups.size > 0) {
    disposeModelsBtn = BUI.html`
      <bim-button 
        label="Remove All Models" 
        icon="solar:trash-bin-2-bold"
        @click=${deleteAllModels}
        style="--bim-button-bg: #f44336;">
      </bim-button>
    `;

    downloadFragmentsBtn = BUI.html`
      <bim-button 
        label="Export Models" 
        icon="solar:file-download-bold"
        @click=${downloadFragments}>
      </bim-button>
    `;
  }

  // Properties table section - only visible after fragments loaded
  let propertiesSection: BUI.TemplateResult | undefined;
  if (fragmentsLoaded) {
    propertiesSection = BUI.html`
      <bim-panel-section label="Model Information" collapsed>
        <div style="padding: 8px; font-size: 13px; color: #666;">
          <div style="margin-bottom: 8px;">
            <strong>Status:</strong> 
            <span style="color: #4CAF50;">● Loaded</span>
          </div>
          <div style="margin-bottom: 8px;">
            <strong>Models:</strong> ${fragments.groups.size}
          </div>
          <div>
            <strong>Fragments:</strong> ${fragments.list.size}
          </div>
        </div>
      </bim-panel-section>
    `;
  }

  // Model info section - shows list of loaded models
  let modelInfoSection: BUI.TemplateResult | undefined;
  if (fragments.groups.size > 0) {
    modelInfoSection = BUI.html`
      <bim-panel-section label="Loaded Models" collapsed>
        <div style="padding: 8px; font-size: 13px; color: #666;">
          ${[...fragments.groups.keys()].map(
            (id) =>
              BUI.html`<div style="padding: 4px 0; display: flex; align-items: center; gap: 8px;">
                <span style="color: #4CAF50;">●</span>
                ${id}
              </div>`
          )}
        </div>
      </bim-panel-section>
    `;
  }

  return BUI.html`
    <bim-panel active label="BIM Mobile Viewer" class="options-menu">
      <bim-panel-section label="Controls">
        ${loadingIndicator}
        ${loadFragmentsBtn}
        ${disposeArchModelBtn}
        ${downloadFragmentsBtn}
        ${disposeModelsBtn}
      </bim-panel-section>
      ${modelInfoSection}
      ${propertiesSection}
    </bim-panel>
  `;
}, {});

panel = panelComponent;

// Function to update the entire UI
function updateUI() {
  updatePanel();
}

// Listen for fragment changes
const updateFunction = () => updateUI();
fragments.groups.onItemSet.add(updateFunction);
fragments.groups.onItemDeleted.add(updateFunction);
fragments.onFragmentsLoaded.add(updateFunction);
fragments.onFragmentsDisposed.add(updateFunction);

document.body.append(panel);

// Mobile menu toggle button - always visible at bottom right
const menuButton = BUI.Component.create<BUI.Button>(() => {
  return BUI.html`
    <bim-button 
      class="phone-menu-toggler" 
      icon="solar:menu-dots-bold"
      tooltip="Menu"
      @click="${() => {
        panel.classList.toggle("options-menu-visible");
      }}">
    </bim-button>
  `;
});

document.body.append(menuButton);

// Notification system
function showNotification(message: string, isError = false) {
  const notification = document.createElement("div");
  notification.className = "mobile-notification";
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: ${isError ? "#f44336" : "#4CAF50"};
    color: white;
    padding: 12px 24px;
    border-radius: 24px;
    font-size: 14px;
    font-weight: 500;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    animation: slideDown 0.3s ease;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = "slideUp 0.3s ease";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Stats for performance monitoring
const stats = new Stats();
stats.showPanel(2);
document.body.append(stats.dom);
stats.dom.style.left = "0px";
stats.dom.style.zIndex = "unset";
world.renderer.onBeforeUpdate.add(() => stats.begin());
world.renderer.onAfterUpdate.add(() => stats.end());

// Set initial camera position
world.camera.controls.setLookAt(78, 20, -2.2, 26, -4, 25);

// Disable stats on mobile (small screens)
if (window.innerWidth < 768) {
  stats.dom.style.display = "none";
}

console.log("BIM Mobile Viewer initialized successfully!");
console.log("Click 'Load Models' to load the sample BIM models.");

// Attach shared raycast helper to container clicks (best-effort)
;(async () => {
  const containerEl = document.getElementById('container')
  if (!containerEl) return

  containerEl.addEventListener('click', async (e) => {
    try {
      const helper = await import('../../../shared/raycastHelper')
      const camera = world.camera.three
      const loadedModelsMap = new Map<string, any>()

      // build loaded model map from fragments.groups
      try {
        for (const [id, group] of fragments.groups) {
          loadedModelsMap.set(String(id), group)
        }
      } catch (err) {
        // ignore
      }

      const result = await helper.performSelectionFromEvent(e as MouseEvent, containerEl as HTMLElement, camera, loadedModelsMap, fragments)
      if (result && result.expressID) {
        console.log('Selected element:', result.expressID)
        // attempt highlight using fragments.highlight
        try {
          const map = new Map();
          // use first loaded model for highlight (best-effort for mobile)
          for (const [k] of loadedModelsMap) { map.set(k, new Set([result.expressID])); break }
          ;(fragments as any).highlight?.({ r: 0, g: 1, b: 0, a: 1 }, map)
        } catch (e) {
          // ignore
        }
      }
    } catch (err) {
      console.warn('Shared raycast helper failed (mobile):', err)
    }
  })
})()

