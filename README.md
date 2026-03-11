First fully read curriculum.json.

Most of the information there is useless, other than the course IDs. And maybe the Course Names.

Once we get the course IDs, the frontend sends a request like this. 

curl 'https://nkb-backend-ccbp-prod-apis.ccbp.in/api/nkb_resources/user/course_details/v4/' \
  -H 'accept: application/json' \
  -H 'accept-language: en-US,en;q=0.9' \
  -H 'authorization: Bearer hq3gHrQ0HxIshqs4NUb2kDKRGYmGSl' \
  -H 'content-type: application/json' \
  -H 'origin: https://learning.ccbp.in' \
  -H 'priority: u=1, i' \
  -H 'referer: https://learning.ccbp.in/' \
  -H 'sec-ch-ua: "Not:A-Brand";v="99", "Google Chrome";v="145", "Chromium";v="145"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "Windows"' \
  -H 'sec-fetch-dest: empty' \
  -H 'sec-fetch-mode: cors' \
  -H 'sec-fetch-site: same-site' \
  -H 'user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36' \
  -H 'x-app-version: 1128' \
  -H 'x-browser-session-id: 3a1eb40e-0310-4282-aaec-00d1d8023092' \
  --data-raw '{"data":"\"{\\\"course_id\\\":\\\"6d41f350-76d5-4337-9be0-3fe0b26b1b26\\\",\\\"is_session_plan_details_required\\\":true,\\\"is_certification_details_required\\\":false}\"","clientKeyDetailsId":1}'

Which gives us a response like 

{
    "course_id": "6d41f350-76d5-4337-9be0-3fe0b26b1b26",
    "completion_status": "IN_PROGRESS",
    "topics": [
        {
            "topic_id": "2eb327eb-536d-4a33-ba64-4b93efe5dbd1",
            "topic_name": "Introduction to HTML",
            "topic_duration_in_sec": 0,
            "order": 1,
            "completion_status": "IN_PROGRESS",
            "is_topic_locked": false,
            "unlocks_at_datetime": null,
            "completion_percentage": 66.66667,
            "units": []
        },
        {
            "topic_id": "3c7136ec-b385-4dc6-8598-50e19b361a6b",
            "topic_name": "Introduction to CSS",
            "topic_duration_in_sec": 0,
            "order": 2,
            "completion_status": "IN_PROGRESS",
            "is_topic_locked": false,
            "unlocks_at_datetime": null,
            "completion_percentage": 73.33333,
            "units": []
        },
       ...
        {
            "topic_id": "a05521cc-a282-4280-a527-289c0c9c8f7b",
            "topic_name": "Introduction to Bootstrap & Developing Layouts",
            "topic_duration_in_sec": 0,
            "order": 5,
            "completion_status": "IN_PROGRESS",
            "is_topic_locked": false,
            "unlocks_at_datetime": null,
            "completion_percentage": 58.33333,
            "units": []
        },
        {
            "topic_id": "3bed61fd-4268-4c60-bb1a-847d7643e50d",
            "topic_name": "Developing Layouts",
            "topic_duration_in_sec": 0,
            "order": 6,
            "completion_status": "IN_PROGRESS",
            "is_topic_locked": false,
            "unlocks_at_datetime": null,
            "completion_percentage": 69.23077,
            "units": [
                {
                    .... some units, which u will know about later 
        },
       .....
        {
            "topic_id": "2cf6ad7e-b1e1-4416-8f02-28d323875155",
            "topic_name": "Revision",
            "topic_duration_in_sec": 0,
            "order": 11,
            "completion_status": "COMPLETED",
            "is_topic_locked": false,
            "unlocks_at_datetime": null,
            "completion_percentage": 100.0,
            "units": []
        },
        {
            "topic_id": "d007470e-502c-4fb4-b92b-51b0cb815f57",
            "topic_name": "Build Your Own Static Website Course Quiz",
            "topic_duration_in_sec": 0,
            "order": 12,
            "completion_status": "COMPLETED",
            "is_topic_locked": false,
            "unlocks_at_datetime": null,
            "completion_percentage": 100.0,
            "units": []
        }
    ],
    "course_multimedia": {
        "multimedia_url": "https://d1tgh8fmlzexmh.cloudfront.net/otg_prod/media/Tech_4.0/Frontend_Developer/Responsive_Web_Design/Responsive_Web_Design%402x.png",
        "thumbnail_url": null,
        "format": "IMAGE"
    },
    "completion_percentage": 70.27373,
    "availability_status": "UNLOCKED",
    "course_metadata": "{\"learners_count\": \"864\", \"technologies\": [\"HTML\", \"CSS\"], \"industry_tag\": \"Beginner Friendly\", \"value_prop\": \"Over 90% of websites start with these skills\", \"background_color\": \"orange\", \"usecase_tag\": \"dailyClasses\", \"rating\": \"4.7\", \"learning_type\": \"Course\", \"category\": [{\"enum\": \"FRONTEND_AND_WEB_DEVELOPMENT\", \"title\": \"Frontend & Web Development\", \"order\": 3, \"course_order\": 1}], \"skills\": [\"HTML\", \"CSS\"], \"enrolled_count\": 43748, \"marketing_data\": {\"industry_insight\": \"Over 90% of websites start with these skills\"}, \"skills_youll_gain\": [\"HTML\", \"CSS\"], \"learning_outcomes\": [\"Build a static website using HTML, CSS, and Bootstrap to ensure it looks great on mobile screens\", \"Develop a tourism website that allows users to browse content, videos, and images of popular destinations, as well as venues for conferences and events\", \"Publish the website and share it with friends, family, and beyond\"], \"redirectToGCCourseDetailPage\": true, \"course_icon_url\": [\"https://media-content.ccbp.in/ccbp_prod/media/programs/Other+Courses/Academy_my_journey_icons/static_v1.png\"], \"redirect_to_gc_course_detail_page\": true, \"skills_set\": [\"HTML\", \"CSS\"]}",
    "course_title": "Build Your Own Static Website",
    "course_description": "Build a static website that appears beautifully on mobile screens. Develop a Tourism website to browse through the content, videos, and images of popular destinations, websites to host conferences and events, etc. Publish your website and share it with your friends, family and beyond. Learn to use tools and technologies such as HTML, CSS and Bootstrap.",
    "duration_in_sec": 5400,
    "current_topic_id": "3bed61fd-4268-4c60-bb1a-847d7643e50d",
    "current_unit_id": "afb637a2-181e-4256-8f0d-7a8faa9f4030",
    "is_certification_available": null,
    "discussions_config": {
        "enable_discussions": false
    }
}


For more information on each topic, we have to hit this API. Using the topic IDs as described above.

curl 'https://nkb-backend-ccbp-prod-apis.ccbp.in/api/nkb_resources/user/topic/units_details/v3/' \
  -H 'accept: application/json' \
  -H 'accept-language: en-US,en;q=0.9' \
  -H 'authorization: Bearer 0ofYUzH0nL7ufuLf01QQiIskLyffKY' \
  -H 'content-type: application/json' \
  -H 'origin: https://learning.ccbp.in' \
  -H 'priority: u=1, i' \
  -H 'referer: https://learning.ccbp.in/' \
  -H 'sec-ch-ua: "Not:A-Brand";v="99", "Google Chrome";v="145", "Chromium";v="145"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "Windows"' \
  -H 'sec-fetch-dest: empty' \
  -H 'sec-fetch-mode: cors' \
  -H 'sec-fetch-site: same-site' \
  -H 'user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36' \
  -H 'x-app-version: 1128' \
  -H 'x-browser-session-id: 3a1eb40e-0310-4282-aaec-00d1d8023092' \
  --data-raw '{"data":"\"{\\\"topic_id\\\":\\\"3c7136ec-b385-4dc6-8598-50e19b361a6b\\\",\\\"course_id\\\":\\\"6d41f350-76d5-4337-9be0-3fe0b26b1b26\\\"}\"","clientKeyDetailsId":1}'


It should give us a response like.

{
    "units_details": [
        {
            "unit_id": "beb8932c-b4b9-4a6f-a6b0-c98777bafb90",
            "unit_type": "LEARNING_SET",
            "order": 0,
            "unit_duration_in_sec": 0,
            "is_unit_locked": false,
            "exam_unit_details": null,
            "assessment_unit_details": null,
            "learning_resource_set_unit_details": {
                "name": "Leveraging Gen AI for accelerated learning",
                "content_type": "DEFAULT"
            },
            "practice_unit_details": null,
            "quiz_unit_details": null,
            "project_unit_details": null,
            "question_set_unit_details": null,
            "assignment_unit_details": null,
            "adaptive_video_question_set_details": null,
            "coding_contest_unit_details": null,
            "completion_status": "COMPLETED",
            "time_left_to_unlock_in_seconds": null,
            "unlocks_at_datetime": null,
            "completion_percentage": 100.0,
            "is_unit_considered_for_certification": false,
            "sub_topic": null
        },
        ....
        {
            "unit_id": "c01a232a-6aab-4933-80c0-fa26e35668e9",
            "unit_type": "QUIZ",
            "order": 4,
            "unit_duration_in_sec": 0,
            "is_unit_locked": true,
            "exam_unit_details": null,
            "assessment_unit_details": null,
            "learning_resource_set_unit_details": null,
            "practice_unit_details": null,
            "quiz_unit_details": {
                "exam_content_type": "PRIMITIVE_CODING",
                "name": "Class Room Quiz A"
            },
            "project_unit_details": null,
            "question_set_unit_details": null,
            "assignment_unit_details": null,
            "adaptive_video_question_set_details": null,
            "coding_contest_unit_details": null,
            "completion_status": "YET_TO_START",
            "time_left_to_unlock_in_seconds": null,
            "unlocks_at_datetime": null,
            "completion_percentage": 0.0,
            "is_unit_considered_for_certification": false,
            "sub_topic": null
        },
       
        {
            "unit_id": "9eb1589d-acf9-4069-800c-21649c397413",
            "unit_type": "PRACTICE",
            "order": 6,
            "unit_duration_in_sec": 0,
            "is_unit_locked": false,
            "exam_unit_details": null,
            "assessment_unit_details": null,
            "learning_resource_set_unit_details": null,
            "practice_unit_details": {
                "exam_content_type": "PRIMITIVE_CODING",
                "name": "MCQ Practice"
            },
            "quiz_unit_details": null,
            "project_unit_details": null,
            "question_set_unit_details": null,
            "assignment_unit_details": null,
            "adaptive_video_question_set_details": null,
            "coding_contest_unit_details": null,
            "completion_status": "COMPLETED",
            "time_left_to_unlock_in_seconds": null,
            "unlocks_at_datetime": null,
            "completion_percentage": 100.0,
            "is_unit_considered_for_certification": false,
            "sub_topic": null
        },
        {
            "unit_id": "18a5aa46-0ec0-4f44-9b01-95e7ebb9a3a7",
            "unit_type": "QUESTION_SET",
            "order": 7,
            "unit_duration_in_sec": 0,
            "is_unit_locked": false,
            "exam_unit_details": null,
            "assessment_unit_details": null,
            "learning_resource_set_unit_details": null,
            "practice_unit_details": null,
            "quiz_unit_details": null,
            "project_unit_details": null,
            "question_set_unit_details": {
                "title": "Coding Practice",
                "question_set_content_type": "HTML_CODING"
            },
            "assignment_unit_details": null,
            "adaptive_video_question_set_details": null,
            "coding_contest_unit_details": null,
            "completion_status": "COMPLETED",
            "time_left_to_unlock_in_seconds": null,
            "unlocks_at_datetime": null,
            "completion_percentage": 100.0,
            "is_unit_considered_for_certification": false,
            "sub_topic": null
        },
        {
            "unit_id": "bea4e2e0-13d6-46ed-b456-c9b554a742b1",
            "unit_type": "LEARNING_SET",
            "order": 8,
            "unit_duration_in_sec": 0,
            "is_unit_locked": false,
            "exam_unit_details": null,
            "assessment_unit_details": null,
            "learning_resource_set_unit_details": {
                "name": "Introduction to CSS | Part 2",
                "content_type": "DEFAULT"
            },
            "practice_unit_details": null,
            "quiz_unit_details": null,
            "project_unit_details": null,
            "question_set_unit_details": null,
            "assignment_unit_details": null,
            "adaptive_video_question_set_details": null,
            "coding_contest_unit_details": null,
            "completion_status": "COMPLETED",
            "time_left_to_unlock_in_seconds": null,
            "unlocks_at_datetime": null,
            "completion_percentage": 100.0,
            "is_unit_considered_for_certification": false,
            "sub_topic": null
        },
        
        {
            "unit_id": "60aa58ae-2e8d-4d8a-a7b1-eecc90443775",
            "unit_type": "ASSESSMENT",
            "order": 14,
            "unit_duration_in_sec": 0,
            "is_unit_locked": true,
            "exam_unit_details": null,
            "assessment_unit_details": {
                "name": "Module Quiz - 1"
            },
            "learning_resource_set_unit_details": null,
            "practice_unit_details": null,
            "quiz_unit_details": null,
            "project_unit_details": null,
            "question_set_unit_details": null,
            "assignment_unit_details": null,
            "adaptive_video_question_set_details": null,
            "coding_contest_unit_details": null,
            "completion_status": "COMPLETED",
            "time_left_to_unlock_in_seconds": null,
            "unlocks_at_datetime": null,
            "completion_percentage": 100.0,
            "is_unit_considered_for_certification": false,
            "sub_topic": null
        }
    ]
}


Here, all we care about are the unit IDs. 

Let's say we want to complete a learning_set.

Here is how to complete it. 

curl 'https://nkb-backend-ccbp-prod-apis.ccbp.in/api/nkb_learning_resource/learning_resources/set/complete/' \
  -H 'accept: application/json' \
  -H 'accept-language: en-US,en;q=0.9' \
  -H 'authorization: Bearer 0ofYUzH0nL7ufuLf01QQiIskLyffKY' \
  -H 'content-type: application/json' \
  -H 'origin: https://learning.ccbp.in' \
  -H 'priority: u=1, i' \
  -H 'referer: https://learning.ccbp.in/' \
  -H 'sec-ch-ua: "Not:A-Brand";v="99", "Google Chrome";v="145", "Chromium";v="145"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "Windows"' \
  -H 'sec-fetch-dest: empty' \
  -H 'sec-fetch-mode: cors' \
  -H 'sec-fetch-site: same-site' \
  -H 'user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36' \
  -H 'x-app-version: 1128' \
  -H 'x-browser-session-id: 1e9445f6-18f5-4e5e-87bd-77b12ee3c4dd' \
  --data-raw '{"data":"\"{\\\"learning_resource_set_id\\\":\\\"6dc39559-a901-4fb2-a723-0a45875d28b9\\\"}\"","clientKeyDetailsId":1}'


Now this is possible to do for learning sets, but not quizzes, Practice or question sets or assessments.

you can skip focusing on quizes for now.

but here is what you can do for practice sets.

first hit 

curl 'https://nkb-backend-ccbp-prod-apis.ccbp.in/api/nkb_exam/exam/exams_configuration/' \
  -H 'accept: application/json' \
  -H 'accept-language: en-US,en;q=0.9' \
  -H 'authorization: Bearer 0ofYUzH0nL7ufuLf01QQiIskLyffKY' \
  -H 'content-type: application/json' \
  -H 'origin: https://learning.ccbp.in' \
  -H 'priority: u=1, i' \
  -H 'referer: https://learning.ccbp.in/' \
  -H 'sec-ch-ua: "Not:A-Brand";v="99", "Google Chrome";v="145", "Chromium";v="145"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "Windows"' \
  -H 'sec-fetch-dest: empty' \
  -H 'sec-fetch-mode: cors' \
  -H 'sec-fetch-site: same-site' \
  -H 'user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36' \
  -H 'x-app-version: 1128' \
  -H 'x-browser-session-id: 70ae1bf4-57ef-46a5-a4b4-de57d07e8dda' \
  --data-raw '{"data":"\"{\\\"exam_id_list\\\":[\\\"64cf47bc-8491-42d3-a7bb-c914a031aefa\\\"]}\"","clientKeyDetailsId":1}'

you will get something like

{
    "exams_configuration": [
        {
            "exam_id": "64cf47bc-8491-42d3-a7bb-c914a031aefa",
            "title": "MCQ Practice",
            "description": "MCQ Practice",
            "exam_content_type": "PRIMITIVE_CODING",
            "exam_duration": "0",
            "questions_jumbling": true,
            "send_solutions": true,
            "send_hints": false,
            "enable_discussions": true,
            "enable_attempt_review": true,
            "instructions": "{\"default\": [\"<b>Number of Questions:</b> 20\", \"<b>Types of Questions: </b> MCQs\", \"<b>Marking Scheme: </b> All questions have equal weightage. Every correct response gets +1 mark. There is no negative marking.\", \"You must answer all the MCQs correctly in order to mark your practice as completed.\"]}",
            "time_gap_between_attempts": null,
            "max_attempts_for_user": 100,
            "exam_view_mode": null,
            "default_question_configuration": {
                "default_time_limit": "120.0",
                "default_scoring_config": {
                    "correct_answer_score": 1.0,
                    "wrong_answer_score": 0.0,
                    "solved_correct_score": 0.0,
                    "solved_incorrect_score": 0.0,
                    "unsolved_correct_score": 0.0,
                    "unsolved_incorrect_score": 0.0
                },
                "default_skip_config": {
                    "skip": true,
                    "enable_time": 10
                },
                "max_repeat_count": 3
            },
            "learning_resources_enabled_types": [
                {
                    "learning_resource_enable_type": "EXAMPLE",
                    "is_enabled": false
                },
                {
                    "learning_resource_enable_type": "SOLUTION",
                    "is_enabled": false
                },
                {
                    "learning_resource_enable_type": "HINT",
                    "is_enabled": false
                }
            ],
            "submission_configuration": {
                "multiple_submissions": false,
                "scoring_mode_for_submission": "BEST",
                "show_answer_enabled": false,
                "show_answer_scoring_mode": "INCORRECT"
            },
            "exam_scoring_config": {
                "answer_seen_scoring_mode": "DEFAULT",
                "user_response_scoring_mode": "DEFAULT",
                "total_scoring_mode": "DEFAULT",
                "total_max_score": 20.0,
                "min_score_to_pass": 16.0,
                "show_score": true
            },
            "score_masking_config": {
                "score_masking_type": "",
                "min_correct_questions": 0,
                "min_total_score": 0.0
            },
            "question_picking_config": {
                "question_picking_mode": "COMPLETION_STATE_BASED_ORDER",
                "order_for_questions": [
                    "UNANSWERED",
                    "SKIPPED"
                ],
                "order_of_levels": [],
                "level_wise_scoring": [],
                "solved_percent": 0
            },
            "exam_integrity_config": null,
            "exam_review_config": {
                "review_mode": "ALL",
                "send_solutions": true
            },
            "exam_plagiarism_config": {
                "is_plagiarism_enabled": false
            },
            "media_quality_config": {
                "should_check_audio_clarity": false
            },
            "exam_grading_config": {
                "is_grading_enabled": false,
                "should_show_grade_points": false
            },
            "submission_result_config": {
                "show_submission_result": true
            },
            "notification_config": {
                "is_notification_enabled": false
            }
        }
    ]
}

all you need to care about in this is exam id.

curl 'https://nkb-backend-ccbp-prod-apis.ccbp.in/api/nkb_exam/user/exam/exam_attempt/' \
  -H 'accept: application/json' \
  -H 'accept-language: en-US,en;q=0.9' \
  -H 'authorization: Bearer 0ofYUzH0nL7ufuLf01QQiIskLyffKY' \
  -H 'content-type: application/json' \
  -H 'origin: https://learning.ccbp.in' \
  -H 'priority: u=1, i' \
  -H 'referer: https://learning.ccbp.in/' \
  -H 'sec-ch-ua: "Not:A-Brand";v="99", "Google Chrome";v="145", "Chromium";v="145"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "Windows"' \
  -H 'sec-fetch-dest: empty' \
  -H 'sec-fetch-mode: cors' \
  -H 'sec-fetch-site: same-site' \
  -H 'user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36' \
  -H 'x-app-version: 1128' \
  -H 'x-browser-session-id: 0613101a-a05c-42a4-a6f8-e0a61765fb66' \
  --data-raw '{"data":"\"{\\\"exam_id\\\":\\\"64cf47bc-8491-42d3-a7bb-c914a031aefa\\\"}\"","clientKeyDetailsId":1}'

this will give a response: like 

{"exam_attempt_id":"6f162c31-cb1c-4fb0-b2ef-1089d6651602"}

then you need to hit 

curl 'https://nkb-backend-ccbp-prod-apis.ccbp.in/api/nkb_primitive_coding/user/exam_attempt/primitive_coding/questions/?offset=0&length=999' \
  -H 'accept: application/json' \
  -H 'accept-language: en-US,en;q=0.9' \
  -H 'authorization: Bearer 0ofYUzH0nL7ufuLf01QQiIskLyffKY' \
  -H 'content-type: application/json' \
  -H 'origin: https://learning.ccbp.in' \
  -H 'priority: u=1, i' \
  -H 'referer: https://learning.ccbp.in/' \
  -H 'sec-ch-ua: "Not:A-Brand";v="99", "Google Chrome";v="145", "Chromium";v="145"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "Windows"' \
  -H 'sec-fetch-dest: empty' \
  -H 'sec-fetch-mode: cors' \
  -H 'sec-fetch-site: same-site' \
  -H 'user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36' \
  -H 'x-app-version: 1128' \
  -H 'x-browser-session-id: 0613101a-a05c-42a4-a6f8-e0a61765fb66' \
  --data-raw '{"data":"\"{\\\"exam_attempt_id\\\":\\\"6f162c31-cb1c-4fb0-b2ef-1089d6651602\\\"}\"","clientKeyDetailsId":1}'

  which will give a reply like 

  {
    "questions": [
        {
            "available_languages": [
                "en"
            ],
            "selected_language": "en",
            "ai_evaluation_response_fields": null,
            "audio_answer_evaluation_type": null,
            "audio_answer_duration_limit_in_seconds": null,
            "textual_answer_character_limit": null,
            "question_type": "MULTIPLE_CHOICE",
            "question_id": "9cfc53d1-6af9-459f-8cee-8cc672754b99",
            "question_number": 1,
            "question": {
                "content": "Which of the following is correct?",
                "short_text": "",
                "multimedia": [],
                "content_type": "TEXT",
                "difficulty": null
            },
            "options": [
                {
                    "option_id": "13b81334-4a1b-477b-9130-a1eb0cce70d0",
                    "order": 1,
                    "content": "Both of the given options",
                    "short_text": null,
                    "multimedia": [],
                    "content_type": "TEXT",
                    "metadata": null
                },
                {
                    "option_id": "c1a9c7ee-599b-4b01-99e3-43057f84b958",
                    "order": 2,
                    "content": "The keyword \"let\" is used to create the variables",
                    "short_text": null,
                    "multimedia": [],
                    "content_type": "TEXT",
                    "metadata": null
                },
                {
                    "option_id": "162d7bf1-7214-4fcb-9b68-6419bc98f4a4",
                    "order": 3,
                    "content": "Assignment operator (=) is used to store data in the variable",
                    "short_text": null,
                    "multimedia": [],
                    "content_type": "TEXT",
                    "metadata": null
                }
            ],
            "code_analysis": null,
            "fib_coding": null,
            "fib_sql_coding": null,
            "interactive_builder_details": null,
            "question_configuration": {
                "time_limit": 120,
                "scoring_configuration": {
                    "correct_answer_score": 1.0,
                    "wrong_answer_score": 0.0
                },
                "skip_configuration": {
                    "skip_enabled": true,
                    "skip_enabled_time": 10
                }
            }
        },
        
        {
            "available_languages": [
                "en"
            ],
            "selected_language": "en",
            "ai_evaluation_response_fields": null,
            "audio_answer_evaluation_type": null,
            "audio_answer_duration_limit_in_seconds": null,
            "textual_answer_character_limit": null,
            "question_type": "CODE_ANALYSIS_MULTIPLE_CHOICE",
            "question_id": "4743fe97-450c-4609-9928-48bd4990e1e7",
            "question_number": 3,
            "question": {
                "content": "What is the mistake in the given code snippet?<br>",
                "short_text": null,
                "multimedia": [],
                "content_type": "HTML",
                "difficulty": null
            },
            "options": [
                {
                    "option_id": "453cef58-f2ee-482d-9c1e-c6a041db432d",
                    "order": 2,
                    "content": "Missing quotes",
                    "short_text": null,
                    "multimedia": [],
                    "content_type": "TEXT",
                    "metadata": null
                },
                {
                    "option_id": "ba6113f3-f414-4309-b78d-6c8c2fc965ca",
                    "order": 1,
                    "content": "Missing parentheses",
                    "short_text": null,
                    "multimedia": [],
                    "content_type": "TEXT",
                    "metadata": null
                },
                {
                    "option_id": "d948543d-3877-427e-9436-e94af014cab5",
                    "order": 3,
                    "content": "Missing dot (.)",
                    "short_text": null,
                    "multimedia": [],
                    "content_type": "TEXT",
                    "metadata": null
                }
            ],
            "code_analysis": {
                "code_analysis_id": "0b4a8e65-3546-426a-a130-3c38fadfc31c",
                "title": "CODE_ANALYSIS",
                "is_debug_mode_enabled": false,
                "is_run_code_enabled": false,
                "code_details": {
                    "code_id": "5afd3d0b-d408-4357-9c11-46805f6232e8",
                    "code": "let message = \"Happy Programming!!!\";\nconsole.log(message;",
                    "language": "JAVASCRIPT"
                },
                "available_code_languages": [
                    "JAVASCRIPT"
                ],
                "repository_details": null
            },
            "fib_coding": null,
            "fib_sql_coding": null,
            "interactive_builder_details": null,
            "test_cases": [],
            "question_configuration": {
                "time_limit": 120,
                "scoring_configuration": {
                    "correct_answer_score": 1.0,
                    "wrong_answer_score": 0.0
                },
                "skip_configuration": {
                    "skip_enabled": true,
                    "skip_enabled_time": 10
                }
            }
        },
       
            "code_analysis": {
                "code_analysis_id": "efb996b8-3b45-4418-8796-c3afb3653ae5",
                "title": "CODE_ANALYSIS",
                "is_debug_mode_enabled": false,
                "is_run_code_enabled": false,
                "code_details": {
                    "code_id": "89f12c60-de22-487b-8a8c-c20f84199cbd",
                    "code": "console.log(123);",
                    "language": "JAVASCRIPT"
                },
                "available_code_languages": [
                    "JAVASCRIPT"
                ],
                "repository_details": null
            },
            "fib_coding": null,
            "fib_sql_coding": null,
            "interactive_builder_details": null,
            "test_cases": [],
            "question_configuration": {
                "time_limit": 120,
                "scoring_configuration": {
                    "correct_answer_score": 1.0,
                    "wrong_answer_score": 0.0
                },
                "skip_configuration": {
                    "skip_enabled": true,
                    "skip_enabled_time": 10
                }
            }
        },
            "code_analysis": {
                "code_analysis_id": "06087b0c-2a48-472f-8e54-dd5fc631210f",
                "title": "CODE_ANALYSIS",
                "is_debug_mode_enabled": false,
                "is_run_code_enabled": false,
                "code_details": {
                    "code_id": "01ec5594-6bd4-4803-9948-db1d414c6d00",
                    "code": "console.log(7-5);",
                    "language": "JAVASCRIPT"
                },
                "available_code_languages": [
                    "JAVASCRIPT"
                ],
                "repository_details": null
            },
            "fib_coding": null,
            "fib_sql_coding": null,
            "interactive_builder_details": null,
            "test_cases": [],
            "question_configuration": {
                "time_limit": 120,
                "scoring_configuration": {
                    "correct_answer_score": 1.0,
                    "wrong_answer_score": 0.0
                },
                "skip_configuration": {
                    "skip_enabled": true,
                    "skip_enabled_time": 10
                }
            }
        },
            "code_analysis": {
                "code_analysis_id": "1a37c94e-5e13-42f8-9e93-7901b81b2b9d",
                "title": "CODE_ANALYSIS",
                "is_debug_mode_enabled": false,
                "is_run_code_enabled": false,
                "code_details": {
                    "code_id": "f9ab23de-9b35-43b4-b707-7d5a399e3eae",
                    "code": "let number = -17;\nconsole.log(number);",
                    "language": "JAVASCRIPT"
                },
                "available_code_languages": [
                    "JAVASCRIPT"
                ],
                "repository_details": null
            },
            "fib_coding": null,
            "fib_sql_coding": null,
            "interactive_builder_details": null,
            "test_cases": [],
            "question_configuration": {
                "time_limit": 120,
                "scoring_configuration": {
                    "correct_answer_score": 1.0,
                    "wrong_answer_score": 0.0
                },
                "skip_configuration": {
                    "skip_enabled": true,
                    "skip_enabled_time": 10
                }
            }
        },
        {
            "available_languages": [
                "en"
            ],
            "selected_language": "en",
            "ai_evaluation_response_fields": null,
            "audio_answer_evaluation_type": null,
            "audio_answer_duration_limit_in_seconds": null,
            "textual_answer_character_limit": null,
            "question_type": "CODE_ANALYSIS_MULTIPLE_CHOICE",
            "question_id": "5e1c06d5-2b17-41d7-91e9-6ecfd48023c6",
            "question_number": 13,
            "question": {
                "content": "What would be the output of the given JavaScript code in the console?<br>",
                "short_text": null,
                "multimedia": [],
                "content_type": "HTML",
                "difficulty": null
            },
            "options": [
                {
                    "option_id": "32215846-e2e8-4f34-83fd-abf96482f312",
                    "order": 2,
                    "content": "75",
                    "short_text": null,
                    "multimedia": [],
                    "content_type": "TEXT",
                    "metadata": null
                },
                {
                    "option_id": "322d17ec-c127-4773-9a2c-41de8c40597e",
                    "order": 4,
                    "content": "92",
                    "short_text": null,
                    "multimedia": [],
                    "content_type": "TEXT",
                    "metadata": null
                },
                {
                    "option_id": "d33efbf2-1e6d-4567-847c-dc2881ef868d",
                    "order": 1,
                    "content": "54",
                    "short_text": null,
                    "multimedia": [],
                    "content_type": "TEXT",
                    "metadata": null
                },
                {
                    "option_id": "98b16fed-aef2-43a2-8475-492877ffab22",
                    "order": 3,
                    "content": "49",
                    "short_text": null,
                    "multimedia": [],
                    "content_type": "TEXT",
                    "metadata": null
                }
            ],
            "code_analysis": {
                "code_analysis_id": "d9004b4a-7649-4f06-b2b8-3a3ed73459d4",
                "title": "CODE_ANALYSIS",
                "is_debug_mode_enabled": false,
                "is_run_code_enabled": false,
                "code_details": {
                    "code_id": "3f4616a5-5a18-4928-9461-780681d52c24",
                    "code": "let number = 92;\nconsole.log(number);",
                    "language": "JAVASCRIPT"
                },
                "available_code_languages": [
                    "JAVASCRIPT"
                ],
                "repository_details": null
            },
            "fib_coding": null,
            "fib_sql_coding": null,
            "interactive_builder_details": null,
            "test_cases": [],
            "question_configuration": {
                "time_limit": 120,
                "scoring_configuration": {
                    "correct_answer_score": 1.0,
                    "wrong_answer_score": 0.0
                },
                "skip_configuration": {
                    "skip_enabled": true,
                    "skip_enabled_time": 10
                }
            }
        },
        {
            "available_languages": [
                "en"
            ],
            "selected_language": "en",
            "ai_evaluation_response_fields": null,
            "audio_answer_evaluation_type": null,
            "audio_answer_duration_limit_in_seconds": null,
            "textual_answer_character_limit": null,
            "question_type": "CODE_ANALYSIS_MULTIPLE_CHOICE",
            "question_id": "606cb15a-3062-4b5b-bd0e-8f0bc83f01bd",
            "question_number": 14,
            "question": {
                "content": "What would be the output of the given JavaScript code in the console?<br>",
                "short_text": null,
                "multimedia": [],
                "content_type": "HTML",
                "difficulty": null
            },
            "options": [
                {
                    "option_id": "0a514b8e-b9b8-4b16-a26a-72f02c5162dd",
                    "order": 4,
                    "content": "7",
                    "short_text": null,
                    "multimedia": [],
                    "content_type": "TEXT",
                    "metadata": null
                },
                {
                    "option_id": "1dfa5f30-e30d-472f-bd97-0c547a8494e5",
                    "order": 1,
                    "content": "12",
                    "short_text": null,
                    "multimedia": [],
                    "content_type": "TEXT",
                    "metadata": null
                },
                {
                    "option_id": "ddb7643d-88ea-4fd0-aae8-d31352b7781e",
                    "order": 2,
                    "content": "5",
                    "short_text": null,
                    "multimedia": [],
                    "content_type": "TEXT",
                    "metadata": null
                },
                {
                    "option_id": "0791df91-5a18-4ed4-a947-6e2f83457702",
                    "order": 3,
                    "content": "10",
                    "short_text": null,
                    "multimedia": [],
                    "content_type": "TEXT",
                    "metadata": null
                }
            ],
            "code_analysis": {
                "code_analysis_id": "2c1509f4-ba39-4297-8cc3-55b67597e988",
                "title": "CODE_ANALYSIS",
                "is_debug_mode_enabled": false,
                "is_run_code_enabled": false,
                "code_details": {
                    "code_id": "2dd2d84b-4ac4-4924-80b5-b85aa3f33648",
                    "code": "console.log(5+7);",
                    "language": "JAVASCRIPT"
                },
                "available_code_languages": [
                    "JAVASCRIPT"
                ],
                "repository_details": null
            },
            "fib_coding": null,
            "fib_sql_coding": null,
            "interactive_builder_details": null,
            "test_cases": [],
            "question_configuration": {
                "time_limit": 120,
                "scoring_configuration": {
                    "correct_answer_score": 1.0,
                    "wrong_answer_score": 0.0
                },
                "skip_configuration": {
                    "skip_enabled": true,
                    "skip_enabled_time": 10
                }
            }
        },
        {
            "available_languages": [
                "en"
            ],
            "selected_language": "en",
            "ai_evaluation_response_fields": null,
            "audio_answer_evaluation_type": null,
            "audio_answer_duration_limit_in_seconds": null,
            "textual_answer_character_limit": null,
            "question_type": "MULTIPLE_CHOICE",
            "question_id": "d380389d-6724-4b35-8fc0-791321b70b4d",
            "question_number": 15,
            "question": {
                "content": "Which of the following is the keyword in JavaScript to declare a variable?",
                "short_text": "",
                "multimedia": [],
                "content_type": "TEXT",
                "difficulty": null
            },
            "options": [
                {
                    "option_id": "f92c3a14-0fd1-4bdb-877d-023cad140ddf",
                    "order": 3,
                    "content": "log",
                    "short_text": null,
                    "multimedia": [],
                    "content_type": "TEXT",
                    "metadata": null
                },
                {
                    "option_id": "f48bb92b-ae88-48d8-bc66-fa7ec8e7cf25",
                    "order": 1,
                    "content": "let",
                    "short_text": null,
                    "multimedia": [],
                    "content_type": "TEXT",
                    "metadata": null
                },
                {
                    "option_id": "ebc25669-1dd7-4200-b6e9-16025a80c908",
                    "order": 2,
                    "content": "console",
                    "short_text": null,
                    "multimedia": [],
                    "content_type": "TEXT",
                    "metadata": null
                }
            ],
            "code_analysis": null,
            "fib_coding": null,
            "fib_sql_coding": null,
            "interactive_builder_details": null,
            "question_configuration": {
                "time_limit": 120,
                "scoring_configuration": {
                    "correct_answer_score": 1.0,
                    "wrong_answer_score": 0.0
                },
                "skip_configuration": {
                    "skip_enabled": true,
                    "skip_enabled_time": 10
                }
            }
        }
    ],
    "questions_stats": {
        "correct_answer_count": 0,
        "incorrect_answer_count": 0,
        "unanswered_count": 20,
        "total_questions_count": 20
    }
} (some quesitions were edleted to avoid context rot, check q.json for full json)


then to submit answers, 

curl 'https://nkb-backend-ccbp-prod-apis.ccbp.in/api/nkb_primitive_coding/user/exam_attempt/primitive_coding/submit/' \
  -H 'accept: application/json' \
  -H 'accept-language: en-US,en;q=0.9' \
  -H 'authorization: Bearer 0ofYUzH0nL7ufuLf01QQiIskLyffKY' \
  -H 'content-type: application/json' \
  -H 'origin: https://learning.ccbp.in' \
  -H 'priority: u=1, i' \
  -H 'referer: https://learning.ccbp.in/' \
  -H 'sec-ch-ua: "Not:A-Brand";v="99", "Google Chrome";v="145", "Chromium";v="145"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "Windows"' \
  -H 'sec-fetch-dest: empty' \
  -H 'sec-fetch-mode: cors' \
  -H 'sec-fetch-site: same-site' \
  -H 'user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36' \
  -H 'x-app-version: 1128' \
  -H 'x-browser-session-id: 0613101a-a05c-42a4-a6f8-e0a61765fb66' \
  --data-raw '{"data":"\"{\\\"exam_attempt_id\\\":\\\"6f162c31-cb1c-4fb0-b2ef-1089d6651602\\\",\\\"total_time_spent\\\":1242,\\\"responses\\\":[{\\\"question_id\\\":\\\"e6468919-ccc5-4133-86f0-97ba8b290dac\\\",\\\"question_number\\\":2,\\\"time_spent\\\":6,\\\"multiple_choice_answer_id\\\":\\\"3d533dca-6635-483c-b2c7-339b2d36573e\\\"}]}\"","clientKeyDetailsId":1}'

it replies :

{
    "submission_result": [
        {
            "question_id": "b880c990-ad89-4fd1-a96f-bcfef547b5e6",
            "question_number": 17,
            "question_score": 1.0,
            "user_response_score": 1.0,
            "user_response_id": 933035591,
            "evaluation_result": "CORRECT",
            "ai_evaluation_data_str": "",
            "audio_pronunciation_evaluation": [],
            "audio_answer": "",
            "user_answer": "",
            "solved_status": null
        }
    ],
    "questions_stats": {
        "correct_answer_count": 9,
        "incorrect_answer_count": 8,
        "unanswered_count": 3,
        "total_questions_count": 20
    },
    "answers": [
        {
            "question_id": "b880c990-ad89-4fd1-a96f-bcfef547b5e6",
            "question_number": 17,
            "question_type": "CODE_ANALYSIS_MULTIPLE_CHOICE",
            "multiple_choice_answer_id": "75533604-f40d-4afe-8391-96a36ce6f5db",
            "textual_answer": null,
            "textual_answer_url": null,
            "audio_answer_url": null,
            "audio_answer": null,
            "explanation_for_answer": null
        }
    ],
    "current_total_score": 9.0
}


to end:
curl 'https://nkb-backend-ccbp-prod-apis.ccbp.in/api/nkb_exam/user/exam_attempt/end/' \
  -H 'accept: application/json' \
  -H 'accept-language: en-US,en;q=0.9' \
  -H 'authorization: Bearer 0ofYUzH0nL7ufuLf01QQiIskLyffKY' \
  -H 'content-type: application/json' \
  -H 'origin: https://learning.ccbp.in' \
  -H 'priority: u=1, i' \
  -H 'referer: https://learning.ccbp.in/' \
  -H 'sec-ch-ua: "Not:A-Brand";v="99", "Google Chrome";v="145", "Chromium";v="145"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "Windows"' \
  -H 'sec-fetch-dest: empty' \
  -H 'sec-fetch-mode: cors' \
  -H 'sec-fetch-site: same-site' \
  -H 'user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36' \
  -H 'x-app-version: 1128' \
  -H 'x-browser-session-id: 0613101a-a05c-42a4-a6f8-e0a61765fb66' \
  --data-raw '{"data":"\"{\\\"exam_attempt_id\\\":\\\"5a9f1902-d8c0-4ce8-87ec-1ce7316e6055\\\",\\\"end_reason_enum\\\":\\\"ENDED_BY_USER_BY_NAVIGATING_BACK\\\"}\"","clientKeyDetailsId":1}'

Now you need to design a system that is capable of doing this automatically. 

it should take the input bearer token and options like complete what course, weather to include mcq or not, and how many topics to complete.

all of these should be provided in a intaractive cli way so that with option to choose one or multiple (space to choose , a to choose all , enter to go next)

first then can selct sem, then course in that sem , Then they can choose if they want to only solve learning sets or practice sets or both.

well think how this selection should work.

also i need to integrate the groq api to solve the questions and submit.


