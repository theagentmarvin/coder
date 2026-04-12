/**
 * Update Parameters - Export IFC with modifications
 * This module provides export functionality using web-ifc API
 */
import { downloadExportedIfc } from './add-property';

export { downloadExportedIfc };

/**
 * Export and download the modified IFC file
 * @param modelId - The model ID from the fragments manager (string)
 */
export async function exportModifiedIfc(modelId: string): Promise<void> {
  await downloadExportedIfc(modelId, `exported_ifc_${Date.now()}.ifc`);
}
