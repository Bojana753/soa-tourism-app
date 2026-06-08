# Monitoring Architecture Overview

## High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SOA TOURISM APPLICATION                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐          │
│  │   API Gateway    │  │  Blog Service    │  │  Tour Service    │          │
│  │   (Go + OTel)    │  │  (Java + OTel)   │  │  (Java + OTel)   │          │
│  │   Port: 8080     │  │  Port: 8082      │  │  Port: 8084      │          │
│  │   Metrics: 8888  │  │  Metrics: /act.. │  │  Metrics: /act.. │          │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘          │
│           │                    │                     │                       │
│  ┌────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐  │
│  │Stakeholders Service│  │Follower Service     │  │Purchase Service     │  │
│  │(Go + OTel)         │  │(Go + OTel + Neo4j)  │  │(Java + OTel)        │  │
│  │Port: 8081          │  │Port: 8083           │  │Port: 8085           │  │
│  │Metrics: /metrics   │  │Metrics: 8888        │  │Metrics: /actuator.. │  │
│  └────────────────────┘  └─────────────────────┘  └─────────────────────┘  │
│           ▲                    ▲                          ▲                  │
│           │ Traces via OTLP    │ HTTP + gRPC             │                  │
│           └────────────┬───────┴────────────────────┬────┘                  │
│                        │                            │                        │
│                        ▼ OTLP/HTTP (Port 4318)     ▼ HTTP                  │
└────────────────────────┬─────────────────────────────┬──────────────────────┘
                         │                             │
        ┌────────────────┴─────────────────────────────┴────────────────┐
        │        MONITORING & OBSERVABILITY INFRASTRUCTURE              │
        ├──────────────────────────────────────────────────────────────┤
        │                                                                │
        │  ┌──────────────────┐  ┌──────────────────┐  ┌────────────┐  │
        │  │  JAEGER          │  │  PROMETHEUS      │  │ NODE       │  │
        │  │  (Tracing)       │  │  (Metrics DB)    │  │ EXPORTER   │  │
        │  │                  │  │                  │  │ (Host)     │  │
        │  │  Port: 16686 UI  │  │  Port: 9090 UI   │  │ Port: 9100 │  │
        │  │  4318 OTLP HTTP  │  │  Scrapes every:  │  │ Monitors:  │  │
        │  │  4317 OTLP gRPC  │  │  - Services: 10s  │  │ • CPU      │  │
        │  │  6831 Jaeger UDP │  │  - Host: 15s     │  │ • Memory   │  │
        │  │                  │  │  - Containers:15s │  │ • Disk     │  │
        │  │  Stores:         │  │  - Jaeger: 10s   │  │ • Network  │  │
        │  │  In-memory       │  │                  │  │            │  │
        │  │  (or use ES)     │  │ Retention: 7d    │  │ Scrape:    │  │
        │  └────────┬─────────┘  └──────────┬───────┘  │ :9100      │  │
        │           │                       │          │ /metrics   │  │
        │           │                       │          └────────────┘  │
        │           │                       │                          │
        │  ┌────────────────┐  ┌────────────┴──────┐  ┌────────────┐  │
        │  │  cADVISOR      │  │  GRAFANA          │  │   DOCKER   │  │
        │  │  (Containers)  │  │  (Dashboards)     │  │  VOLUMES   │  │
        │  │                │  │                   │  │            │  │
        │  │  Port: 8089    │  │  Port: 3000       │  │ Prometheus │  │
        │  │  Metrics API   │  │  admin/admin      │  │ Grafana    │  │
        │  │                │  │                   │  │ Jaeger     │  │
        │  │  Monitors:     │  │  Data Sources:    │  │            │  │
        │  │  • Container   │  │  • Prometheus     │  │            │  │
        │  │    CPU         │  │  • Jaeger         │  │            │  │
        │  │  • Container   │  │                   │  │            │  │
        │  │    Memory      │  │  Dashboards:      │  │            │  │
        │  │  • Container   │  │  • System Health  │  │            │  │
        │  │    Network I/O │  │  • App Perf       │  │            │  │
        │  └────────────────┘  │  • Services       │  │            │  │
        │                       └───────────────────┘  └────────────┘  │
        │                                                                │
        └──────────────────────────────────────────────────────────────┘


TRACE FLOW:
═══════════════════════════════════════════════════════════════════════════════

When user makes a request:

1. Request hits API Gateway (:8080)
   └─► Creates root span: "httpRequest"

2. API Gateway proxies to Blog Service (:8082)
   └─► Creates child span: "proxyToBlogService"
       └─► Blog Service processes
           └─► Creates child span: "saveBlog"

3. Blog Service calls Follower Service (:8083)
   └─► Creates child span: "checkFollowers"

4. All services export spans to Jaeger (:4318)
   └─► Jaeger aggregates and displays full trace tree

5. User can see in Jaeger UI:
   └─► Complete request flow with timings and status


METRICS FLOW:
═══════════════════════════════════════════════════════════════════════════════

Services emit metrics:

1. Java Services expose: {service}:{port}/actuator/prometheus
   └─► Micrometer collects from:
       • HTTP requests (count, duration, status)
       • Database queries
       • JVM metrics
       • Custom business metrics

2. Go Services expose: :8888/metrics (custom telemetry.go)
   └─► Prometheus client collects:
       • HTTP requests
       • Database queries
       • Process metrics
       • Custom metrics

3. Node Exporter exposes: :9100/metrics
   └─► Collects host machine metrics:
       • CPU usage
       • Memory usage
       • Disk usage
       • Network traffic

4. cAdvisor exposes: :8089/docker
   └─► Collects container metrics:
       • Per-container CPU
       • Per-container memory
       • Per-container network

5. Prometheus scrapes all endpoints (every 10-15s)
   └─► Stores in time-series database

6. Grafana queries Prometheus
   └─► Displays in dashboards (real-time visualization)


PORT MAPPING:
═══════════════════════════════════════════════════════════════════════════════

Microservices:
  8080 - API Gateway (REST)
  8081 - Stakeholders Service (REST)
  8082 - Blog Service (REST)
  8083 - Follower Service (REST)
  8084 - Tour Service (REST) + 9090 (gRPC)
  8085 - Purchase Service (REST)

Monitoring:
  16686 - Jaeger UI
  9090  - Prometheus UI
  3000  - Grafana UI
  8089  - cAdvisor API
  9100  - Node Exporter Metrics

OpenTelemetry:
  4318  - Jaeger OTLP HTTP Receiver
  4317  - Jaeger OTLP gRPC Receiver
  6831  - Jaeger Agent (UDP)

Service Metrics:
  8888  - Go Services Prometheus Metrics
  /actuator/prometheus - Java Services Prometheus Metrics
  /metrics - Node Exporter


DATA FLOW DIAGRAM:
═══════════════════════════════════════════════════════════════════════════════

USER REQUEST
    │
    ▼
┌─────────────────────────┐
│   API Gateway :8080     │ ◄─── Trace #1 created
└──────────┬──────────────┘
           │ HTTP/gRPC
           ├─────────┬──────────────┬──────────────┐
           │         │              │              │
           ▼         ▼              ▼              ▼
    ┌────────┐ ┌──────────┐ ┌────────┐ ┌──────────┐
    │ Blog   │ │Followers │ │  Tour  │ │ Purchase │
    │Service │ │ Service  │ │Service │ │ Service  │
    └────┬───┘ └────┬─────┘ └────┬───┘ └────┬─────┘
         │          │            │          │
         └──────┬───┴────────┬───┴──────┬───┘
                │            │          │
                │ OTLP HTTP  │          │ Prometheus
                │ (Traces)   │          │ Metrics
                │            │          │ (:8888, /actuator/prometheus)
                ▼            ▼          ▼
             ┌──────────────────┐    ┌──────────────┐
             │  Jaeger :4318    │    │ Prometheus   │
             │  (aggregates     │    │ :9090        │
             │  traces)         │    │ (stores      │
             └────────┬─────────┘    │  metrics)    │
                      │              └──────┬───────┘
                      │ Web Queries         │ Grafana
                      │                     │ :3000
                      ▼                     ▼
                  ┌──────────┐        ┌──────────┐
                  │ Jaeger UI│        │ Grafana  │
                  │ :16686   │        │ UI       │
                  └──────────┘        └──────────┘
                      │                    │
                      └────────┬───────────┘
                               │
                               ▼
                           USER VIEWS
                      (Traces & Dashboards)


WHAT EACH COMPONENT DOES:
═════════════════════════════════════════════════════════════════════════════════

OPENTELEMETRY (in services)
├── Traces: Records request path through services
├── Spans: Individual operation timings
├── Metrics: Counter, gauge, histogram metrics
└── Automatic Instrumentation:
    ├── HTTP server/client calls
    ├── Database queries
    ├── RPC calls
    └── JVM/Go runtime metrics

JAEGER
├── Collects trace data from services via OTLP
├── Stores traces in memory (or Elasticsearch for production)
├── Provides UI for trace visualization
├── Enables distributed tracing across services
└── Helps identify performance bottlenecks

PROMETHEUS
├── Scrapes metrics from all services
├── Stores metrics as time series data
├── Provides query language (PromQL)
├── Enables real-time monitoring
└── Integrates with Grafana for visualization

NODE EXPORTER
├── Exposes host machine metrics
├── CPU, memory, disk, network statistics
├── Prometheus scrapes these metrics
└── Essential for infrastructure monitoring

cADVISOR
├── Exposes Docker container metrics
├── Per-container resource usage
├── Prometheus scrapes these metrics
└── Essential for container-level monitoring

GRAFANA
├── Queries Prometheus and Jaeger
├── Creates dashboards
├── Visualizes metrics over time
├── Enables custom alerts
└── Provides business-friendly UI


KEY METRICS CATEGORIES:
═════════════════════════════════════════════════════════════════════════════════

APPLICATION LAYER (per service):
├── HTTP Metrics
│   ├── Request rate
│   ├── Error rate
│   └── Response latency
├── Business Metrics
│   ├── Objects created
│   ├── Transactions processed
│   └── Revenue/conversions
└── Database Metrics
    ├── Query time
    └── Connection pool usage

HOST LAYER:
├── CPU Utilization
├── Memory Usage
├── Disk I/O & Space
└── Network Traffic

CONTAINER LAYER:
├── Per-container CPU
├── Per-container Memory
├── Per-container Network
└── Container Lifecycle Events


DEFAULT SCRAPE INTERVALS:
═════════════════════════════════════════════════════════════════════════════════

Service Endpoints:      10 seconds (configured in prometheus.yml)
Node Exporter:          15 seconds (default)
cAdvisor:               15 seconds (default)
Jaeger Metrics:         10 seconds

Total Prometheus DB size ≈ 1-5 GB per week (depending on traffic)
