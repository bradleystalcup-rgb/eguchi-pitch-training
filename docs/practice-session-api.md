# Practice Session API

Practice sessions are server-directed. Clients render the current trial, submit the answer and response time, then render the next trial returned by the server.

## Start a session

`POST /api/children/:childId/practice-sessions`

Request body:

```json
{
  "level": 2,
  "selectionAlgorithm": "random"
}
```

`selectionAlgorithm` defaults to `random`; `adaptive` is also supported.

Response:

```json
{
  "session": {
    "id": "session-id",
    "level": 2,
    "trainingPhase": "chord_identification",
    "selectionAlgorithm": "random",
    "totalTrials": 20,
    "choices": [],
    "currentTrial": {
      "trialIndex": 0,
      "taskType": "chord_identification",
      "answerMode": "color_choice",
      "promptChordSlug": "white-red-ceg",
      "prompt": "Choose the color flag.",
      "toneNotes": ["C4", "E4", "G4"],
      "correctChoiceId": "white-red-ceg"
    }
  }
}
```

## Save an attempt and get the next trial

`POST /api/practice-sessions/:sessionId/attempts`

Request body:

For `answerMode: "color_choice"`:

```json
{
  "trialIndex": 0,
  "promptChordSlug": "white-red-ceg",
  "selectedChordSlug": "white-yellow-cfa",
  "responseMs": 1800
}
```

For `answerMode: "note_set"`:

```json
{
  "trialIndex": 0,
  "promptChordSlug": "white-red-ceg",
  "selectedNotes": ["C", "E", "G"],
  "responseMs": 1800
}
```

For `answerMode: "single_note"`:

```json
{
  "trialIndex": 0,
  "promptChordSlug": "white-red-ceg",
  "selectedToneNote": "G4",
  "responseMs": 1800
}
```

The server computes correctness. Clients should not be trusted as the source of truth for `isCorrect`.

Response:

```json
{
  "attempt": {
    "trialIndex": 0,
    "promptChordSlug": "white-red-ceg",
    "selectedChordSlug": "white-yellow-cfa",
    "selectedNotes": null,
    "selectedToneNote": null,
    "isCorrect": false,
    "responseMs": 1800
  },
  "nextTrial": {
    "trialIndex": 1,
    "taskType": "chord_identification",
    "answerMode": "color_choice",
    "promptChordSlug": "white-red-ceg",
    "prompt": "Choose the color flag.",
    "toneNotes": ["C4", "E4", "G4"],
    "correctChoiceId": "white-red-ceg"
  },
  "session": {
    "status": "active",
    "trainingPhase": "chord_identification",
    "answeredTrials": 1,
    "totalTrials": 20
  }
}
```

When `nextTrial` is `null`, the client should call the completion endpoint.

## Complete a session

`POST /api/practice-sessions/:sessionId/complete`

Completion is computed from saved attempts. The response includes `nextLevel`, `nextTrainingPhase`, `promoted`, and `phasePromoted`.

## Trial Modes

- `chord_identification` uses `answerMode: "color_choice"`.
- `chord_notes` uses `answerMode: "note_set"`.
- `single_note` uses `answerMode: "single_note"` and may include `isolatedToneNote`.
- `maintenance` can mix or review supported answer modes later.

The current web UI supports `color_choice`; the API is ready for the later modes.
