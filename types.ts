export type VolumeUnit = 'mL' | 'L';
export type ConcentrationUnit = 'M' | 'mM'; // M = mol/L

// Specific Buffer Salts known to the system
export type BufferSaltType = 
  | 'NONE'
  // Carbonates
  | 'Na2CO3' | 'K2CO3' | 'NaHCO3' | 'KHCO3'
  // Phosphates
  | 'Na3PO4' | 'K3PO4' | 'Na2HPO4' | 'K2HPO4' | 'NaH2PO4' | 'KH2PO4'
  // Ammonium
  | 'NH4Cl' | 'NH4OH';

export interface BufferConfig {
  id: string; // Unique ID for list management
  saltType: BufferSaltType;
  concentrationGL: number; // g/L
}

export interface LabParameters {
  currentPH: number;
  targetPH: number;
  volume: number;
  volumeUnit: VolumeUnit;
  concentration: number;
  concentrationUnit: ConcentrationUnit;
  buffers: BufferConfig[]; // Changed from single config to array
  empiricalFactor: number; // Optional safety factor
}

export interface BufferDetail {
  id: string;
  molarity: number; // M
}

export interface CalculationResult {
  volumeToAdd: number; // in mL
  reagentType: 'Acid' | 'Base' | 'None';
  molesNeeded: number;
  bufferDetails: BufferDetail[]; // Details for each buffer
}