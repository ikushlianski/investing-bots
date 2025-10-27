# User Story: US-001 - Create Reusable Logic Blocks (Factors)

**Feature:** `ft-090-strategy-creation-framework`

## 1. User Story

-   **As a Quant,** I want to create a new, self-contained `MomentumFactor` and add it to the Factor Library, so that it becomes a reusable component for any strategy I design in the future.
-   **As a Developer,** I want to be able to unit test the `EmaTrendFactor` in complete isolation, to ensure its logic is mathematically correct before it gets used in any live strategy.

## 2. Acceptance Criteria

-   A developer can create a new TypeScript file in the `/src/factors` directory that implements the `Factor` interface.
-   The new factor must define a `calculate` method that takes market data as input and returns a standardized `{ score: number }` object.
-   The system's central registry must automatically discover and load the new factor, making it available for use in the Strategy Composer.
-   Each factor can have its own dedicated unit test file (e.g., `EmaTrendFactor.test.ts`) that can be run independently.
-   The Factor Library UI must display the newly created factor, showing its name and description.
