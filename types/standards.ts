// Florida B.E.S.T Standards types

// Single benchmark from official standards list
export interface StandardBenchmark {
  code: string; // e.g., "ELA.K.F.1.1"
  strand: string; // "Foundational Skills"
  description: string;
  gradeLevel: 'K';
  category?: string; // "Phonics", "Comprehension", etc.
}

// Standards database
export interface StandardsDatabase {
  gradeLevel: 'K';
  standards: StandardBenchmark[];
  lastUpdated: string;
  source: 'FLDOE'; // Florida Department of Education
}

// Evidence for why a standard was selected
export interface StandardEvidence {
  field: string; // which lesson input field
  value: string; // the value that matched
}

// Candidate standard suggestion (from LLM Prompt #5)
export interface StandardCandidate {
  code: string;
  confidence: number;
  rationale: string;
  suggestedICan: string[]; // kid-friendly "I can" statements
  evidence: StandardEvidence[];
}

// Standards candidates result
export interface StandardsCandidatesResult {
  candidates: StandardCandidate[];
  confidenceNotes: {
    field: string;
    confidence: number;
    reason: string;
  }[];
  warnings: string[];
}

// Teacher-confirmed standards selection
export interface StandardsSelection {
  selectedCodes: string[]; // 1-3 benchmark codes
  iCanStatements: string[]; // teacher-approved statements
  confirmedAt: string;
  confirmedBy?: string; // teacher ID
  candidatesSource?: StandardsCandidatesResult; // original AI suggestions
}

// Standards alignment request
export interface StandardsAlignmentRequest {
  lessonInputs: Record<string, unknown>;
  allowedStandards: StandardBenchmark[];
}

// Standards-aligned question
export interface StandardsAlignedQuestion {
  text: string;
  skillTag: string;
  confidence: number;
}

export interface StandardsAlignedQuestionsResult {
  questions: StandardsAlignedQuestion[];
  confidenceNotes: {
    field: string;
    confidence: number;
    reason: string;
  }[];
}
