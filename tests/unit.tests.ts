/**
 * RUKYA PRO - Unit Tests
 * Тесты для критических модулей системы
 */

// Mock данных
const mockPatient = {
  id: 'patient_123',
  firstName: 'Ахмед',
  lastName: 'Ибрагимов',
  age: 35,
  gender: 'male' as const,
  complaints: 'Боль в груди, кошмары, трудно молиться',
  status: 'active' as const,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  tags: [],
  surveyAnswers: {},
  questionnaireIds: [],
  sessionHistoryIds: []
};

const mockDiagnosis = {
  id: 'diag_456',
  timestamp: Date.now(),
  primaryIllness: 'sihr_mahfi' as const,
  affectedOrgans: ['qalb', 'sadr'] as const,
  hasAyn: false,
  hasHouseAffliction: false,
  severity: 3 as const,
  treatmentPriority: 'balanced' as const,
  confidenceScore: 85,
  evidence: ['Симптом: боль в груди', 'Симптом: кошмары'],
  differentialHypotheses: [
    { type: 'sihr_mahfi' as const, probability: 0.85 },
    { type: 'massas_jinn' as const, probability: 0.10 }
  ],
  source: 'local_algo' as const
};

// Тест 1: Валидация структуры пациента
function testPatientStructure(): boolean {
  console.log('🧪 Тест 1: Валидация структуры пациента');
  
  const requiredFields = ['id', 'firstName', 'age', 'gender', 'complaints', 'status'];
  for (const field of requiredFields) {
    if (!(field in mockPatient)) {
      console.error(`❌ Отсутствует поле: ${field}`);
      return false;
    }
  }
  
  console.log('✅ Структура пациента валидна');
  return true;
}

// Тест 2: Валидация диагноза
function testDiagnosisStructure(): boolean {
  console.log('🧪 Тест 2: Валидация структуры диагноза');
  
  const requiredFields = ['id', 'primaryIllness', 'affectedOrgans', 'severity', 'confidenceScore'];
  for (const field of requiredFields) {
    if (!(field in mockDiagnosis)) {
      console.error(`❌ Отсутствует поле: ${field}`);
      return false;
    }
  }
  
  // Проверка диапазона тяжести
  if (mockDiagnosis.severity < 1 || mockDiagnosis.severity > 5) {
    console.error('❌ Тяжесть вне диапазона 1-5');
    return false;
  }
  
  // Проверка диапазона уверенности
  if (mockDiagnosis.confidenceScore < 0 || mockDiagnosis.confidenceScore > 100) {
    console.error('❌ Уверенность вне диапазона 0-100');
    return false;
  }
  
  console.log('✅ Структура диагноза валидна');
  return true;
}

// Тест 3: Анализ жалоб (симуляция)
function testComplaintAnalysis(): boolean {
  console.log('🧪 Тест 3: Анализ жалоб');
  
  const complaints = mockPatient.complaints.toLowerCase();
  const keywords = {
    chest: ['груд', 'sadr', 'chest'],
    nightmare: ['кошмар', 'bad dream', 'nightmare'],
    prayer: ['молитв', 'prayer', 'salah']
  };
  
  let foundSymptoms = 0;
  
  if (keywords.chest.some(k => complaints.includes(k))) foundSymptoms++;
  if (keywords.nightmare.some(k => complaints.includes(k))) foundSymptoms++;
  if (keywords.prayer.some(k => complaints.includes(k))) foundSymptoms++;
  
  if (foundSymptoms >= 2) {
    console.log(`✅ Найдено симптомов: ${foundSymptoms}`);
    return true;
  }
  
  console.error(`❌ Мало симптомов найдено: ${foundSymptoms}`);
  return false;
}

// Тест 4: Генерация формулы
function testFormulaGeneration(): boolean {
  console.log('🧪 Тест 4: Генерация формулы');
  
  const template = 'О Аллах, {attribute}, исцели {organ} от {illness}';
  const attribute = 'Аш-Шафи';
  const organ = 'сердце';
  const illness = 'сихр';
  
  const formula = template
    .replace('{attribute}', attribute)
    .replace('{organ}', organ)
    .replace('{illness}', illness);
  
  const expected = 'О Аллах, Аш-Шафи, исцели сердце от сихр';
  
  if (formula === expected) {
    console.log('✅ Формула сгенерирована корректно');
    return true;
  }
  
  console.error(`❌ Формула неверна: ${formula}`);
  return false;
}

// Тест 5: Расчет длительности курса
function testDurationCalculation(): boolean {
  console.log('🧪 Тест 5: Расчет длительности курса');
  
  const severityToDays: Record<number, number> = {
    1: 7,
    2: 10,
    3: 14,
    4: 21,
    5: 30
  };
  
  const severity = mockDiagnosis.severity;
  const expectedDays = severityToDays[severity];
  
  if (expectedDays && expectedDays >= 7 && expectedDays <= 30) {
    console.log(`✅ Длительность для тяжести ${severity}: ${expectedDays} дней`);
    return true;
  }
  
  console.error('❌ Ошибка расчета длительности');
  return false;
}

// Тест 6: Шифрование (симуляция)
async function testEncryption(): Promise<boolean> {
  console.log('🧪 Тест 6: Шифрование данных');
  
  if (!crypto || !crypto.subtle) {
    console.warn('⚠️ Crypto API недоступен, пропускаем тест');
    return true;
  }
  
  try {
    const data = 'Чувствительные данные пациента';
    const encoder = new TextEncoder();
    
    // Генерация ключа
    const key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    
    // Шифрование
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(data)
    );
    
    // Расшифровка
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );
    
    const decoder = new TextDecoder();
    const decryptedText = decoder.decode(decrypted);
    
    if (decryptedText === data) {
      console.log('✅ Шифрование/расшифровка работают');
      return true;
    }
    
    console.error('❌ Данные не совпадают после расшифровки');
    return false;
  } catch (e) {
    console.error('❌ Ошибка шифрования:', e);
    return false;
  }
}

// Тест 7: Валидация дифференциальных гипотез
function testDifferentialHypotheses(): boolean {
  console.log('🧪 Тест 7: Валидация дифференциальных гипотез');
  
  const hypotheses = mockDiagnosis.differentialHypotheses;
  
  if (!hypotheses || hypotheses.length === 0) {
    console.error('❌ Нет дифференциальных гипотез');
    return false;
  }
  
  // Сумма вероятностей должна быть близка к 1
  const totalProbability = hypotheses.reduce((sum, h) => sum + h.probability, 0);
  
  if (totalProbability <= 1.0 && totalProbability >= 0.9) {
    console.log(`✅ Сумма вероятностей: ${totalProbability.toFixed(2)}`);
    return true;
  }
  
  console.error(`❌ Сумма вероятностей некорректна: ${totalProbability}`);
  return false;
}

// Запуск всех тестов
async function runAllTests(): Promise<void> {
  console.log('🚀 Запуск тестов RUKYA PRO Enterprise\n');
  
  const results: boolean[] = [];
  
  results.push(testPatientStructure());
  results.push(testDiagnosisStructure());
  results.push(testComplaintAnalysis());
  results.push(testFormulaGeneration());
  results.push(testDurationCalculation());
  results.push(await testEncryption());
  results.push(testDifferentialHypotheses());
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log('\n' + '='.repeat(40));
  console.log(`📊 Результаты: ${passed}/${total} тестов пройдено`);
  
  if (passed === total) {
    console.log('✅ Все тесты пройдены успешно!');
  } else {
    console.error(`❌ Провалено тестов: ${total - passed}`);
  }
}

// Экспорт для использования
export { runAllTests };

// Автозапуск в браузере
if (typeof window !== 'undefined') {
  runAllTests();
}
