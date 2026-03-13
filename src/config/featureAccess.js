export const FEATURES = {
  COMPLIANCE_SCORE: 'compliance_score',
  READINESS_SCORE: 'readiness_score',
  EXPORT_REPORTS: 'export_reports',
  DOCUMENT_MANAGEMENT: 'document_management',
  DOCUMENT_UPLOAD: 'document_upload',
  TAXABLE_LIABILITY: 'taxable_liability',
};

const allTrue = {
  [FEATURES.COMPLIANCE_SCORE]: true,
  [FEATURES.READINESS_SCORE]: true,
  [FEATURES.EXPORT_REPORTS]: true,
  [FEATURES.DOCUMENT_MANAGEMENT]: true,
  [FEATURES.DOCUMENT_UPLOAD]: true,
  [FEATURES.TAXABLE_LIABILITY]: true,
};

const allFalse = {
  [FEATURES.COMPLIANCE_SCORE]: false,
  [FEATURES.READINESS_SCORE]: false,
  [FEATURES.EXPORT_REPORTS]: false,
  [FEATURES.DOCUMENT_MANAGEMENT]: false,
  [FEATURES.DOCUMENT_UPLOAD]: false,
  [FEATURES.TAXABLE_LIABILITY]: false,
};

const ACCESS_MATRIX = {
  trial: { ...allTrue },
  none: { ...allFalse },
  lite: { ...allFalse },
  full: { ...allTrue },
};

export const getAccessForPlan = (plan) => ACCESS_MATRIX[plan] || ACCESS_MATRIX.none;
export default ACCESS_MATRIX;
