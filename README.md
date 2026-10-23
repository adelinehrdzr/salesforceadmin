# Admin Practice Lab

An independent, English-language local Salesforce Administrator study application. Python 3.10+ is the only runtime dependency. No npm installation, cloud account, or API key is required.

## Run locally

```sh
cd salesforceadmin
python server.py
```

Open `http://127.0.0.1:8000` on your own computer. Use `python3` if that is your Python command. Stop with Ctrl+C. The server binds to loopback only. If the port is occupied, run `python server.py --port 8001`.

## Study workflow

- Study mode gives an explanation after you lock in an answer.
- Mock mode hides grading until submission, includes a configurable timer, question navigation, flags, and unanswered-question scoring.
- Choose a topic or all topics. A session uses unique questions sampled without replacement; options are reshuffled for new sessions.
- Review mistakes targets your missed questions. Correcting a question in a later completed session removes it from the review queue.
- Sessions, deadlines, history, and mistakes persist in browser local storage. Closing a timed session does not pause its deadline. Export progress as JSON for your own records; import is not implemented.
- Results include topic breakdowns and explanations for every answer. There is no account or telemetry. Clearing browser storage removes progress. Do not run multiple simultaneous tabs against the same stored session.

The 60-question bank is original educational content, organized into practical topic groups. Questions focus on scenario reasoning and tradeoffs, but difficulty has not been calibrated against real candidates. All questions currently use a single best answer; multiple-select items are not implemented. Review each explanation, work through the topic in Trailhead, and reproduce the scenario in a Playground or Developer Edition org.

## 2026 scope and source limitations

The official credential site could not be accessed during development (network proxy returned HTTP 403). Current exam weights, question formats, duration, price, passing score, and release-specific feature details have **not** been verified. The 105-minute default and 80% study target are configurable study conventions, not claims about the current official exam. Verify the current exam guide at the official credential page before using this as an exam simulation.

- Credential and current guide: https://trailhead.salesforce.com/en/credentials/administrator
- Administrator preparation trailmix: https://trailhead.salesforce.com/users/strailhead/trailmixes/prepare-for-your-salesforce-administrator-credential
- Trailhead modules and practice orgs: https://trailhead.salesforce.com/

Topic-level Trailhead links in explanations are learning references and have not been checked for current availability. There is no scraped third-party bank, no leaked exam material, and no claim to include all free Internet questions or all Salesforce certifications. This initial version covers Administrator only. Repeating this small bank can inflate scores through memorization: supplement it with official hands-on work and fresh, legitimately available practice. Passing the study target does not predict certification success.

## Validation

```sh
python -m unittest -v
node --check static/app.js  # optional JavaScript syntax check, requires Node
```

The tests start a temporary local server on port 8765 and verify bank integrity, option shuffling, answer payload separation, correct/incorrect/unanswered grading, invalid submissions, full-bank grading, and delivery of application assets. They do not verify Salesforce behavior or constitute a browser end-to-end test.

## Content maintenance

`data/questions.json` contains the original questions and explanations. Choice index 0 is the authored answer; the server shuffles display order while preserving stable choice IDs. Grading is deliberately transparent locally and is not an anti-cheating security system. Do not treat this as a proctored testing platform. Add reviewed questions with unique IDs, four distinct options, a rationale, and a source reference. For a genuinely blind new mock, expand the bank with independently reviewed questions.

Salesforce and Trailhead are trademarks of their owners. This application is not affiliated with or endorsed by Salesforce.
