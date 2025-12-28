# Architecture & Design Guidelines

## Overview
This project is a dashboard application built with **Next.js (App Router)**, **TypeScript**, and **Supabase**. It manages patients, professionals, financial records, and clinical assessments.

## Core Modules

### 1. Attendance (Atendimento)
- **Path**: `src/app/dashboard/attendance`
- **Responsibility**: Manages the clinical encounter.
- **Key Components**: `AttendanceClient`, `PhysicalAssessmentForm` (Dynamic), `FinishAttendanceDialog`.
- **Status**: Complex logic, migrating to stable hook patterns.

### 2. Physical Assessment (Avaliação Física)
- **Path**: `src/components/assessments`
- **Responsibility**: Specialized forms for Pineau, Bioimpedance, Strength, and Mobility.
- **Key Features**: Auto-save, Evolution Graphs (`Recharts`), AI Report Generation.

### 3. Schedule (Agenda)
- **Path**: `src/app/dashboard/schedule`
- **Integrations**: Google Calendar (OAuth), WhatsApp (wppconnect).
- **Logic**: Time slot calculation, professional availability.

### 4. Financial (Financeiro)
- **Path**: `src/app/dashboard/financial`
- **Components**: Payables (Contas a Pagar), Receivables, Payroll (Comissões).

## Architectural Patterns (Desired State)

We are gradually moving towards a stricter separation of concerns:

### 1. Type Definitions (`src/types/modules/*`)
- **Goal**: Centralize types to avoid circular dependencies and messy imports.
- **Convention**: `src/types/modules/assessment.ts`, `src/types/modules/finance.ts`.

### 2. Business Logic (`src/lib/services/*`)
- **Goal**: Move heavy logic out of React components.
- **Example**:
  - *Bad*: Calculating VO2 Max inside `PhysicalAssessmentForm.tsx`.
  - *Good*: `import { calculateVO2 } from "@/lib/services/assessment/calculations"`.

### 3. UI Components (`src/components/*`)
- **Goal**: Pure view components. Receive data via props, emit events via callbacks.
- **State**: Use `react-hook-form` for forms, `useState` only for local UI state (modals, tabs).

## Directory Structure
```
src/
├── app/                 # Next.js Routes & Pages (Minimal Logic)
├── components/          # Reusable UI Components
├── lib/
│   ├── services/        # Business Logic (Pure Functions, API calls)
│   ├── supabase/        # Database Clients
│   └── utils/           # Shared Helpers (Dates, Formatters)
├── types/
│   ├── modules/         # Domain-specific types
│   └── ...
└── ...
```

## Migration Strategy
- **New Features**: Must follow the new pattern.
- **Existing Features**: Refactor only when modifying functionality or fixing bugs ("Boy Scout Rule").
