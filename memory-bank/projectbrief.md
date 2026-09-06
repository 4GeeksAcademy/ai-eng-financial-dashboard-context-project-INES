# Project Brief

## What this repo is
A financial metrics dashboard with a React + TypeScript frontend and a
FastAPI backend, built as a 4Geeks Academy AI Engineering coursework project.
Source: `README.md:18` ("_Financial metrics dashboard with a React +
TypeScript frontend and a FastAPI backend._"), `README.md:1-5` (attribution to
4Geeks Academy).

## Stated intent (from README)
The recommended workflow, per `README.md:20-26`, is:
1. Fork the repo.
2. Run it (Codespaces or local).
3. Run an AI agent to inspect frontend and backend.
4. Document proposed rules and a memory bank in the fork.
5. Refine and validate the rules until they fit the project's real workflow.

This means: `.agents/rules/`, `.agents/skills/`, and `memory-bank/` (this
directory) are the deliverable of the exercise, not pre-existing scaffolding
— confirmed by their absence before this session (`ls .agents`,
`ls memory-bank` both failed with "No such file or directory").

## Scope, as currently implemented (verified against code, not the README's
aspirational description)
- A single-page dashboard (`frontend/src/App.tsx`) showing 4 KPI cards and 2
  line charts (income/outcome, profit %), fed by **one** backend endpoint
  (`/api/metrics`). See `[[frontend-backend-integration-gap]]`.
- A FastAPI backend exposing 9 routes over **entirely mock, in-memory,
  non-persisted data** (`backend/app/routes.py`). See
  `[[backend-data-model]]`.
- No authentication, no database, no real financial data source anywhere in
  the codebase (verified by reading all backend source files).
