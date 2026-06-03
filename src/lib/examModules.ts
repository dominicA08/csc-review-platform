export const EXAM_MODULES = [
  {
    id: 'graphs_charts_data',
    title: 'Graphs / Charts / Data',
    subtitle: 'Data interpretation, trend analysis, and pie charts',
    questionCount: 10,
    accentColor: '#06b6d4',
    questionCategories: [
      'graphs_charts_data',
      'Graphs / Charts / Data',
      'Graphs/Charts/Data',
    ],
    legacyCategories: [],
  },
  {
    id: 'vocabulary',
    title: 'Vocabulary',
    subtitle: 'Word meanings, context clues, and synonyms',
    questionCount: 20,
    accentColor: '#8b5cf6',
    questionCategories: [
      'vocabulary',
      'Vocabulary',
      'Vocabulary Questions',
    ],
    legacyCategories: ['Verbal Ability'],
  },
  {
    id: 'idiomatic_grammar',
    title: 'Idiomatic Expressions & Grammar',
    subtitle: 'Correct usage, idiomatic meanings, and spelling accuracy',
    questionCount: 20,
    accentColor: '#ec4899',
    questionCategories: [
      'idiomatic_grammar',
      'Idiomatic Expressions & Grammar',
      'Idiomatic Expressions and Correct Grammar and Spelling',
      'idiomatic expressions & grammar',
    ],
    legacyCategories: ['Verbal Ability'],
  },
  {
    id: 'analogy_logic',
    title: 'Analogy and Logic Test',
    subtitle: 'Word analogies, logical sequences, and conditional premises',
    questionCount: 20,
    accentColor: '#f59e0b',
    questionCategories: [
      'analogy_logic',
      'Analogy and Logic Test',
      'Word Analogy and Logic Test',
      'analogy & logic',
    ],
    legacyCategories: ['Verbal Ability'],
  },
  {
    id: 'reading_comprehension',
    title: 'Reading Comprehension',
    subtitle: 'Passage analysis, main ideas, and structural critical reading',
    questionCount: 20,
    accentColor: '#10b981',
    questionCategories: [
      'reading_comprehension',
      'Reading Comprehension',
      'Reading Comprehension Test',
      'reading comprehension',
    ],
    legacyCategories: ['Verbal Ability'],
  },
  {
    id: 'paragraph_organization',
    title: 'Paragraph Organization',
    subtitle: 'Arranging chronological logic and coherent sentence structures',
    questionCount: 15,
    accentColor: '#3b82f6',
    questionCategories: [
      'paragraph_organization',
      'Paragraph Organization',
      'paragraph organization',
    ],
    legacyCategories: ['Verbal Ability'],
  },
  {
    id: 'clerical_operations',
    title: 'Clerical Operations',
    subtitle: 'Office documents, basic filing systems, and vocational procedures',
    questionCount: 10,
    accentColor: '#64748b',
    questionCategories: [
      'clerical_operations',
      'Clerical Operations',
      'clerical operations',
    ],
    legacyCategories: ['Verbal Ability'],
  },
  {
    id: 'constitution_general_info',
    title: 'Constitution & General Info',
    subtitle: 'Philippine Constitution, civic mandates, and national events',
    questionCount: 15,
    accentColor: '#ef4444',
    questionCategories: [
      'constitution_general_info',
      'Constitution & General Info',
      'Constitution & General Information',
      'constitution & general info',
      'constitution and general info',
    ],
    legacyCategories: ['Verbal Ability'],
  },
  {
    id: 'numerical_reasoning',
    title: 'Numerical Reasoning',
    subtitle: 'PEMDAS arithmetic, percentages, algebraic word problems, and series',
    questionCount: 30,
    accentColor: '#3b82f6',
    questionCategories: [
      'numerical_reasoning',
      'Numerical Reasoning',
      'numerical reasoning',
    ],
    legacyCategories: ['Numerical Ability'],
  },
] as const

export type ExamModuleConfig = (typeof EXAM_MODULES)[number]
export type ExamModuleId = ExamModuleConfig['id']

function normalizeLookupKey(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

const MODULE_LOOKUP = new Map<string, ExamModuleConfig>()

for (const moduleConfig of EXAM_MODULES) {
  MODULE_LOOKUP.set(normalizeLookupKey(moduleConfig.id), moduleConfig)
  MODULE_LOOKUP.set(normalizeLookupKey(moduleConfig.title), moduleConfig)

  for (const category of moduleConfig.questionCategories) {
    MODULE_LOOKUP.set(normalizeLookupKey(category), moduleConfig)
  }
}

function unique(values: readonly string[]) {
  return Array.from(new Set(values.filter(Boolean)))
}

function titleizeUnknownModule(value: string) {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export function getExamModule(moduleParam: string | null) {
  if (!moduleParam) return undefined

  return MODULE_LOOKUP.get(normalizeLookupKey(moduleParam))
}

export function getQuestionCategoryFilters(moduleParam: string | null) {
  if (!moduleParam) return []

  const moduleConfig = getExamModule(moduleParam)
  if (!moduleConfig) return [moduleParam]

  return unique([
    ...moduleConfig.questionCategories,
    ...moduleConfig.legacyCategories,
  ])
}

export function getProgressCategory(moduleParam: string | null, isFullExam: boolean) {
  if (isFullExam) return 'full'

  const moduleConfig = getExamModule(moduleParam)
  return moduleConfig?.id ?? moduleParam ?? 'general'
}

export function getModuleLabel(moduleParam: string | null, isFullExam: boolean) {
  if (!moduleParam) return isFullExam ? 'Full Diagnostic Exam' : 'General Ability'

  const moduleConfig = getExamModule(moduleParam)
  return moduleConfig?.title ?? titleizeUnknownModule(moduleParam)
}

export function mapCategoryToDbString(categoryParam: string | null): string {
  if (!categoryParam) return ''

  const normalized = categoryParam
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/&/g, 'and')
    .replace(/\s+/g, ' ')
    .trim()

  switch (normalized) {
    case 'graphs charts data':
    case 'graphs/charts/data':
    case 'graphs / charts / data':
    case 'graphs':
    case 'charts':
    case 'data':
    case 'data interpretation':
      return 'Graphs / Charts / Data'

    case 'vocabulary':
    case 'vocabulary questions':
    case 'vocab':
      return 'vocabulary'

    case 'idiomatic grammar':
    case 'idiomatic expressions and grammar':
    case 'idiomatic expressions & grammar':
    case 'grammar':
    case 'spelling':
    case 'idiomatic expressions and correct grammar and spelling':
      return 'idiomatic expressions & grammar'

    case 'analogy logic':
    case 'analogy and logic test':
    case 'word analogy and logic test':
    case 'word analogy':
    case 'logic':
    case 'logic test':
    case 'analogy and logic':
      return 'analogy & logic'

    case 'reading comprehension':
    case 'reading comprehension test':
    case 'comprehension':
      return 'reading comprehension'

    case 'paragraph organization':
    case 'paragraph':
    case 'organization':
      return 'paragraph organization'

    case 'clerical operations':
    case 'clerical':
    case 'operations':
      return 'clerical operations'

    case 'constitution general info':
    case 'constitution & general info':
    case 'constitution and general info':
    case 'philippine constitution':
    case 'general info':
    case 'constitution':
      return 'constitution & general info'

    case 'numerical reasoning':
    case 'numerical':
    case 'reasoning':
      return 'numerical reasoning'

    default:
      if (normalized.includes('graph') || normalized.includes('chart') || normalized.includes('data')) {
        return 'Graphs / Charts / Data'
      }
      if (normalized.includes('vocabulary') || normalized.includes('vocab')) {
        return 'vocabulary'
      }
      if (normalized.includes('grammar') || normalized.includes('spelling') || normalized.includes('idiom')) {
        return 'idiomatic expressions & grammar'
      }
      if (normalized.includes('analogy') || normalized.includes('logic')) {
        return 'analogy & logic'
      }
      if (normalized.includes('reading') || normalized.includes('comprehension')) {
        return 'reading comprehension'
      }
      if (normalized.includes('paragraph') || normalized.includes('organization')) {
        return 'paragraph organization'
      }
      if (normalized.includes('clerical') || normalized.includes('operation')) {
        return 'clerical operations'
      }
      if (normalized.includes('constitution') || normalized.includes('general info') || normalized.includes('philippine')) {
        return 'constitution & general info'
      }
      if (normalized.includes('numerical') || normalized.includes('reasoning') || normalized.includes('math')) {
        return 'numerical reasoning'
      }

      return categoryParam
  }
}
