The idea of this project is to create a UI admin/dashboars tool that will help to work with
GraphRag project (backend) created in `~/workspace/graphrag` directory.
So this project (graphrag-ui) should be an additional service (be able to run as a docker container)
that will serve as frontend for our `graphrag` service and provide UI to operate with these service REST endpoints.

Project stack: React 19, Node, Vite, Vitest; Tailwind CSS, docker compose

We should provide comprehensive dashboard that allows to operate with backend REST endpoints related to knowledge bases,
schemas, documents, queries, etc. You may find more details about graphrag project API in project directory (`~/workspace/graphrag`)
Ask additional questions if you need to clarify details about business logic, tech requirements, project scope, tech stack, details, etc.

Out of scope:
- authentication
- authorization

UPDATE:
this idea implementation plan is added into  [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)