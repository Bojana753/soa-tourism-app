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

## Tour execution integration

Tour execution is started with:

```http
POST /api/executions/start
Content-Type: application/json

{
  "tourId": 1,
  "touristId": 1
}
```

Before a session is created, `tour-service` verifies ownership with
`purchase-service`. The purchase service must expose:

```http
GET /api/purchases/ownership?touristId=1&tourId=1

{
  "purchased": true
}
```

The execution start flow fails closed when ownership cannot be verified.

While a tour is active, the frontend sends the current tourist position every
10 seconds:

```http
POST /api/executions/{sessionId}/proximity
Content-Type: application/json

{
  "touristId": 1,
  "latitude": 44.8176,
  "longitude": 20.4633
}
```

The API gateway forwards this call to `tour-service` through the gRPC
`ExecutionService.CheckProximity` RPC defined in `proto/execution.proto`.

## Team

| Name | GitHub |
|---|---|
| Bojana Milošević| [@Bojana753](https://github.com/Bojana753) |
| Nemanja Kovavačević | [@nk1204](https://github.com/nk1204) |

