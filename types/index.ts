/**
 * RUKYA PRO - Enterprise Type Definitions
 * Строгая типизация для всей системы
 */

// --- Базовые типы ---

export type ID = string;
export type Timestamp = number;

export type PatientStatus = 'active' | 'paused' | 'completed' | 'archived';
export type Gender = 'male' | 'female';
export type SeverityLevel = 1 | 2 | 3 | 4 | 5;

export type IllnessType = 
  | 'sihr_mahfi' | 'sihr_tafriq' | 'sihr_mahabba' | 'sihr_bayt' | 'sihr_mujaddad'
  | 'massas_jinn' | 'ayn_hasida' | 'hasad' | 'waswasa_dini' | 'khawf' | 'huzn' | 'ghadab';

export type OrganKey = 
  | 'qalb' | 'sadr' | 'batn' | 'ras' | 'jasad' | 'aql' | 'qalb_aql' | 'zahr' | 'unuq' | 'yadayn' | 'rijlayn';

export type JinnType = 'marid' | 'amir' | 'qarin' | 'unknown';
export type JinnLocation = 'heart' | 'stomach' | 'chest' | 'head' | 'general';

// --- Диагностика ---

export interface DiagnosisResult {
  id: ID;
  timestamp: Timestamp;
  patientId?: ID;
  
  // Основной диагноз
  primaryIllness: IllnessType;
  secondaryIllnesses?: IllnessType[];
  
  // Локализация
  affectedOrgans: OrganKey[];
  jinnPresence?: {
    detected: boolean;
    type?: JinnType;
    location?: JinnLocation;
    confidence: number; // 0-1
  };
  
  // Сглаз и дом
  hasAyn: boolean;
  hasHouseAffliction: boolean;
  
  // Параметры
  severity: SeverityLevel;
  treatmentPriority: 'jinn_first' | 'ayn_first' | 'sihr_first' | 'balanced';
  
  // AI и аналитика
  confidenceScore: number; // 0-100
  evidence: string[];
  differentialHypotheses: { type: IllnessType; probability: number }[];
  healerNotes?: string;
  
  // Источник диагноза
  source: 'manual' | 'local_algo' | 'ai_deepseek' | 'import_json';
}

// --- Пациент ---

export interface Patient {
  id: ID;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt?: Timestamp; // Soft delete
  archivedAt?: Timestamp;
  
  // Личные данные (подлежат шифрованию)
  firstName: string;
  lastName?: string;
  age: number;
  gender: Gender;
  phone?: string;
  city?: string;
  groupId?: ID;
  tags: string[];
  photoUrl?: string;
  
  // Клинические данные
  complaints: string;
  voiceComplaintUrl?: string;
  surveyAnswers: Record<string, boolean>;
  
  // Текущее состояние
  currentDiagnosis?: DiagnosisResult;
  status: PatientStatus;
  nextVisitDate?: Timestamp;
  
  // Ссылки
  activePlanId?: ID;
  questionnaireIds: ID[];
  sessionHistoryIds: ID[];
}

// --- План лечения ---

export interface Formula {
  id: ID;
  arabicText: string;
  transliteration: string;
  translation: string;
  attribute?: string; // Имя Аллаха
  action: string; // Действие (развязать, изгнать)
  targetOrgan?: OrganKey;
  targetIllness?: IllnessType;
  repetitions: number;
  section: 'cleansing' | 'homeBlock' | 'defense' | 'closing' | 'waterOil' | 'final' | 'soulKnots' | 'dua';
  order: number;
}

export interface TreatmentPlan {
  id: ID;
  patientId: ID;
  createdAt: Timestamp;
  startDate: Timestamp;
  endDate: Timestamp;
  durationDays: number;
  
  diagnosisSnapshot: DiagnosisResult;
  programId: string;
  programName: string;
  
  formulas: Formula[];
  dailySchedule: Record<number, Formula[]>; // День -> Список формул
  
  status: 'active' | 'paused' | 'completed';
  completedDays: number;
  
  settings: {
    detailLevel: 'short' | 'medium' | 'full';
    includeSoulKnots: boolean;
    formulaLimit?: number;
  };
}

// --- Мониторинг и Сеансы ---

export type SymptomStatus = 'inactive' | 'active' | 'improved';

export interface SymptomLog {
  symptomId: string;
  status: SymptomStatus;
  note?: string;
  timestamp: Timestamp;
}

export interface Session {
  id: ID;
  patientId: ID;
  planId: ID;
  date: Timestamp;
  durationMinutes?: number;
  
  formulasUsed: ID[];
  reactions: string;
  healerNotes: string;
  
  symptomsBefore: SymptomLog[];
  symptomsAfter: SymptomLog[];
  progressDelta: number; // -10 to +10
}

// --- Аудит и Безопасность ---

export type AuditAction = 
  | 'CREATE' | 'UPDATE' | 'DELETE' | 'ARCHIVE' | 'RESTORE' 
  | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'DIAGNOSE' | 'PLAN_GENERATE';

export interface AuditLog {
  id: ID;
  timestamp: Timestamp;
  userId: string;
  action: AuditAction;
  entityType: 'patient' | 'plan' | 'settings' | 'user';
  entityId: ID;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  ipAddress?: string;
  userAgent?: string;
}

// --- Настройки ---

export interface AppSettings {
  theme: string;
  fontSize: 'xs' | 's' | 'm' | 'l' | 'xl';
  density: 'comfort' | 'compact';
  highContrast: boolean;
  deepSeekApiKey?: string;
  healerName: string;
  encryptionEnabled: boolean;
  encryptionKeySalt?: string;
  autoLogoutMinutes: number;
}

// --- Утилиты ---

export interface EncryptedData {
  iv: string; // Base64
  data: string; // Base64 ciphertext
  authTag: string; // Base64
}

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
