# soa-tourism-app

> Microservice-based tourism platform developed as part of the SOA course (2025/26) at the Faculty of Technical Sciences, Novi Sad.

## Architecture Overview

| Service | Responsibility | Language | Database |
|---|---|---|---|
| `stakeholders-service` | Registration, auth, user management | Go | PostgreSQL |
| `blog-service` | Blogs, comments, likes | Java | MongoDB |
| `follower-service` | User following, recommendations | Go | Neo4j |
| `tour-service` | Tours, key points, reviews, execution | Java | PostgreSQL |
| `purchase-service` | Shopping cart, tokens, checkout | Node.js | MongoDB |
| `api-gateway` | Request routing, auth middleware | Go | — |
| `frontend` | Web client | Angular | — |

## Tech Stack

- **Languages:** Go, Java, Node.js
- **Databases:** PostgreSQL, MongoDB, Neo4j
- **Communication:** REST, gRPC
- **Infrastructure:** Docker, docker-compose
- **Patterns:** API Gateway, Saga, Microservices

## Getting Started

### Prerequisites
- Docker & docker-compose

### Run
```bash
docker-compose up --build
```

## Team

| Name | GitHub |
|---|---|
| Bojana Milošević| [@Bojana753](https://github.com/Bojana753) |
| Member 2 | @username |
| Member 3 | @username |
| Member 4 | @username |

## Milestones

| | Deadline | Scope |
|---|---|---|
| KT1 | 18.04. | REST services, Dockerization |
| KT2 | 18.05. | NoSQL, Follower service, API Gateway |
| KT3 | 01.06. | RPC, SAGA pattern |
| KT4 | 15.06. | Tracing, logging, monitoring |