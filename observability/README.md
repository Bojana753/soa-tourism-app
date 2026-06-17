# KT4 Observability

This folder contains the monitoring and logging setup for the final SOA control point.

## Components

- `promtail` discovers Docker containers and sends their logs to `loki`.
- `loki` stores and queries aggregated container logs.
- `cadvisor` exposes CPU, memory and other container metrics.
- `prometheus` scrapes cAdvisor metrics.
- `grafana` shows both logs and container metrics in one provisioned dashboard.

## Run

From the repository root:

```bash
docker compose up --build
```

Grafana is available at:

```text
http://localhost:3000
```

Credentials:

```text
admin / admin
```

Open the `SOA Tourism Logs and Container Metrics` dashboard in the `SOA Tourism` folder.

## Useful URLs

- Grafana: `http://localhost:3000`
- Loki: `http://localhost:3100`
- Prometheus: `http://localhost:9091`
- cAdvisor: `http://localhost:8086`

## Demo checklist

1. Start the system with `docker compose up --build`.
2. Open Grafana and sign in with `admin / admin`.
3. Open the provisioned `SOA Tourism Logs and Container Metrics` dashboard.
4. Show the `Application Logs` panel and filter logs by `compose_service`.
5. Use the application in the browser to generate new logs.
6. Show cAdvisor metrics through the CPU and memory panels.
7. Open Prometheus targets at `http://localhost:9091/targets` and show that `cadvisor` is up.
