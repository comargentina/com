/**
 * Single chokepoint for the persisted identification `source`. A machine
 * identification ALWAYS carries its plugin source and must NEVER be
 * coerced to 'human' — that would launder an AI guess into a human
 * validation and corrupt expert-weighted consensus (#1128 R1). 'human'
 * is correct ONLY when the identification is the observer's own (no
 * machine result, i.e. manual taxon entry).
 */
export function resolveIdentificationSource(input: {
  machineSource: string | null | undefined;
  hasMachineResult: boolean;
}): string {
  if (input.hasMachineResult) {
    const s = (input.machineSource ?? '').trim();
    if (!s) {
      throw new Error(
        'identification has a machine result but no source — refusing to write it as human (consensus-integrity guard, #1128 R1)',
      );
    }
    // Map client-side sources to allowed database values
    const sourceMap: Record<string, string> = {
      'bioclip_2': 'onnx_efficientnet_lite0',
      'birdnet_lite': 'birdnet_lite',
      'phi_vision': 'phi_vision',
      'megadetector': 'camera_trap_megadetector',
      'plantnet': 'plantnet',
      'claude_haiku': 'claude_haiku',
      'claude_sonnet': 'claude_sonnet',
      'onnx_offline': 'onnx_offline',
      'bedrock': 'bedrock',
      'openai': 'openai',
      'azure_openai': 'azure_openai',
      'gemini': 'gemini',
      'vertex_ai': 'vertex_ai',
    };
    return sourceMap[s] || s;
  }
  return 'human';
}
