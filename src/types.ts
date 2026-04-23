// ── Curriculum (local JSON) ───────────────────────────────────────────────────

export interface CurriculumCourse {
  course_id: string;
  course_title: string;
  no_of_topics: number;
  order: number;
}

export interface CurriculumSubject {
  subject_id: string;
  subject_title: string;
  category: string;
  subject_code: string;
  semester_courses: CurriculumCourse[];
}

export interface CurriculumSemester {
  semester_id: string;
  semester_name: string;
  semester_subjects: CurriculumSubject[];
}

export interface CurriculumYear {
  year: string;
  semester_details: CurriculumSemester[];
}

export interface Curriculum {
  curriculum_details: CurriculumYear[];
}

// ── Course Details API ────────────────────────────────────────────────────────

export interface Topic {
  topic_id: string;
  topic_name: string;
  order: number;
  completion_status: string;
  is_topic_locked: boolean;
  completion_percentage: number;
}

export interface CourseDetails {
  course_id: string;
  course_title: string;
  completion_status: string;
  topics: Topic[];
  completion_percentage: number;
}

// ── Unit Details API ──────────────────────────────────────────────────────────

export type UnitType =
  | "LEARNING_SET"
  | "PRACTICE"
  | "QUIZ"
  | "ASSESSMENT"
  | "QUESTION_SET"
  | "PROJECT"
  | string;

// Unit type constants to avoid stringly-typed code
export const UNIT_TYPE = {
  LEARNING_SET: "LEARNING_SET",
  PRACTICE: "PRACTICE",
  QUIZ: "QUIZ",
  ASSESSMENT: "ASSESSMENT",
  QUESTION_SET: "QUESTION_SET",
  PROJECT: "PROJECT",
} as const;

// Question status constants
export const QUESTION_STATUS = {
  CORRECT: "CORRECT",
  COMPLETED: "COMPLETED",
} as const;

export interface LearningSetDetails {
  name: string;
  content_type: string;
}

export interface PracticeUnitDetails {
  exam_content_type: string;
  name: string;
}

export interface QuizUnitDetails {
  exam_content_type: string;
  name: string;
}

export interface AssessmentUnitDetails {
  name: string;
}

export interface QuestionSetUnitDetails {
  name: string;
}

export interface Unit {
  unit_id: string;
  unit_type: UnitType;
  order: number;
  is_unit_locked: boolean;
  completion_status: string;
  completion_percentage: number;
  learning_resource_set_unit_details: LearningSetDetails | null;
  practice_unit_details: PracticeUnitDetails | null;
  quiz_unit_details: QuizUnitDetails | null;
  assessment_unit_details: AssessmentUnitDetails | null;
  question_set_unit_details: QuestionSetUnitDetails | null;
}

export interface TopicUnitsResponse {
  units_details: Unit[];
}

// ── Exam / Practice API ───────────────────────────────────────────────────────

export interface ExamAttemptResponse {
  exam_attempt_id: string;
}

export interface QuestionOption {
  option_id: string;
  order: number;
  content: string;
  content_type: string;
}

export interface CodeAnalysis {
  code_analysis_id: string;
  code_details: {
    code: string;
    language: string;
  };
}

export interface Question {
  question_id: string;
  question_number: number;
  question_type: string;
  question: {
    content: string;
    content_type: string;
  };
  options: QuestionOption[];
  code_analysis: CodeAnalysis | null;
}

export interface QuestionsResponse {
  questions: Question[];
  questions_stats: {
    correct_answer_count: number;
    incorrect_answer_count: number;
    unanswered_count: number;
    total_questions_count: number;
  };
}

export interface QuestionResponse {
  question_id: string;
  question_number: number;
  time_spent: number;
  multiple_choice_answer_id: string;
}

export interface SubmitResult {
  submission_result: Array<{
    question_id: string;
    evaluation_result: "CORRECT" | "INCORRECT" | string;
    question_score: number;
    user_response_score: number;
  }>;
  questions_stats: {
    correct_answer_count: number;
    incorrect_answer_count: number;
    total_questions_count: number;
  };
  current_total_score: number;
}

// ── Question Set (Coding) API ─────────────────────────────────────────────────

export type CodingLanguage = "CPP" | "JAVA" | "PYTHON" | "NODE_JS" | string;

export interface CodingQuestionSummary {
  question_id: string;
  question_status: string;
  short_text: string;
  difficulty: string;
  applicable_languages: CodingLanguage[];
  max_question_score: number;
}

export interface CodingTestCase {
  test_case_id: string;
  input: string;
  output: string;
  has_multiple_outputs: boolean;
  possible_outputs: string[];
}

export interface CodingCode {
  code_id: string;
  code_content: string; // itself a JSON-stringified string (has extra surrounding quotes)
  language: CodingLanguage;
}

export interface CodingQuestionDetail {
  question_id: string;
  question_type: "CODING";
  question: {
    content: string;
    content_type: string;
    short_text: string;
    difficulty: string;
    acceptance_percentage?: number;
  };
  code: CodingCode;            // default template
  latest_saved_code: CodingCode | null;
  test_cases: CodingTestCase[];
  all_test_case_ids: string[];
}

export interface CodingQuestionsResponse {
  questions: CodingQuestionDetail[];
}

// submit (sync — works for all; also the path for NODE_JS)
export interface CodingSubmitResponse {
  submission_result: Array<{
    question_id: string;
    question_score: number;
    user_response_score: number;
    user_response_id: number;
    evaluation_result: "CORRECT" | "INCORRECT" | string;
    passed_test_cases_count: number;
    total_test_cases_count: number;
    failing_test_case_details: null | object;
    error_explanation_details: null | object;
  }>;
}

// submit v2 (async — CPP/Java/Python)
export interface CodingSubmitV2Response {
  evaluation_details: Array<{
    question_id: string;
    evaluation_id: string;
  }>;
}

export interface CodingSubmissionStatusResponse {
  submission_id: string;
  submission_status: "CORRECT" | "INCORRECT" | "PENDING" | string;
  total_test_cases_count: number;
  number_of_test_cases_passed: number;
  failing_test_case_details: null | object;
  submission_code: string;
  language: CodingLanguage;
}

// ── Question Set (SQL) API ────────────────────────────────────────────────────

export interface SqlQuestion {
  question_id: string;
  question_status: string;
  question_number: number;
  question_type: "SQL_CODING";
  question: {
    content: string;
    content_type: string;
    short_text: string | null;
    difficulty: string;
  };
  default_code: {
    code_id: string;
    code_content: string;
    language: "SQL";
  };
  latest_saved_code: null | { code_content: string; language: string };
}

export interface SqlQuestionsResponse {
  learning_resource_details: object;
  db_url: string;
  questions: SqlQuestion[];
}

export interface SqlSubmitResponse {
  submission_results: Array<{
    question_id: string;
    user_response_id: number;
    evaluation_result: "CORRECT" | "INCORRECT" | string;
    coding_submission_response: {
      reason_for_error: string | null;
      passed_test_cases_count: number;
      total_test_cases_count: number;
      reason_for_failures: string[];
    };
  }>;
}

// ── CLI Config ────────────────────────────────────────────────────────────────

export type CompletionMode = "learning_sets" | "practice" | "question_sets" | "all";

export interface RunConfig {
  token: string;
  cerebrasKey: string;
  selectedCourses: SelectedCourse[];
  mode: CompletionMode;
  skipCompleted: boolean;
  delayMs: number;
}

export interface SelectedCourse {
  course_id: string;
  course_title: string;
  topicLimit: number | "all";
}
