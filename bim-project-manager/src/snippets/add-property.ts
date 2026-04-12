/**
 * Add Property to IFC Element
 * Uses a standalone web-ifc instance (dual-instance bridge) to edit IFC data.
 * The fragments viewer handles rendering; this module handles IFC mutation.
 */
import { IfcAPI, STRING, REAL, INTEGER } from 'web-ifc';

// IFC type codes
const IFCPROPERTYSET = 1451395588;
const IFCPROPERTYSINGLEVALUE = 3650150729;
const IFCRELDEFINESBYPROPERTIES = 4186316022;
const IFCOWNERHISTORY = 1209451410;
const IFCPERSON = 4189048028;
const IFCORGANIZATION = 4208778838;
const IFCPERSONANDORGANIZATION = 103090709;
const IFCAPPLICATION = 639542469;

let webIfcInstance: IfcAPI | null = null;
let ifcBuffer: Uint8Array | null = null;
let numericModelId: number | null = null;

/**
 * Initialize the web-ifc API instance from the original IFC buffer.
 * Must be called before any add/export operations.
 */
export async function initWebIfc(buffer: Uint8Array): Promise<IfcAPI> {
  if (!webIfcInstance) {
    webIfcInstance = new IfcAPI();
    await webIfcInstance.Init();
    numericModelId = webIfcInstance.OpenModel(buffer);
    ifcBuffer = buffer;
    console.log('[add-property] web-ifc model opened, numericModelId:', numericModelId);
  }
  return webIfcInstance;
}

/**
 * Get the original IFC buffer (for debugging / re-init).
 */
export function getIfcBuffer(): Uint8Array | null {
  return ifcBuffer;
}

/**
 * Get the web-ifc API instance.
 */
export function getWebIfc(): IfcAPI | null {
  return webIfcInstance;
}

/**
 * Generate a 22-character IFC GUID (Base64-like encoding).
 * Uses the IFC character set: 0-9, A-Z, a-z, _, $
 */
function generateIfcGuid(): string {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_$';
  let guid = '';
  for (let i = 0; i < 22; i++) {
    guid += chars[Math.floor(Math.random() * 64)];
  }
  return guid;
}

/**
 * Build a typed nominal value object for CreateIfcEntity.
 */
function buildNominalValue(
  propValue: string | number | boolean,
  propType: 'IfcLabel' | 'IfcReal' | 'IfcBoolean'
): { nominalValue: string | number; nominalType: number } {
  if (propType === 'IfcLabel') {
    return { nominalValue: String(propValue), nominalType: STRING };
  } else if (propType === 'IfcReal') {
    return { nominalValue: Number(propValue), nominalType: REAL };
  } else {
    return { nominalValue: propValue ? 1 : 0, nominalType: INTEGER };
  }
}

/**
 * Get or create a minimal OwnerHistory entity.
 * In IFC2X3 OwnerHistory is required (not nullable) on PropertySet/RelDefinesByProperties.
 * Tries to reuse an existing one first; creates a minimal placeholder if none found.
 */
function getOrCreateOwnerHistory(modelID: number): number {
  if (!webIfcInstance) return 0;

  // Try to find an existing OwnerHistory
  const ownerHistories = webIfcInstance.GetLineIDsWithType(modelID, IFCOWNERHISTORY);
  if (ownerHistories && ownerHistories.size() > 0) {
    return ownerHistories.get(0);
  }

  // Create minimal OwnerHistory chain
  try {
    const person = webIfcInstance.CreateIfcEntity(
      modelID, IFCPERSON,
      null, null, null, null, null, null, null, null, null
    );
    webIfcInstance.WriteLine(modelID, person);

    const org = webIfcInstance.CreateIfcEntity(
      modelID, IFCORGANIZATION,
      null, null, null, null, null
    );
    webIfcInstance.WriteLine(modelID, org);

    const personAndOrg = webIfcInstance.CreateIfcEntity(
      modelID, IFCPERSONANDORGANIZATION,
      { type: 5, value: (person as any).expressID },
      { type: 5, value: (org as any).expressID },
      null
    );
    webIfcInstance.WriteLine(modelID, personAndOrg);

    const app = webIfcInstance.CreateIfcEntity(
      modelID, IFCAPPLICATION,
      { type: 5, value: (org as any).expressID },
      null, null, null
    );
    webIfcInstance.WriteLine(modelID, app);

    const ownerHistory = webIfcInstance.CreateIfcEntity(
      modelID, IFCOWNERHISTORY,
      { type: 5, value: (personAndOrg as any).expressID },
      { type: 5, value: (app as any).expressID },
      null, null, null, null, null, null
    );
    webIfcInstance.WriteLine(modelID, ownerHistory);
    console.log('[add-property] Created OwnerHistory, expressID:', (ownerHistory as any).expressID);
    return (ownerHistory as any).expressID;
  } catch (e) {
    console.warn('[add-property] Could not create OwnerHistory, fallback to 0.', e);
    return 0;
  }
}

/**
 * Add a property to an IFC element.
 *
 * @param _modelId   - Ignored (kept for API compat). Uses internal numericModelId.
 * @param elementId  - The expressID of the target element.
 * @param propName   - Property name.
 * @param propValue  - Property value.
 * @param propType   - 'IfcLabel' | 'IfcReal' | 'IfcBoolean'
 */
export async function addPropertyToElement(
  _modelId: string,
  elementId: number,
  propName: string,
  propValue: string | number | boolean,
  propType: 'IfcLabel' | 'IfcReal' | 'IfcBoolean'
): Promise<boolean> {
  if (!webIfcInstance || numericModelId === null) {
    console.error('[add-property] web-ifc not initialized — call initWebIfc(buffer) first');
    return false;
  }

  try {
    const modelID = numericModelId;

    // OwnerHistory (required by IFC2X3 schema)
    const ownerHistoryId = getOrCreateOwnerHistory(modelID);

    // GUIDs for new entities
    const psetGuid = generateIfcGuid();
    const relGuid = generateIfcGuid();

    // Nominal value
    const { nominalValue, nominalType } = buildNominalValue(propValue, propType);

    // --- Create IfcPropertySingleValue with ALL required constructor args ---
    const propSingleValue = webIfcInstance.CreateIfcEntity(
      modelID,
      IFCPROPERTYSINGLEVALUE,
      { type: STRING, value: propName },        // Name
      null,                                       // Description
      { type: nominalType, value: nominalValue }, // NominalValue
      null                                        // Unit
    );
    webIfcInstance.WriteLine(modelID, propSingleValue);
    const propExpressId = (propSingleValue as any).expressID;

    // --- Get existing property sets or create a new one ---
    let psetExpressId: number;

    // Use web-ifc directly to find existing Psets (avoids Properties helper dependency)
    const existingPsets = webIfcInstance.GetLineIDsWithType(modelID, IFCPROPERTYSET);
    // We need to find Psets already attached to this element — try via RelDefinesByProperties
    let foundExistingPset = false;
    if (existingPsets && existingPsets.size() > 0) {
      const rels = webIfcInstance.GetLineIDsWithType(modelID, IFCRELDEFINESBYPROPERTIES);
      if (rels && rels.size() > 0) {
        for (let i = 0; i < rels.size(); i++) {
          const relId = rels.get(i);
          const relLine = webIfcInstance.GetLine(modelID, relId);
          if (!relLine) continue;
          // Check if this relation involves our element
          const relatedObjects = relLine.RelatedObjects;
          if (relatedObjects && Array.isArray(relatedObjects)) {
            const hasElement = relatedObjects.some(
              (ref: any) => ref && (ref.value === elementId || ref === elementId)
            );
            if (hasElement && relLine.RelatingPropertyDefinition) {
              psetExpressId = relLine.RelatingPropertyDefinition.value;
              // Append the new property to this Pset
              const psetLine = webIfcInstance.GetLine(modelID, psetExpressId);
              if (psetLine) {
                if (psetLine.HasProperties && Array.isArray(psetLine.HasProperties)) {
                  psetLine.HasProperties.push({ type: 5, value: propExpressId });
                } else {
                  psetLine.HasProperties = [{ type: 5, value: propExpressId }];
                }
                webIfcInstance.WriteLine(modelID, psetLine);
                foundExistingPset = true;
                break;
              }
            }
          }
        }
      }
    }

    if (!foundExistingPset) {
      // --- Create new IfcPropertySet with ALL required constructor args ---
      const pset = webIfcInstance.CreateIfcEntity(
        modelID,
        IFCPROPERTYSET,
        { type: STRING, value: psetGuid },           // GlobalId
        { type: 5, value: ownerHistoryId },            // OwnerHistory
        { type: STRING, value: 'CustomPropertySet' },  // Name
        null,                                           // Description
        [{ type: 5, value: propExpressId }]             // HasProperties
      );
      webIfcInstance.WriteLine(modelID, pset);
      psetExpressId = (pset as any).expressID;

      // --- Create IfcRelDefinesByProperties to link Pset → element ---
      const rel = webIfcInstance.CreateIfcEntity(
        modelID,
        IFCRELDEFINESBYPROPERTIES,
        { type: STRING, value: relGuid },   // GlobalId
        { type: 5, value: ownerHistoryId },  // OwnerHistory
        null,                                 // Name
        null,                                 // Description
        [{ type: 5, value: elementId }],      // RelatedObjects
        { type: 5, value: psetExpressId }     // RelatingPropertyDefinition
      );
      webIfcInstance.WriteLine(modelID, rel);
    }

    console.log(`[add-property] Added "${propName}" to element ${elementId}`);
    return true;
  } catch (error) {
    console.error('[add-property] Error adding property:', error);
    return false;
  }
}

/**
 * Export the modified IFC model.
 *
 * @param _modelId - Ignored (kept for API compat). Uses internal numericModelId.
 */
export async function exportModifiedIfc(_modelId: string): Promise<Uint8Array | null> {
  if (!webIfcInstance || numericModelId === null) {
    console.error('[add-property] web-ifc not initialized');
    return null;
  }

  try {
    const savedData = webIfcInstance.SaveModel(numericModelId);
    if (!savedData) {
      console.error('[add-property] SaveModel failed');
      return null;
    }
    console.log('[add-property] IFC exported, size:', savedData.byteLength);
    return new Uint8Array(savedData);
  } catch (error) {
    console.error('[add-property] Error exporting IFC:', error);
    return null;
  }
}

/**
 * Export and download the modified IFC to a file.
 */
export async function downloadExportedIfc(modelId: string, filename?: string): Promise<void> {
  const buffer = await exportModifiedIfc(modelId);

  if (!buffer) {
    console.error('[add-property] No buffer to download');
    return;
  }

  const blob = new Blob([buffer], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `modified_ifc_${Date.now()}.ifc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  console.log('[add-property] IFC downloaded:', link.download);
}
