## 1. Shared Pending-State UI Primitives

- [x] 1.1 Add shared loading indicator/progress banner component for in-flight backend work.
- [x] 1.2 Extend shared button usage pattern to support pending visual state and disable interaction while request is active.

## 2. Controller Workflow Integration

- [x] 2.1 Integrate pending indicators into query workflows (ask/generate/validate/execute).
- [x] 2.2 Integrate pending indicators into schema workflows (create/activate/validate/generate paths).
- [x] 2.3 Integrate pending indicators into document and knowledge-base mutation workflows where requests may take time.

## 3. Regression Coverage and Validation

- [x] 3.1 Add/extend tests verifying pending indicators render while requests are in flight.
- [x] 3.2 Add/extend tests verifying duplicate clicks are prevented during pending state.
- [x] 3.3 Run targeted tests and build.
