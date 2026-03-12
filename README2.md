here is how to solve the coding prctices or "QUESTIONS_SETS"

first hit 

curl 'https://nkb-backend-ccbp-prod-apis.ccbp.in/api/nkb_coding_practice/questions/sql/v1/?offset=0&length=999' \
  -H 'accept: application/json' \
  -H 'accept-language: en-US,en;q=0.9' \
  -H 'authorization: Bearer 2DPFcYpqYfuo7lizWxZvYlylMBZsns' \
  -H 'content-type: application/json' \
  -H 'origin: https://learning.ccbp.in' \
  -H 'priority: u=1, i' \
  -H 'referer: https://learning.ccbp.in/' \
  -H 'sec-ch-ua: "Chromium";v="145", "Not:A-Brand";v="99"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "Linux"' \
  -H 'sec-fetch-dest: empty' \
  -H 'sec-fetch-mode: cors' \
  -H 'sec-fetch-site: same-site' \
  -H 'user-agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36' \
  -H 'x-app-version: 1129' \
  -H 'x-browser-session-id: 113e71f2-1565-41e5-af31-297bb6fafe90' \
  --data-raw '{"data":"\"{\\\"question_set_id\\\":\\\"4871ce74-08f9-4c38-a0a5-84bfa4288880\\\"}\"","clientKeyDetailsId":1}'

where questions id is the id you find after hitting v3/ in the units list

the response would be like 

{
    "learning_resource_details": {
        "resource_id": "29d83043-b8d0-4403-aadd-05b8608079f9",
        "title": "",
        "content": "The given database consists of tables that stores the information of `player` , `product` and `college`. \r\n\r\n### Tables\r\n\r\n<details>\r\n<summary>**player table**</summary>\r\n|  name  | age | score |\r\n|--------|-----|-------|\r\n| Joseph |  26 |   44  |\r\n| Lokesh |  32 |   99  |\r\n|  ...  | ...  |  ...  |\r\n`player` table stores the data of the player including  `name` , `age` and `score`.\r\n</details>\r\n\r\n<details>\r\n<summary>**college table**</summary>\r\n|  name |  reg_no |   address   |\r\n|-------|---------|-------------|\r\n|  CBIT | ASDF123 |  Hyderabad  |\r\n| JNTUH | zxc1234 | Anantapur   |\r\n|  ...  | ...     |       ...   |\r\n`college` table stores the details of the college including  `name` , `reg_no` and `address`.\r\n</details>\r\n\r\n<details>\r\n<summary>**product table**</summary>\r\n| id |   name   | price | brand | category |\r\n|----|----------|-------|-------|----------|\r\n| 1  |  phone   | 50000 | Apple |  Mobiles |\r\n| 2  | T-shirt  |  999  | Levis | Clothing |\r\n|  ...  | ...|   ...   |  ... | ... | \r\n`product` table stores the details of the product including  `id` , `name`,`price`,`brand` and `category`.\r\n</details>\r\n\r\n\r\nThis practice set helps you get a hang of all such queries. Let’s dive in!",
        "content_format": "MARKDOWN",
        "multimedia": [],
        "learning_resource_type": "DEFAULT",
        "references": []
    },
    "db_url": "https://ccbp-fullstack-backend.s3.ap-south-1.amazonaws.com/prod/intro_to_databases/assets/databases/session_4_intro_to_sql_part_2_practice_set.sqlite3",
    "points_can_be_earned": 100,
    "questions": [
        {
            "time_left_to_unlock_solution_in_seconds": 1317,
            "question_status": "ATTEMPT_STARTED",
            "question_id": "16505877-7ba8-41f5-8eb7-ccd737c3a834",
            "question_type": "SQL_CODING",
            "question_asked_by_companies": [],
            "question": {
                "content": "Delete all the data from table product.\n\nNote : Table should be present with no data, **Do not delete the table**.",
                "multimedia": [],
                "content_type": "MARKDOWN",
                "short_text": "",
                "difficulty": "MEDIUM"
            },
            "table_names": [],
            "question_number": 1,
            "evaluation_result": null,
            "is_solutions_exist": true,
            "is_hints_exist": false,
            "is_tutorial_solutions_exist": false,
            "default_code": {
                "code_id": "007a3929-a33b-4544-9fee-d16597797d3d",
                "code_content": "",
                "language": "SQL"
            },
            "latest_saved_code": null,
            "options": [],
            "latest_saved_option_ids": null
        },
        {
            "time_left_to_unlock_solution_in_seconds": 1800,
            "question_status": "NOT_ATTEMPTED",
            "question_id": "31a2fbe0-1496-4a8b-946b-e0912e846e1e",
            "question_type": "SQL_CODING",
            "question_asked_by_companies": [],
            "question": {
                "content": "Delete all the colleges having \"Hyderabad\" as address.",
                "multimedia": [],
                "content_type": "MARKDOWN",
                "short_text": "",
                "difficulty": "EASY"
            },
            "table_names": [],
            "question_number": 2,
            "evaluation_result": null,
            "is_solutions_exist": true,
            "is_hints_exist": false,
            "is_tutorial_solutions_exist": false,
            "default_code": {
                "code_id": "bb2a5af1-63f3-4509-abb2-3634e651aa51",
                "code_content": "",
                "language": "SQL"
            },
            "latest_saved_code": null,
            "options": [],
            "latest_saved_option_ids": null
        },
        {
            "time_left_to_unlock_solution_in_seconds": 1800,
            "question_status": "NOT_ATTEMPTED",
            "question_id": "b7a21af1-1f7e-4922-9464-e044304c8d8a",
            "question_type": "SQL_CODING",
            "question_asked_by_companies": [],
            "question": {
                "content": "Update the address of college having registration no `LKJ876` to \"Chennai\".",
                "multimedia": [],
                "content_type": "MARKDOWN",
                "short_text": null,
                "difficulty": "MEDIUM"
            },
            "table_names": [],
            "question_number": 5,
            "evaluation_result": null,
            "is_solutions_exist": true,
            "is_hints_exist": false,
            "is_tutorial_solutions_exist": false,
            "default_code": {
                "code_id": "f2e415a4-d11d-47ae-94e1-5833901481f7",
                "code_content": "",
                "language": "SQL"
            },
            "latest_saved_code": null,
            "options": [],
            "latest_saved_option_ids": null
        },..... similar quesitons in json ....
        {
            "time_left_to_unlock_solution_in_seconds": 1800,
            "question_status": "NOT_ATTEMPTED",
            "question_id": "f2275da7-9f2e-40aa-abc0-69d09a80a0b5",
            "question_type": "SQL_CODING",
            "question_asked_by_companies": [],
            "question": {
                "content": "Delete`player`table from the database.",
                "multimedia": [],
                "content_type": "MARKDOWN",
                "short_text": "Question 9",
                "difficulty": "EASY"
            },
            "table_names": [],
            "question_number": 11,
            "evaluation_result": null,
            "is_solutions_exist": true,
            "is_hints_exist": false,
            "is_tutorial_solutions_exist": false,
            "default_code": {
                "code_id": "5b54670a-507b-4759-8d9d-eea4690f60cc",
                "code_content": "",
                "language": "SQL"
            },
            "latest_saved_code": null,
            "options": [],
            "latest_saved_option_ids": null
        }
    ]
}

here is how to submit it:
curl 'https://nkb-backend-ccbp-prod-apis.ccbp.in/api/nkb_coding_practice/questions/sql/submit/v1/' \
  -H 'accept: application/json' \
  -H 'accept-language: en-US,en;q=0.9' \
  -H 'authorization: Bearer 2DPFcYpqYfuo7lizWxZvYlylMBZsns' \
  -H 'content-type: application/json' \
  -H 'origin: https://learning.ccbp.in' \
  -H 'priority: u=1, i' \
  -H 'referer: https://learning.ccbp.in/' \
  -H 'sec-ch-ua: "Chromium";v="145", "Not:A-Brand";v="99"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "Linux"' \
  -H 'sec-fetch-dest: empty' \
  -H 'sec-fetch-mode: cors' \
  -H 'sec-fetch-site: same-site' \
  -H 'user-agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36' \
  -H 'x-app-version: 1129' \
  -H 'x-browser-session-id: 113e71f2-1565-41e5-af31-297bb6fafe90' \
  --data-raw '{"data":"\"{\\\"responses\\\":[{\\\"time_spent\\\":1,\\\"question_id\\\":\\\"16505877-7ba8-41f5-8eb7-ccd737c3a834\\\",\\\"user_response_code\\\":{\\\"code_content\\\":\\\"DELETE FROM\\\\n  product;\\\",\\\"language\\\":\\\"SQL\\\"}}]}\"","clientKeyDetailsId":1}'

  and this give us 

  {
    "submission_results": [
        {
            "question_id": "16505877-7ba8-41f5-8eb7-ccd737c3a834",
            "user_response_id": 933386591,
            "evaluation_result": "CORRECT",
            "coding_submission_response": {
                "reason_for_error": null,
                "passed_test_cases_count": 1,
                "total_test_cases_count": 1,
                "reason_for_failures": []
            },
            "correct_option_ids": null
        }
    ]
}

tho i have no idea how the user_response_id is generated or where it is saved.

anything to do about this ?

eitherway this is for sql coding questions, but there are other types of questions like c++ coding questions, react, js, etc.

here is how the coding practice for 

you can hit 

curl 'https://nkb-backend-ccbp-prod-apis.ccbp.in/api/nkb_coding_practice/user/coding/questions/summary/?offset=0&length=999' \
  -H 'accept: application/json' \
  -H 'accept-language: en-US,en;q=0.9' \
  -H 'authorization: Bearer 2DPFcYpqYfuo7lizWxZvYlylMBZsns' \
  -H 'content-type: application/json' \
  -H 'origin: https://learning.ccbp.in' \
  -H 'priority: u=1, i' \
  -H 'referer: https://learning.ccbp.in/' \
  -H 'sec-ch-ua: "Chromium";v="145", "Not:A-Brand";v="99"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "Linux"' \
  -H 'sec-fetch-dest: empty' \
  -H 'sec-fetch-mode: cors' \
  -H 'sec-fetch-site: same-site' \
  -H 'user-agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36' \
  -H 'x-app-version: 1129' \
  -H 'x-browser-session-id: 41aa87e1-d3f6-444d-b6ed-7ccab3333519' \
  --data-raw '{"data":"\"{\\\"question_set_id\\\":\\\"3aef5d4a-5cc6-407d-bdeb-03191f7f2090\\\"}\"","clientKeyDetailsId":1}'

you would get something like:
[
    {
        "question_id": "0ea5ad3f-67ed-4096-a7f8-13421e7bb27c",
        "question_status": "ATTEMPT_STARTED",
        "question_asked_by_companies": [],
        "short_text": "Print a Given String",
        "test_cases_summary": null,
        "latest_user_submission_score": null,
        "best_user_submission_details": null,
        "max_question_score": 15.0,
        "is_answer_seen": false,
        "is_question_set_recent_active_question": false,
        "difficulty": "EASY",
        "applicable_languages": [
            "CPP",
            "JAVA",
            "PYTHON"
        ]
    },
    {
        "question_id": "06c25fc7-a14c-4ba2-9405-9e8c1c41ef47",
        "question_status": "ATTEMPT_STARTED",
        "question_asked_by_companies": [
            {
                "company_name": "Facebook",
                "is_internal_placement": false
            },
            {
                "company_name": "Google",
                "is_internal_placement": false
            },
            {
                "company_name": "Uber",
                "is_internal_placement": false
            },
            {
                "company_name": "Adobe",
                "is_internal_placement": false
            },
            {
                "company_name": "Bloomberg",
                "is_internal_placement": false
            },
            {
                "company_name": "Microsoft",
                "is_internal_placement": false
            },
            {
                "company_name": "Yahoo",
                "is_internal_placement": false
            },
            {
                "company_name": "Apple",
                "is_internal_placement": false
            },
            {
                "company_name": "Amazon",
                "is_internal_placement": false
            },
            {
                "company_name": "Atlassian",
                "is_internal_placement": false
            }
        ],
        "short_text": "Addition of Two Numbers",
        "test_cases_summary": null,
        "latest_user_submission_score": null,
        "best_user_submission_details": null,
        "max_question_score": 15.0,
        "is_answer_seen": false,
        "is_question_set_recent_active_question": false,
        "difficulty": "EASY",
        "applicable_languages": [
            "CPP",
            "JAVA",
            "PYTHON"
        ]
    },
    {
        "question_id": "308197d1-dd9f-4538-a1aa-1bd68cb9ef97",
        "question_status": "NOT_ATTEMPTED",
        "question_asked_by_companies": [],
        "short_text": "Add Character to String",
        "test_cases_summary": null,
        "latest_user_submission_score": null,
        "best_user_submission_details": null,
        "max_question_score": 15.0,
        "is_answer_seen": false,
        "is_question_set_recent_active_question": false,
        "difficulty": "EASY",
        "applicable_languages": [
            "CPP",
            "JAVA",
            "PYTHON"
        ]
    },
    {
        "question_id": "34ce0636-be0f-4bba-8e60-1b4817de9126",
        "question_status": "ATTEMPT_STARTED",
        "question_asked_by_companies": [],
        "short_text": "Multiplication & Division of Two Float Numbers",
        "test_cases_summary": null,
        "latest_user_submission_score": null,
        "best_user_submission_details": null,
        "max_question_score": 15.0,
        "is_answer_seen": false,
        "is_question_set_recent_active_question": false,
        "difficulty": "EASY",
        "applicable_languages": [
            "CPP",
            "JAVA",
            "PYTHON"
        ]
    },
    {
        "question_id": "de46faf4-ac28-4873-be58-e96c426af6d4",
        "question_status": "ATTEMPT_STARTED",
        "question_asked_by_companies": [],
        "short_text": "Divide a Large Number and Print with Precision",
        "test_cases_summary": null,
        "latest_user_submission_score": null,
        "best_user_submission_details": null,
        "max_question_score": 15.0,
        "is_answer_seen": false,
        "is_question_set_recent_active_question": false,
        "difficulty": "EASY",
        "applicable_languages": [
            "CPP",
            "JAVA",
            "PYTHON"
        ]
    },
    {
        "question_id": "142d233b-f76b-40b8-9663-8807faa96e9d",
        "question_status": "NOT_ATTEMPTED",
        "question_asked_by_companies": [],
        "short_text": "Arithmetic Operation on Two Numbers",
        "test_cases_summary": null,
        "latest_user_submission_score": null,
        "best_user_submission_details": null,
        "max_question_score": 15.0,
        "is_answer_seen": false,
        "is_question_set_recent_active_question": false,
        "difficulty": "EASY",
        "applicable_languages": [
            "CPP",
            "JAVA",
            "PYTHON"
        ]
    }
]


you can hit this to get the actual questions:

curl 'https://nkb-backend-ccbp-prod-apis.ccbp.in/api/nkb_coding_practice/user/coding/questions/' \
  -H 'accept: application/json' \
  -H 'accept-language: en-US,en;q=0.9' \
  -H 'authorization: Bearer I8B0cheEPH68PTs7tewHbNIuOHBU2H' \
  -H 'content-type: application/json' \
  -H 'origin: https://learning.ccbp.in' \
  -H 'priority: u=1, i' \
  -H 'referer: https://learning.ccbp.in/' \
  -H 'sec-ch-ua: "Chromium";v="145", "Not:A-Brand";v="99"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "Linux"' \
  -H 'sec-fetch-dest: empty' \
  -H 'sec-fetch-mode: cors' \
  -H 'sec-fetch-site: same-site' \
  -H 'user-agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36' \
  -H 'x-app-version: 1129' \
  -H 'x-browser-session-id: 41aa87e1-d3f6-444d-b6ed-7ccab3333519' \
  --data-raw '{"data":"\"{\\\"question_ids\\\":[\\\"0ea5ad3f-67ed-4096-a7f8-13421e7bb27c\\\"]}\"","clientKeyDetailsId":1}'

what you would get: {
    "questions": [
        {
            "question_id": "0ea5ad3f-67ed-4096-a7f8-13421e7bb27c",
            "question_type": "CODING",
            "question_asked_by_companies": [],
            "question": {
                "content": "You are given a task to take a string as input and print it exactly as it is.\n\n**Example 1:**\n\n**Input:**\n\n```\nHello, World!\n```\n\n**Output:**\n\n```\nHello, World!\n```\n\n**Explanation:**\n\nThe input string is `Hello, World!`. The task simply requires printing this string exactly as it appears.\n\n**Example 2:**\n\n**Input:**\n\n```\nCoding is fun!\n```\n\n**Output:**\n\n```\nCoding is fun!\n```\n\n**Explanation:**\n\nThe input string is `Coding is fun!`.The task simply requires printing this string exactly as it appears.\n\n**Constraints:**\n\n- `1` ≤ `string.length` ≤ `1000`\n\n- The input contains all types of characters, including spaces. \n\n**Input Format:**  \n\n- The first line contains string.\n\n**Output Format:**  \n\n- Print the string `input_string` exactly as given in the input.",
                "multimedia": [],
                "content_type": "MARKDOWN",
                "short_text": "Print a Given String",
                "acceptance_percentage": 79.94202898550725,
                "metadata": "{\"real_life_example\": \"1. This problem is useful for designing user interfaces where input text needs to be displayed exactly as entered, such as chat applications or comment sections.  \\n2. It is relevant for logging systems to ensure accurate recording of user inputs or system messages without any alterations.\"}",
                "difficulty": "EASY"
            },
            "code": {
                "code_id": "d4a38ef6-3a04-4119-a76f-64067e0e403d",
                "code_content": "\"#include <bits/stdc++.h>\\nusing namespace std;\\n\\nint main() {\\n    // Write Your Code here...\\n\\n    return 0;\\n}\"",
                "language": "CPP"
            },
            "latest_saved_code": {
                "code_id": "50ecbe53-11ba-4b1b-a3b9-30c77118a392",
                "code_content": "\"#include <bits/stdc++.h>\\nusing namespace std;\\n\\nint main() {\\n    // Write Your Code here...\\n\\n    return 0;\\n}\"",
                "language": "CPP"
            },
            "test_cases": [
                {
                    "test_case_id": "9f197a30-288e-434f-b999-c11bd03b302d",
                    "input": "\"Hello, World!\"",
                    "output": "\"Hello, World!\"",
                    "has_multiple_outputs": false,
                    "possible_outputs": []
                },
                {
                    "test_case_id": "e989fbe5-0d4a-4f0f-8c05-8c679e1a4bb4",
                    "input": "\"Coding is fun!\"",
                    "output": "\"Coding is fun!\"",
                    "has_multiple_outputs": false,
                    "possible_outputs": []
                }
            ],
            "is_bookmarked": false,
            "show_tutorial_solutions": true,
            "avg_time_spent_to_solve": 378.0,
            "user_time_spent": 13.0,
            "all_test_case_ids": [
                "446ce53e-1794-43d0-bd23-d288ca6dbdcd",
                "70a70d13-b818-472b-baca-9520b472b309",
                "9399e909-49af-4542-afeb-0bc290013e70",
                "9f197a30-288e-434f-b999-c11bd03b302d",
                "d81309fe-4ef0-49d0-bfa4-0c7d3520e7d7",
                "d96717d5-5115-4046-89e6-73edb13a735d",
                "e504327c-3e6c-42ec-a274-e4cd3c1b81d8",
                "e989fbe5-0d4a-4f0f-8c05-8c679e1a4bb4"
            ],
            "show_solutions": false,
            "show_hints": false,
            "show_guided_solutions": true,
            "is_guiding_questions_enabled": false
        }
    ]
}

then we need to hit 

curl 'https://nkb-backend-ccbp-prod-apis.ccbp.in/api/nkb_coding_practice/question/coding/submit/v2/' \
  -H 'accept: application/json' \
  -H 'accept-language: en-US,en;q=0.9' \
  -H 'authorization: Bearer I8B0cheEPH68PTs7tewHbNIuOHBU2H' \
  -H 'content-type: application/json' \
  -H 'origin: https://learning.ccbp.in' \
  -H 'priority: u=1, i' \
  -H 'referer: https://learning.ccbp.in/' \
  -H 'sec-ch-ua: "Chromium";v="145", "Not:A-Brand";v="99"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "Linux"' \
  -H 'sec-fetch-dest: empty' \
  -H 'sec-fetch-mode: cors' \
  -H 'sec-fetch-site: same-site' \
  -H 'user-agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36' \
  -H 'x-app-version: 1129' \
  -H 'x-browser-session-id: 41aa87e1-d3f6-444d-b6ed-7ccab3333519' \
  --data-raw '{"data":"\"{\\\"responses\\\":[{\\\"question_id\\\":\\\"0ea5ad3f-67ed-4096-a7f8-13421e7bb27c\\\",\\\"time_spent\\\":314,\\\"coding_answer\\\":{\\\"code_content\\\":\\\"\\\\\\\"print(\\\\\\\\\\\\\\\"Hello World\\\\\\\\\\\\\\\")\\\\\\\"\\\",\\\"language\\\":\\\"PYTHON\\\"}}]}\"","clientKeyDetailsId":1}'
reply:
  {
    "evaluation_details": [
        {
            "question_id": "0ea5ad3f-67ed-4096-a7f8-13421e7bb27c",
            "evaluation_id": "bd31369e-ff58-49d2-ac21-9866e9d397c7"
        }
    ]
}

then there is this :

curl 'https://nkb-backend-ccbp-prod-apis.ccbp.in/api/nkb_coding_practice/question/coding/submission/' \
  -H 'accept: application/json' \
  -H 'accept-language: en-US,en;q=0.9' \
  -H 'authorization: Bearer I8B0cheEPH68PTs7tewHbNIuOHBU2H' \
  -H 'content-type: application/json' \
  -H 'origin: https://learning.ccbp.in' \
  -H 'priority: u=1, i' \
  -H 'referer: https://learning.ccbp.in/' \
  -H 'sec-ch-ua: "Chromium";v="145", "Not:A-Brand";v="99"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "Linux"' \
  -H 'sec-fetch-dest: empty' \
  -H 'sec-fetch-mode: cors' \
  -H 'sec-fetch-site: same-site' \
  -H 'user-agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36' \
  -H 'x-app-version: 1129' \
  -H 'x-browser-session-id: 41aa87e1-d3f6-444d-b6ed-7ccab3333519' \
  --data-raw '{"data":"\"{\\\"submission_id\\\":\\\"9a2cce7c-d133-4af7-9267-7004c6eaf54d\\\"}\"","clientKeyDetailsId":1}'

  {
    "submission_id": "9a2cce7c-d133-4af7-9267-7004c6eaf54d",
    "submission_datetime": "2026-03-12 10:22:33",
    "submission_code": "\"print(input())\"",
    "total_test_cases_count": 8,
    "number_of_test_cases_passed": 8,
    "failing_test_case_details": null,
    "submitted_user_name": "Pragnyan ramtha A",
    "submission_status": "CORRECT",
    "language": "PYTHON"
}

how i think you can get a code_id and save y hitting the api;

curl 'https://nkb-backend-ccbp-prod-apis.ccbp.in/api/nkb_coding_practice/question/coding/save/' \
  -H 'accept: application/json' \
  -H 'accept-language: en-US,en;q=0.9' \
  -H 'authorization: Bearer I8B0cheEPH68PTs7tewHbNIuOHBU2H' \
  -H 'content-type: application/json' \
  -H 'origin: https://learning.ccbp.in' \
  -H 'priority: u=1, i' \
  -H 'referer: https://learning.ccbp.in/' \
  -H 'sec-ch-ua: "Chromium";v="145", "Not:A-Brand";v="99"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "Linux"' \
  -H 'sec-fetch-dest: empty' \
  -H 'sec-fetch-mode: cors' \
  -H 'sec-fetch-site: same-site' \
  -H 'user-agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36' \
  -H 'x-app-version: 1129' \
  -H 'x-browser-session-id: 04e970cb-24f8-468e-9900-d0ba5bf02b58' \
  --data-raw '{"data":"\"{\\\"responses\\\":[{\\\"question_id\\\":\\\"06c25fc7-a14c-4ba2-9405-9e8c1c41ef47\\\",\\\"coding_answer\\\":{\\\"code_content\\\":\\\"\\\\\\\"#include <bits/stdc++.h>\\\\\\\\nusing namespace std;\\\\\\\\n\\\\\\\\nint main() {\\\\\\\\n    int a;\\\\\\\\n    int b;\\\\\\\\n    cin >> a;\\\\\\\\n    cin >> b;\\\\\\\\n    \\\\\\\\n    \\\\\\\\n\\\\\\\\n    return 0;\\\\\\\\n}\\\\\\\"\\\",\\\"language\\\":\\\"CPP\\\"}}]}\"","clientKeyDetailsId":1}'

which would give you:
{
    "code_details": [
        {
            "question_id": "06c25fc7-a14c-4ba2-9405-9e8c1c41ef47",
            "code_id": "0f68a8c1-7f3e-43a4-9629-7f43513e6972"
        }
    ]
}


but you can always just hit 

curl 'https://nkb-backend-ccbp-prod-apis.ccbp.in/api/nkb_coding_practice/question/coding/submission/' \
  -H 'accept: application/json' \
  -H 'accept-language: en-US,en;q=0.9' \
  -H 'authorization: Bearer I8B0cheEPH68PTs7tewHbNIuOHBU2H' \
  -H 'content-type: application/json' \
  -H 'origin: https://learning.ccbp.in' \
  -H 'priority: u=1, i' \
  -H 'referer: https://learning.ccbp.in/' \
  -H 'sec-ch-ua: "Chromium";v="145", "Not:A-Brand";v="99"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "Linux"' \
  -H 'sec-fetch-dest: empty' \
  -H 'sec-fetch-mode: cors' \
  -H 'sec-fetch-site: same-site' \
  -H 'user-agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36' \
  -H 'x-app-version: 1129' \
  -H 'x-browser-session-id: 04e970cb-24f8-468e-9900-d0ba5bf02b58' \
  --data-raw '{"data":"\"{\\\"submission_id\\\":\\\"3572e38b-af60-423c-8540-2e5abd05c43a\\\"}\"","clientKeyDetailsId":1}'

and it gets 
{
    "submission_id": "3572e38b-af60-423c-8540-2e5abd05c43a",
    "submission_datetime": "2026-03-12 10:41:56",
    "submission_code": "\"#include <bits/stdc++.h>\\nusing namespace std;\\n\\nint main() {\\n    int a;\\n    int b;\\n    cin >> a;\\n    cin >> b;\\n    cout << a + b << endl;\\n    \\n\\n    return 0;\\n}\"",
    "total_test_cases_count": 8,
    "number_of_test_cases_passed": 8,
    "failing_test_case_details": null,
    "submitted_user_name": "Pragnyan ramtha A",
    "submission_status": "CORRECT",
    "language": "CPP"
}


similarly for js coding we have:

curl 'https://nkb-backend-ccbp-prod-apis.ccbp.in/api/nkb_coding_practice/user/coding/questions/summary/?offset=0&length=50' \
  -H 'accept: application/json' \
  -H 'accept-language: en-US,en;q=0.9' \
  -H 'authorization: Bearer I8B0cheEPH68PTs7tewHbNIuOHBU2H' \
  -H 'content-type: application/json' \
  -H 'origin: https://learning.ccbp.in' \
  -H 'priority: u=1, i' \
  -H 'referer: https://learning.ccbp.in/' \
  -H 'sec-ch-ua: "Chromium";v="145", "Not:A-Brand";v="99"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "Linux"' \
  -H 'sec-fetch-dest: empty' \
  -H 'sec-fetch-mode: cors' \
  -H 'sec-fetch-site: same-site' \
  -H 'user-agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36' \
  -H 'x-app-version: 1129' \
  -H 'x-browser-session-id: f8bbda16-7ba9-4461-a0d2-6d104efa2484' \
  --data-raw '{"data":"\"{\\\"question_set_id\\\":\\\"4e59a499-80a1-4e39-94b5-ccc4011fd4f0\\\"}\"","clientKeyDetailsId":1}'

we get :

[
    {
        "question_id": "cc8262a2-7625-4059-a9ac-5ebadaa390bd",
        "question_status": "NOT_ATTEMPTED",
        "question_asked_by_companies": [
            {
                "company_name": "FINCITY",
                "is_internal_placement": true
            }
        ],
        "short_text": "Predict the Winner",
        "test_cases_summary": null,
        "latest_user_submission_score": null,
        "best_user_submission_details": null,
        "max_question_score": 10.0,
        "is_answer_seen": false,
        "is_question_set_recent_active_question": false,
        "difficulty": "EASY",
        "applicable_languages": [
            "NODE_JS"
        ]
    },
    {
        "question_id": "613137c4-17c9-4281-846b-d489bac43feb",
        "question_status": "NOT_ATTEMPTED",
        "question_asked_by_companies": [],
        "short_text": "Simple Calculator",
        "test_cases_summary": null,
        "latest_user_submission_score": null,
        "best_user_submission_details": null,
        "max_question_score": 15.0,
        "is_answer_seen": false,
        "is_question_set_recent_active_question": false,
        "difficulty": "EASY",
        "applicable_languages": [
            "NODE_JS"
        ]
    },
    {
        "question_id": "db2e0a18-8052-4b39-ba6e-a63263fb9b8b",
        "question_status": "NOT_ATTEMPTED",
        "question_asked_by_companies": [
            {
                "company_name": "EXCELLENCE_TECHNOLOGIES",
                "is_internal_placement": true
            }
        ],
        "short_text": "Calculate the Area of a Square",
        "test_cases_summary": null,
        "latest_user_submission_score": null,
        "best_user_submission_details": null,
        "max_question_score": 10.0,
        "is_answer_seen": false,
        "is_question_set_recent_active_question": false,
        "difficulty": "EASY",
        "applicable_languages": [
            "NODE_JS"
        ]
    },
    {
        "question_id": "6f801159-9715-4542-8813-ea954b58c278",
        "question_status": "NOT_ATTEMPTED",
        "question_asked_by_companies": [],
        "short_text": "Discounted Fare",
        "test_cases_summary": null,
        "latest_user_submission_score": null,
        "best_user_submission_details": null,
        "max_question_score": 10.0,
        "is_answer_seen": false,
        "is_question_set_recent_active_question": false,
        "difficulty": "EASY",
        "applicable_languages": [
            "NODE_JS"
        ]
    },
    {
        "question_id": "c9788879-3004-4904-8791-4f8cb376622e",
        "question_status": "NOT_ATTEMPTED",
        "question_asked_by_companies": [
            {
                "company_name": "CRAZYWEBDEV_TECHNOLOGIES",
                "is_internal_placement": true
            },
            {
                "company_name": "EXCELLENCE_TECHNOLOGIES",
                "is_internal_placement": true
            },
            {
                "company_name": "FINCITY",
                "is_internal_placement": true
            },
            {
                "company_name": "DALNEX",
                "is_internal_placement": true
            }
        ],
        "short_text": "Employee Details",
        "test_cases_summary": null,
        "latest_user_submission_score": null,
        "best_user_submission_details": null,
        "max_question_score": 10.0,
        "is_answer_seen": false,
        "is_question_set_recent_active_question": false,
        "difficulty": "EASY",
        "applicable_languages": [
            "NODE_JS"
        ]
    },
    {
        "question_id": "47016c83-21bc-4936-9de0-59a0be733d0d",
        "question_status": "NOT_ATTEMPTED",
        "question_asked_by_companies": [
            {
                "company_name": "CRAZYWEBDEV_TECHNOLOGIES",
                "is_internal_placement": true
            },
            {
                "company_name": "LLOYDS",
                "is_internal_placement": true
            },
            {
                "company_name": "EXCELLENCE_TECHNOLOGIES",
                "is_internal_placement": true
            }
        ],
        "short_text": "Quote",
        "test_cases_summary": null,
        "latest_user_submission_score": null,
        "best_user_submission_details": null,
        "max_question_score": 5.0,
        "is_answer_seen": false,
        "is_question_set_recent_active_question": false,
        "difficulty": "EASY",
        "applicable_languages": [
            "NODE_JS"
        ]
    }
]

clicking on question:

  curl 'https://nkb-backend-ccbp-prod-apis.ccbp.in/api/nkb_coding_practice/user/question/config/v1/' \
  -H 'accept: application/json' \
  -H 'accept-language: en-US,en;q=0.9' \
  -H 'authorization: Bearer I8B0cheEPH68PTs7tewHbNIuOHBU2H' \
  -H 'content-type: application/json' \
  -H 'origin: https://learning.ccbp.in' \
  -H 'priority: u=1, i' \
  -H 'referer: https://learning.ccbp.in/' \
  -H 'sec-ch-ua: "Chromium";v="145", "Not:A-Brand";v="99"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "Linux"' \
  -H 'sec-fetch-dest: empty' \
  -H 'sec-fetch-mode: cors' \
  -H 'sec-fetch-site: same-site' \
  -H 'user-agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36' \
  -H 'x-app-version: 1129' \
  -H 'x-browser-session-id: f8bbda16-7ba9-4461-a0d2-6d104efa2484' \
  --data-raw '{"data":"\"{\\\"question_id\\\":\\\"cc8262a2-7625-4059-a9ac-5ebadaa390bd\\\"}\"","clientKeyDetailsId":1}'


and the reponse :
{
    "user_question_status": "NOT_ATTEMPTED",
    "question_set_id": "4e59a499-80a1-4e39-94b5-ccc4011fd4f0",
    "question_set_title": "JS Coding Practice",
    "question_set_content_type": "CODING",
    "question_set_configuration": {
        "feedback_bot_id": null,
        "enable_discussions": true,
        "is_assignment": false
    },
    "should_show_prerequisites_flow": false,
    "question_configuration": {
        "enable_content_copy": false,
        "language_specific_config": [],
        "feature_flags": null
    },
    "applicable_languages": [
        "NODE_JS"
    ]
}

curl 'https://nkb-backend-ccbp-prod-apis.ccbp.in/api/nkb_coding_practice/user/coding/questions/' \
  -H 'accept: application/json' \
  -H 'accept-language: en-US,en;q=0.9' \
  -H 'authorization: Bearer I8B0cheEPH68PTs7tewHbNIuOHBU2H' \
  -H 'content-type: application/json' \
  -H 'origin: https://learning.ccbp.in' \
  -H 'priority: u=1, i' \
  -H 'referer: https://learning.ccbp.in/' \
  -H 'sec-ch-ua: "Chromium";v="145", "Not:A-Brand";v="99"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "Linux"' \
  -H 'sec-fetch-dest: empty' \
  -H 'sec-fetch-mode: cors' \
  -H 'sec-fetch-site: same-site' \
  -H 'user-agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36' \
  -H 'x-app-version: 1129' \
  -H 'x-browser-session-id: f8bbda16-7ba9-4461-a0d2-6d104efa2484' \
  --data-raw '{"data":"\"{\\\"question_ids\\\":[\\\"cc8262a2-7625-4059-a9ac-5ebadaa390bd\\\"]}\"","clientKeyDetailsId":1}'

we get reply :

{
    "questions": [
        {
            "question_id": "cc8262a2-7625-4059-a9ac-5ebadaa390bd",
            "question_type": "CODING",
            "question_asked_by_companies": [
                {
                    "company_name": "FINCITY",
                    "is_internal_placement": true
                }
            ],
            "question": {
                "content": "Given the average speeds of two bike racers in a race, write a JS program to predict the winner of the race using a ternary operator.<hr><b>Input</b><br/><br/>The first line of input contains a number (averageSpeedOfRacer1).<br/>The second line of input contains a number (averageSpeedOfRacer2).<hr><b>Output</b><br/><br/>The output should be a single line containing the winner, &quot;Racer 1&quot; or &quot;Racer 2&quot;.<hr><b>Constraints</b><br/><br/>averageSpeedOfRacer1 is not equal to averageSpeedOfRacer2.",
                "multimedia": [],
                "content_type": "HTML",
                "short_text": "Predict the Winner",
                "acceptance_percentage": 87.50221591916328,
                "metadata": null,
                "difficulty": "EASY"
            },
            "code": {
                "code_id": "616103c4-59a5-46e0-b04f-291b28e29221",
                "code_content": "\"\\\"use strict\\\";\\n\\nprocess.stdin.resume();\\nprocess.stdin.setEncoding(\\\"utf-8\\\");\\n\\nlet inputString = \\\"\\\";\\nlet currentLine = 0;\\n\\nprocess.stdin.on(\\\"data\\\", (inputStdin) => {\\n  inputString += inputStdin;\\n});\\n\\nprocess.stdin.on(\\\"end\\\", (_) => {\\n  inputString = inputString\\n    .trim()\\n    .split(\\\"\\\\n\\\")\\n    .map((str) => str.trim());\\n\\n  main();\\n});\\n\\nfunction readLine() {\\n  return inputString[currentLine++];\\n}\\n\\n/* Please do not modify anything above this line */\\n\\nfunction getWinnerOfTheRace(averageSpeedOfRacer1, averageSpeedOfRacer2) {\\n  /*\\n   * Write your code here and return the output.\\n   */\\n}\\n\\n/* Please do not modify anything below this line */\\n\\nfunction main() {\\n  let averageSpeedOfRacer1 = JSON.parse(readLine());\\n  let averageSpeedOfRacer2 = JSON.parse(readLine());\\n\\n  let winner = getWinnerOfTheRace(averageSpeedOfRacer1, averageSpeedOfRacer2);\\n  \\n  console.log(winner);\\n}\\n\"",
                "language": "NODE_JS"
            },
            "latest_saved_code": null,
            "test_cases": [
                {
                    "test_case_id": "3e67d81f-dfcf-4e08-8db2-69a56a5249a6",
                    "input": "\"98.80\\n92.39\"",
                    "output": "\"Racer 1\\n\"",
                    "has_multiple_outputs": false,
                    "possible_outputs": []
                },
                {
                    "test_case_id": "6f47e2b0-ff54-4ba5-b2c1-35325da60a72",
                    "input": "\"90\\n100\"",
                    "output": "\"Racer 2\\n\"",
                    "has_multiple_outputs": false,
                    "possible_outputs": []
                }
            ],
            "is_bookmarked": false,
            "show_tutorial_solutions": false,
            "avg_time_spent_to_solve": 330.0,
            "user_time_spent": 0.0,
            "all_test_case_ids": [
                "3e67d81f-dfcf-4e08-8db2-69a56a5249a6",
                "6f47e2b0-ff54-4ba5-b2c1-35325da60a72",
                "b33cb3f8-b457-4bc0-8688-3175f76f9ee1",
                "d180ac1a-d20c-4d59-96d5-851a0ca8b0ac"
            ],
            "show_solutions": true,
            "show_hints": false,
            "show_guided_solutions": false,
            "is_guiding_questions_enabled": false
        }
    ]
}

how to submit :

curl 'https://nkb-backend-ccbp-prod-apis.ccbp.in/api/nkb_coding_practice/question/coding/submit/' \
  -H 'accept: application/json' \
  -H 'accept-language: en-US,en;q=0.9' \
  -H 'authorization: Bearer I8B0cheEPH68PTs7tewHbNIuOHBU2H' \
  -H 'content-type: application/json' \
  -H 'origin: https://learning.ccbp.in' \
  -H 'priority: u=1, i' \
  -H 'referer: https://learning.ccbp.in/' \
  -H 'sec-ch-ua: "Chromium";v="145", "Not:A-Brand";v="99"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "Linux"' \
  -H 'sec-fetch-dest: empty' \
  -H 'sec-fetch-mode: cors' \
  -H 'sec-fetch-site: same-site' \
  -H 'user-agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36' \
  -H 'x-app-version: 1129' \
  -H 'x-browser-session-id: f8bbda16-7ba9-4461-a0d2-6d104efa2484' \
  --data-raw '{"data":"\"{\\\"responses\\\":[{\\\"question_id\\\":\\\"cc8262a2-7625-4059-a9ac-5ebadaa390bd\\\",\\\"time_spent\\\":123,\\\"coding_answer\\\":{\\\"code_content\\\":\\\"\\\\\\\"\\\\\\\\\\\\\\\"use strict\\\\\\\\\\\\\\\";\\\\\\\\n\\\\\\\\nprocess.stdin.resume();\\\\\\\\nprocess.stdin.setEncoding(\\\\\\\\\\\\\\\"utf-8\\\\\\\\\\\\\\\");\\\\\\\\n\\\\\\\\nlet inputString = \\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\";\\\\\\\\nlet currentLine = 0;\\\\\\\\n\\\\\\\\nprocess.stdin.on(\\\\\\\\\\\\\\\"data\\\\\\\\\\\\\\\", (inputStdin) => {\\\\\\\\n  inputString += inputStdin;\\\\\\\\n});\\\\\\\\n\\\\\\\\nprocess.stdin.on(\\\\\\\\\\\\\\\"end\\\\\\\\\\\\\\\", (_) => {\\\\\\\\n  inputString = inputString\\\\\\\\n    .trim()\\\\\\\\n    .split(\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\\n\\\\\\\\\\\\\\\")\\\\\\\\n    .map((str) => str.trim());\\\\\\\\n\\\\\\\\n  main();\\\\\\\\n});\\\\\\\\n\\\\\\\\nfunction readLine() {\\\\\\\\n  return inputString[currentLine++];\\\\\\\\n}\\\\\\\\n\\\\\\\\n/* Please do not modify anything above this line */\\\\\\\\n\\\\\\\\nfunction getWinnerOfTheRace(averageSpeedOfRacer1, averageSpeedOfRacer2) {\\\\\\\\n  const l = Math.max(averageSpeedOfRacer2,averageSpeedOfRacer1)\\\\\\\\n  if (l === averageSpeedOfRacer1){return \\\\\\\\\\\\\\\"Racer 1\\\\\\\\\\\\\\\"} else {return \\\\\\\\\\\\\\\"Racer 2\\\\\\\\\\\\\\\"}\\\\\\\\n}\\\\\\\\n\\\\\\\\n/* Please do not modify anything below this line */\\\\\\\\n\\\\\\\\nfunction main() {\\\\\\\\n  let averageSpeedOfRacer1 = JSON.parse(readLine());\\\\\\\\n  let averageSpeedOfRacer2 = JSON.parse(readLine());\\\\\\\\n\\\\\\\\n  let winner = getWinnerOfTheRace(averageSpeedOfRacer1, averageSpeedOfRacer2);\\\\\\\\n  \\\\\\\\n  console.log(winner);\\\\\\\\n}\\\\\\\\n\\\\\\\"\\\",\\\"language\\\":\\\"NODE_JS\\\"}}]}\"","clientKeyDetailsId":1}'

reply:
  
{
    "submission_result": [
        {
            "question_id": "cc8262a2-7625-4059-a9ac-5ebadaa390bd",
            "question_score": 10.0,
            "user_response_score": 10.0,
            "user_response_id": 933411055,
            "evaluation_result": "CORRECT",
            "passed_test_cases_count": 4,
            "total_test_cases_count": 4,
            "failing_test_case_details": null,
            "error_explanation_details": null
        }
    ]
}