import { useCallback, useEffect, useRef, useState } from 'react';
import * as OBC from '@thatopen/components';
import * as OBF from '@thatopen/components-front';
import { RenderedFaces, toClassicWorker } from '@thatopen/fragments';
import * as THREE from 'three';
import PropertiesPanel from './PropertiesPanel';

const IFC_URL = '/models/small.ifc';

export default function FragmentViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const componentsRef = useRef<OBC.Components | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Properties panel state
  const [selectedItemData, setSelectedItemData] = useState<any[] | null>(null);
  const [isLoadingProperties, setIsLoadingProperties] = useState(false);
  const fragmentsRef = useRef<any>(null);

  // Keep the latest state-setter in a ref so the useEffect click handler can call it
  const setSelectedItemDataRef = useRef(setSelectedItemData);
  const setIsLoadingPropertiesRef = useRef(setIsLoadingProperties);
  setSelectedItemDataRef.current = setSelectedItemData;
  setIsLoadingPropertiesRef.current = setIsLoadingProperties;

  // Touch detection state
  const touchStartRef = useRef<{ time: number; x: number; y: number } | null>(null);
  const tapCountRef = useRef(0);
  const tapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const highlighterRef = useRef<any>(null);

  const clearSelection = useCallback(async () => {
    setSelectedItemData(null);
    setIsLoadingProperties(false);
    if (highlighterRef.current) {
      await highlighterRef.current.clear('select');
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    let disposed = false;
    let cleanup: (() => void) | undefined;
    let workerUrl: string | null = null;

    const init = async () => {
      try {
        console.log('=== FragmentViewer init start ===');
        const components = new OBC.Components();
        componentsRef.current = components;

        // Create world with TOE wrappers
        const worlds = components.get(OBC.Worlds);
        const world = worlds.create<
          OBC.SimpleScene,
          OBC.OrthoPerspectiveCamera,
          OBC.SimpleRenderer
        >();

        // Setup scene
        world.scene = new OBC.SimpleScene(components);
        world.scene.setup();
        world.scene.three.background = null;

        // Setup renderer
        const container = containerRef.current!;
        world.renderer = new OBC.SimpleRenderer(components, container);

        // Setup camera
        world.camera = new OBC.OrthoPerspectiveCamera(components);

        // Initialize components
        components.init();

        // Set camera position
        await world.camera.controls.setLookAt(10, 10, 10, 0, 0, 0);

        // Add grid
        components.get(OBC.Grids).create(world);

        // Setup FragmentsManager worker with cache busting
        const workerScriptUrl = '/worker.mjs?v=' + Date.now();
        console.log('Loading worker from:', workerScriptUrl);
        workerUrl = await toClassicWorker(workerScriptUrl);
        console.log('Worker blob URL created');
        const fragments = components.get(OBC.FragmentsManager);
        fragments.init(workerUrl);
        fragmentsRef.current = fragments;

        // Update fragments on camera movement
        const onUpdate = () => fragments.core.update();
        world.camera.controls.addEventListener('update', onUpdate);

        // When a fragment model is loaded, add it to the scene
        fragments.list.onItemSet.add(({ value: model }) => {
          model.useCamera(world.camera.three);
          world.scene.three.add(model.object);
          fragments.core.update(true);
          if (!disposed) setLoading(false);
        });

        // Fix z-fighting
        fragments.core.models.materials.list.onItemSet.add(
          ({ value: material }) => {
            if (!('isLodMaterial' in material && material.isLodMaterial)) {
              material.polygonOffset = true;
              material.polygonOffsetUnits = 1;
              material.polygonOffsetFactor = Math.random();
            }
          }
        );

        // Setup IFC loader with LOCAL WASM (same origin, no CORS)
        const ifcLoader = components.get(OBC.IfcLoader);
        console.log('Configuring IfcLoader with local WASM...');
        await ifcLoader.setup({
          autoSetWasm: false,
          wasm: {
            path: '/',
            absolute: true,
          },
        });
        console.log('IfcLoader setup complete');

        // Load IFC model
        console.log('Fetching IFC model from:', IFC_URL);
        const file = await fetch(IFC_URL);
        const data = await file.arrayBuffer();
        const buffer = new Uint8Array(data);
        console.log('IFC buffer size:', buffer.length);
        await ifcLoader.load(buffer, false, 'sample-model', {
          processData: {
            progressCallback: (progress) => {
              console.log(`IFC conversion progress: ${progress}%`);
            },
          },
        });
        console.log('IFC load complete');
        fragments.core.update(true);
        console.log('Fragments list size after load:', fragments.list.size);

        // Setup Raycasters (TOE)
        components.get(OBC.Raycasters).get(world);

        // Setup Highlighter (TOE) — replaces manual hitModel.highlight()
        const highlighter = components.get(OBF.Highlighter);
        highlighter.setup({
          world,
          selectMaterialDefinition: {
            color: new THREE.Color(0.2, 0.6, 1.0),
            opacity: 1,
            transparent: false,
            renderedFaces: RenderedFaces.TWO,
          },
        });
        highlighterRef.current = highlighter;

        // Listen to highlighter selection events → fetch IFC properties
        highlighter.events.select.onHighlight.add(async (modelIdMap: OBC.ModelIdMap) => {
          console.log('[Highlighter] onHighlight', modelIdMap);
          setIsLoadingPropertiesRef.current(true);
          for (const [modelId, localIds] of Object.entries(modelIdMap)) {
            const model = fragments.list.get(modelId);
            if (!model) continue;
            const itemData = await model.getItemsData([...localIds]);
            console.log('[Highlighter] fetched properties', {
              modelId,
              localIds: [...localIds],
              itemDataLength: itemData?.length,
            });
            setSelectedItemDataRef.current(itemData);
          }
          setIsLoadingPropertiesRef.current(false);
        });

        highlighter.events.select.onClear.add(() => {
          console.log('[Highlighter] selection cleared');
          setSelectedItemDataRef.current(null);
          setIsLoadingPropertiesRef.current(false);
        });

        // Touch handlers — handle double-tap to clear selection
        // Single tap / mouse click: highlighter handles selection automatically via setup({ world })
        const handleTouchStart = (event: TouchEvent) => {
          const touch = event.touches[0];
          const now = Date.now();

          console.log('[Touch] touchstart', {
            time: now,
            clientX: touch.clientX,
            clientY: touch.clientY,
            tapCount: tapCountRef.current,
            prevTime: touchStartRef.current?.time,
          });

          if (!touchStartRef.current || now - touchStartRef.current.time > 300) {
            touchStartRef.current = { time: now, x: touch.clientX, y: touch.clientY };
            tapCountRef.current = 1;
            console.log('[Touch] → First tap recorded');
          } else {
            tapCountRef.current = 2;
            if (tapTimeoutRef.current) {
              console.log('[Touch] → Clearing single-tap timeout for double-tap');
              clearTimeout(tapTimeoutRef.current);
              tapTimeoutRef.current = null;
            }
            event.preventDefault();
            // Double-tap: clear selection via highlighter
            console.log('[Touch] → Double-tap: clearing selection');
            highlighter.clear('select');
            touchStartRef.current = null;
            tapCountRef.current = 0;
          }
        };

        const handleTouchEnd = (event: TouchEvent) => {
          if (!touchStartRef.current) {
            console.log('[Touch] touchend — no touchStartRef, ignoring');
            return;
          }
          const touch = event.changedTouches[0];
          const dx = touch.clientX - touchStartRef.current.x;
          const dy = touch.clientY - touchStartRef.current.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          console.log('[Touch] touchend', {
            distance,
            tapCount: tapCountRef.current,
            willWait: tapCountRef.current === 1,
          });

          if (distance > 20) {
            console.log('[Touch] → Movement too large, cancelling tap');
            touchStartRef.current = null;
            tapCountRef.current = 0;
            if (tapTimeoutRef.current) {
              clearTimeout(tapTimeoutRef.current);
              tapTimeoutRef.current = null;
            }
            return;
          }

          if (tapCountRef.current === 1) {
            console.log('[Touch] → Starting 300ms double-tap wait');
            tapTimeoutRef.current = setTimeout(() => {
              if (tapCountRef.current === 1) {
                console.log('[Touch] → Single tap confirmed after wait');
                // Highlighter handles selection automatically via pointerdown → castRay
              }
              console.log('[Touch] → Resetting state after single-tap timeout');
              touchStartRef.current = null;
              tapCountRef.current = 0;
              tapTimeoutRef.current = null;
            }, 300);
          }
        };

        const handleTouchMove = (event: TouchEvent) => {
          if (!touchStartRef.current) return;
          const touch = event.touches[0];
          const dx = touch.clientX - touchStartRef.current.x;
          const dy = touch.clientY - touchStartRef.current.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          console.log('[Touch] touchmove', { distance, cancelled: distance > 20 });

          if (distance > 20) {
            console.log('[Touch] → Cancelling tap due to movement');
            touchStartRef.current = null;
            tapCountRef.current = 0;
            if (tapTimeoutRef.current) {
              clearTimeout(tapTimeoutRef.current);
              tapTimeoutRef.current = null;
            }
          }
        };

        // Wire up listeners (mouse clicks handled by highlighter automatically)
        container.addEventListener('touchstart', handleTouchStart, { passive: false });
        container.addEventListener('touchend', handleTouchEnd);
        container.addEventListener('touchmove', handleTouchMove);

        cleanup = () => {
          container.removeEventListener('touchstart', handleTouchStart);
          container.removeEventListener('touchend', handleTouchEnd);
          container.removeEventListener('touchmove', handleTouchMove);
          world.camera.controls.removeEventListener('update', onUpdate);
          if (workerUrl) URL.revokeObjectURL(workerUrl);
          try {
            components.dispose();
          } catch {
            // Ignore disposal errors
          }
        };
        console.log('=== FragmentViewer init successful ===');
      } catch (err) {
        console.error('FragmentViewer init error:', err);
        if (!disposed) {
          setError(
            err instanceof Error ? err.message : 'Failed to load model'
          );
          setLoading(false);
        }
      }
    };

    init();

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);

  return (
    <div>
      <div className="relative w-full h-[50vh] min-h-[300px] rounded-lg overflow-hidden border border-outline-variant">
        <div ref={containerRef} className="w-full h-full" />

        {loading && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface-container-low/80">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-primary-container border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm text-on-surface-variant">Loading IFC model…</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface-container-low/80">
            <div className="text-center px-4">
              <span className="material-symbols-outlined text-4xl text-error mb-2">
                error
              </span>
              <p className="text-sm text-error">{error}</p>
              <p className="text-xs text-on-surface-variant mt-1">
                Check console for details
              </p>
            </div>
          </div>
        )}
      </div>

      <PropertiesPanel
        data={selectedItemData}
        loading={isLoadingProperties}
        onClose={clearSelection}
      />
    </div>
  );
}
