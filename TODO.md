# TODO

- [x] **Phase 1: Reorganize Directory Structure**
  - [x] Create feature-based modules under `features/`
  - [x] Move connection-related components to `features/connections`
  - [x] Move hooks and schemas into the feature folder
  - [x] Create barrel exports

- [x] **Phase 2: Standardize Data Fetching Pattern**
  - [x] Implement data access layer with server components
  - [x] Keep actions thin

 - [x] **Phase 3: Simplify Error Handling**
  - [x] Remove Result wrappers in server actions
  - [x] Implement shared error utilities

- [x] **Phase 4: Extract Shared Utilities**
  - [x] Move `lib/db` to `infrastructure/database`
  - [x] Move encryption and providers accordingly
  - [x] Add `shared/ui` for generic components

- [ ] **Phase 5: Implement Proper State Management**
  - [x] Create Zustand stores for connection state
  - [ ] Use optimistic updates

- [ ] **Phase 6: Improve Type Safety**
  - [ ] Add type predicates and branded types
  - [ ] Remove `as` assertions

- [ ] **Phase 7: Modularize Components**
  - [ ] Split `ConnectionsClient` into smaller pieces
  - [ ] Add loading and suspense boundaries

- [ ] **Phase 8: Testing Structure**
  - [ ] Co-locate tests with features
  - [ ] Use MSW for API mocks

## Chunks of Related Work
- [x] Chunk 1: Core Restructuring (Phases 1,2,4)
- [ ] Chunk 2: State and Error Management (Phases 3,5)
- [ ] Chunk 3: Component and Type Improvements (Phases 6,7)
- [ ] Chunk 4: Testing and Quality (Phase 8)
