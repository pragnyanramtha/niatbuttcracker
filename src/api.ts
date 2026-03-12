import axios, { type AxiosInstance } from "axios";
import type {
  CourseDetails,
  TopicUnitsResponse,
  ExamAttemptResponse,
  QuestionsResponse,
  QuestionResponse,
  SubmitResult,
  CodingQuestionSummary,
  CodingQuestionsResponse,
  CodingSubmitResponse,
  CodingSubmitV2Response,
  CodingSubmissionStatusResponse,
  SqlQuestionsResponse,
  SqlSubmitResponse,
} from "./types.js";

const API_BASE = "https://nkb-backend-ccbp-prod-apis.ccbp.in";

// The CCBP API wraps all payloads in a double-encoded JSON envelope.
// Inner object → JSON string → that string JSON-stringified → data field.
function buildPayload(inner: object): { data: string; clientKeyDetailsId: number } {
  return { data: JSON.stringify(JSON.stringify(inner)), clientKeyDetailsId: 1 };
}

export function createClient(token: string): AxiosInstance {
  return axios.create({
    baseURL: API_BASE,
    headers: {
      accept: "application/json",
      "accept-language": "en-US,en;q=0.9",
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      origin: "https://learning.ccbp.in",
      referer: "https://learning.ccbp.in/",
      "sec-ch-ua": '"Not:A-Brand";v="99", "Google Chrome";v="145", "Chromium";v="145"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-site",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
      "x-app-version": "1128",
      "x-browser-session-id": crypto.randomUUID(),
    },
  });
}

// ── Course & Topic ────────────────────────────────────────────────────────────

export async function getCourseDetails(
  client: AxiosInstance,
  courseId: string
): Promise<CourseDetails> {
  const { data } = await client.post<CourseDetails>(
    "/api/nkb_resources/user/course_details/v4/",
    buildPayload({
      course_id: courseId,
      is_session_plan_details_required: true,
      is_certification_details_required: false,
    })
  );
  return data;
}

export async function getTopicUnits(
  client: AxiosInstance,
  topicId: string,
  courseId: string
): Promise<TopicUnitsResponse> {
  const { data } = await client.post<TopicUnitsResponse>(
    "/api/nkb_resources/user/topic/units_details/v3/",
    buildPayload({ topic_id: topicId, course_id: courseId })
  );
  return data;
}

// ── Learning Sets ─────────────────────────────────────────────────────────────

export async function completeLearningSet(
  client: AxiosInstance,
  learningSetId: string
): Promise<void> {
  await client.post(
    "/api/nkb_learning_resource/learning_resources/set/complete/",
    buildPayload({ learning_resource_set_id: learningSetId })
  );
}

// ── Practice / Exam ───────────────────────────────────────────────────────────

export async function createExamAttempt(
  client: AxiosInstance,
  examId: string
): Promise<ExamAttemptResponse> {
  const { data } = await client.post<ExamAttemptResponse>(
    "/api/nkb_exam/user/exam/exam_attempt/",
    buildPayload({ exam_id: examId })
  );
  return data;
}

export async function getExamQuestions(
  client: AxiosInstance,
  examAttemptId: string
): Promise<QuestionsResponse> {
  const { data } = await client.post<QuestionsResponse>(
    "/api/nkb_primitive_coding/user/exam_attempt/primitive_coding/questions/?offset=0&length=999",
    buildPayload({ exam_attempt_id: examAttemptId })
  );
  return data;
}

export async function submitAnswers(
  client: AxiosInstance,
  examAttemptId: string,
  responses: QuestionResponse[],
  totalTimeSpent: number
): Promise<SubmitResult> {
  const { data } = await client.post<SubmitResult>(
    "/api/nkb_primitive_coding/user/exam_attempt/primitive_coding/submit/",
    buildPayload({ exam_attempt_id: examAttemptId, total_time_spent: totalTimeSpent, responses })
  );
  return data;
}

export async function endExamAttempt(
  client: AxiosInstance,
  examAttemptId: string
): Promise<void> {
  await client.post(
    "/api/nkb_exam/user/exam_attempt/end/",
    buildPayload({
      exam_attempt_id: examAttemptId,
      end_reason_enum: "ENDED_BY_USER_BY_NAVIGATING_BACK",
    })
  );
}

// ── Question Set — Coding ─────────────────────────────────────────────────────

export async function getCodingQuestionsSummary(
  client: AxiosInstance,
  questionSetId: string
): Promise<CodingQuestionSummary[]> {
  const { data } = await client.post<CodingQuestionSummary[]>(
    "/api/nkb_coding_practice/user/coding/questions/summary/?offset=0&length=999",
    buildPayload({ question_set_id: questionSetId })
  );
  return data;
}

export async function getCodingQuestions(
  client: AxiosInstance,
  questionIds: string[]
): Promise<CodingQuestionsResponse> {
  const { data } = await client.post<CodingQuestionsResponse>(
    "/api/nkb_coding_practice/user/coding/questions/",
    buildPayload({ question_ids: questionIds })
  );
  return data;
}

// Sync submit — returns result immediately (works for NODE_JS, sometimes CPP/Python)
export async function submitCodingAnswers(
  client: AxiosInstance,
  responses: Array<{ question_id: string; time_spent: number; coding_answer: { code_content: string; language: string } }>
): Promise<CodingSubmitResponse> {
  const { data } = await client.post<CodingSubmitResponse>(
    "/api/nkb_coding_practice/question/coding/submit/",
    buildPayload({ responses })
  );
  return data;
}

// Async submit v2 — returns evaluation_id to poll later
export async function submitCodingAnswersV2(
  client: AxiosInstance,
  responses: Array<{ question_id: string; time_spent: number; coding_answer: { code_content: string; language: string } }>
): Promise<CodingSubmitV2Response> {
  const { data } = await client.post<CodingSubmitV2Response>(
    "/api/nkb_coding_practice/question/coding/submit/v2/",
    buildPayload({ responses })
  );
  return data;
}

// Poll submission status by submission_id (same UUID as evaluation_id from v2)
export async function getCodingSubmissionStatus(
  client: AxiosInstance,
  submissionId: string
): Promise<CodingSubmissionStatusResponse> {
  const { data } = await client.post<CodingSubmissionStatusResponse>(
    "/api/nkb_coding_practice/question/coding/submission/",
    buildPayload({ submission_id: submissionId })
  );
  return data;
}

// ── Question Set — SQL ────────────────────────────────────────────────────────

export async function getSqlQuestions(
  client: AxiosInstance,
  questionSetId: string
): Promise<SqlQuestionsResponse> {
  const { data } = await client.post<SqlQuestionsResponse>(
    "/api/nkb_coding_practice/questions/sql/v1/?offset=0&length=999",
    buildPayload({ question_set_id: questionSetId })
  );
  return data;
}

export async function submitSqlAnswers(
  client: AxiosInstance,
  responses: Array<{ question_id: string; time_spent: number; user_response_code: { code_content: string; language: "SQL" } }>
): Promise<SqlSubmitResponse> {
  const { data } = await client.post<SqlSubmitResponse>(
    "/api/nkb_coding_practice/questions/sql/submit/v1/",
    buildPayload({ responses })
  );
  return data;
}
