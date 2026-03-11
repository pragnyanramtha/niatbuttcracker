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

// ── CLI Config ────────────────────────────────────────────────────────────────

export type CompletionMode = "learning_sets" | "practice" | "both";

export interface RunConfig {
  token: string;
  groqKey: string;
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
