# SOA Tourism App - Monitoring, Tracing, and Metrics Guide

This document provides a comprehensive guide on the monitoring, tracing, and metrics infrastructure for the SOA Tourism Application.

## Table of Contents
1. [Overview](#overview)
2. [Components](#components)
3. [Architecture](#architecture)
4. [Getting Started](#getting-started)
5. [Accessing the UIs](#accessing-the-uis)
6. [Distributed Tracing](#distributed-tracing)
7. [Metrics Collection](#metrics-collection)
8. [Host Metrics](#host-metrics)
9. [Container Metrics](#container-metrics)
10. [Dashboards](#dashboards)
11. [Troubleshooting](#troubleshooting)

## Overview

The monitoring stack provides:
- **Distributed Tracing**: Track requests across multiple microservices using Jaeger
- **Metrics Collection**: Collect application and system metrics using Prometheus
- **Host Machine Metrics**: Monitor CPU, RAM, disk, and network traffic using Node Exporter
- **Container Metrics**: Monitor Docker container resource usage using cAdvisor
- **Visualization**: Visualize metrics and traces using Grafana and Jaeger UI

## Components

### 1. **Jaeger** (Distributed Tracing)
- **Version**: Latest (all-in-one)
- **UI Port**: 16686
- **OTLP HTTP Receiver**: 4318
- **OTLP gRPC Receiver**: 4317
- **Jaeger Agent (UDP)**: 6831

Jaeger collects trace data from all microservices via OpenTelemetry (OTLP) protocol.

### 2. **Prometheus** (Metrics Storage)
- **Port**: 9090
- **Configuration**: `./monitoring/prometheus.yml`

Prometheus scrapes metrics from:
- All microservices (Java and Go)
- Node Exporter (host metrics)
- cAdvisor (container metrics)
- Jaeger collector

### 3. **Node Exporter** (Host Metrics)
- **Port**: 9100
- **Metrics Exported**:
  - CPU utilization (node_cpu_seconds_total)
  - RAM usage (node_memory_MemTotal_bytes, node_memory_MemAvailable_bytes)
  - Disk usage (node_filesystem_avail_bytes)
  - Network traffic (node_network_receive_bytes_total, node_network_transmit_bytes_total)

### 4. **cAdvisor** (Container Metrics)
- **Port**: 8089
- **Metrics Exported**:
  - Container CPU usage
  - Container memory usage
  - Container filesystem usage
  - Container network I/O

### 5. **Grafana** (Visualization)
- **Port**: 3000
- **Default Credentials**: admin / admin
- **Data Sources**: Prometheus, Jaeger

Grafana displays pre-configured dashboards for:
- Application metrics
- Host metrics
- Container metrics
- System health

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Microservices                         │
├─────────────────────────────────────────────────────────┤
│ • Stakeholders (Go)                                     │
│ • Blog (Java)                                          │
│ • Follower (Go + Neo4j)                               │
│ • Tour (Java + gRPC)                                  │
│ • Purchase (Java)                                      │
│ • API Gateway (Go)                                     │
└─────────────────────────────────────────────────────────┘
         │                          │
         ├────────────────────┬─────┴────────────────┐
         │                    │                      │
    ┌────▼────┐      ┌───────▼────┐      ┌─────────▼─────┐
    │  Jaeger  │      │ Prometheus │      │ Host Machine  │
    │ (Traces) │      │ (Metrics)  │      │   (Node Exp)  │
    └────┬─────┘      └───────┬────┘      └───────────────┘
         │                    │
         └────────┬───────────┘
                  │
            ┌─────▼────────┐
            │   Grafana    │
            │(Dashboards)  │
            └──────────────┘
```

## Getting Started

### 1. Start the monitoring stack with your application:

```bash
cd d:\SOA\soa-tourism-app
docker-compose up -d
```

This command starts:
- All microservices with OpenTelemetry enabled
- Jaeger for distributed tracing
- Prometheus for metrics collection
- Node Exporter for host metrics
- cAdvisor for container metrics
- Grafana for visualization

### 2. Verify services are running:

```bash
docker-compose ps
```

Expected output should show all services running, including:
- jaeger (port 16686)
- prometheus (port 9090)
- node-exporter (port 9100)
- cadvisor (port 8089)
- grafana (port 3000)

### 3. Check health status:

```bash
# Check Jaeger UI
curl http://localhost:16686

# Check Prometheus
curl http://localhost:9090

# Check Node Exporter metrics
curl http://localhost:9100/metrics

# Check cAdvisor
curl http://localhost:8089
```

## Accessing the UIs

### Jaeger UI (Distributed Tracing)
- **URL**: http://localhost:16686
- **Features**:
  - View traces across microservices
  - Search traces by service, operation, tags
  - See latency and error information
  - Analyze dependencies between services

**Steps to view traces**:
1. Navigate to http://localhost:16686
2. Select a service from the "Service" dropdown
3. Click "Find Traces"
4. Click on a trace to see detailed span information

### Prometheus UI (Metrics)
- **URL**: http://localhost:9090
- **Features**:
  - Query metrics using PromQL
  - View metric graphs
  - Check scrape targets and health

**Common queries**:
```promql
# API Gateway request rate
rate(http_requests_total{service="api-gateway"}[1m])

# CPU usage
node_cpu_seconds_total

# Memory usage
node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes

# Container metrics
container_memory_usage_bytes{name="blog-service"}
```

### Grafana (Dashboards)
- **URL**: http://localhost:3000
- **Default Login**: admin / admin
- **Features**:
  - Pre-configured dashboards
  - Real-time visualization
  - Custom alerts

## Distributed Tracing

### How Tracing Works

1. **Trace Generation**:
   - Each microservice uses OpenTelemetry SDK
   - Traces are exported via OTLP HTTP to Jaeger (port 4318)
   - Traces include spans for each operation

2. **Span Creation**:
   - Java services use automatic instrumentation via Spring Boot starter
   - Go services manually create spans in telemetry.go
   - Each span contains timing, status, and tags

3. **Trace Visualization**:
   - Jaeger UI shows complete trace flow
   - See which services were called and their latencies
   - Identify bottlenecks and failures

### Example: Tracing a Blog Post Creation

When a user creates a blog post:

```
API Gateway Request
  ├─ Blog Service Handler (10ms)
  │  ├─ MongoDB Write (8ms)
  │  └─ Follower Service Check (2ms)
  └─ Response (0ms)

Total: 10ms
```

This trace is visible in Jaeger UI showing:
- Service name (blog-service)
- Operation name (createBlog)
- Duration (10ms)
- Status (success/failure)
- Custom tags (userId, postId, etc.)

## Metrics Collection

### Application Metrics

**Java Services** (using Micrometer + Spring Boot Actuator):
- HTTP request metrics (count, duration, status)
- Database connection pool metrics
- JVM metrics (memory, GC, threads)
- Custom application metrics

**Go Services** (using Prometheus client):
- HTTP request metrics
- Database query metrics
- Custom business metrics

### Accessing Metrics Endpoints

**Java Services**:
```bash
# Blog Service metrics
curl http://localhost:8082/actuator/prometheus

# Tour Service metrics
curl http://localhost:8084/actuator/prometheus

# Purchase Service metrics
curl http://localhost:8085/actuator/prometheus
```

**Go Services**:
```bash
# API Gateway metrics
curl http://localhost:8888/metrics

# Follower Service metrics
curl http://localhost:8888/metrics

# Stakeholders Service metrics
curl http://localhost:8888/metrics
```

### Key Metrics to Monitor

1. **HTTP Metrics**:
   - `http_requests_total` - Total HTTP requests
   - `http_request_duration_seconds` - Request duration
   - `http_requests_failed_total` - Failed requests

2. **Database Metrics**:
   - Database connection pool usage
   - Query execution time
   - Transaction counts

3. **Business Metrics**:
   - Tours created/published
   - Blog posts created
   - User registrations
   - Purchase transactions

## Host Metrics

Node Exporter collects detailed host machine metrics:

### CPU Metrics
```
# CPU usage percentage
100 - (avg by (cpu) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# CPU seconds total
node_cpu_seconds_total

# Load average (1, 5, 15 minutes)
node_load1
node_load5
node_load15
```

### Memory Metrics
```
# Total memory
node_memory_MemTotal_bytes

# Available memory
node_memory_MemAvailable_bytes

# Memory usage percentage
(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100

# Cached memory
node_memory_Cached_bytes

# Swap usage
node_memory_SwapTotal_bytes
node_memory_SwapFree_bytes
```

### Disk Metrics
```
# Disk free space
node_filesystem_avail_bytes{device!~'tmpfs'}

# Disk total size
node_filesystem_size_bytes

# Disk usage percentage
(1 - (node_filesystem_avail_bytes / node_filesystem_size_bytes)) * 100

# Disk I/O read/write
node_disk_read_bytes_total
node_disk_written_bytes_total
```

### Network Metrics
```
# Network bytes received
node_network_receive_bytes_total

# Network bytes transmitted
node_network_transmit_bytes_total

# Network packets received/transmitted
node_network_receive_packets_total
node_network_transmit_packets_total

# Network errors
node_network_receive_errs_total
node_network_transmit_errs_total
```

## Container Metrics

cAdvisor provides Docker container-specific metrics:

### Container Resource Usage
```
# Container memory usage
container_memory_usage_bytes{name="blog-service"}

# Container CPU usage
container_cpu_user_seconds_total
container_cpu_system_seconds_total

# Container filesystem usage
container_fs_usage_bytes{name="blog-service"}

# Container network I/O
container_network_receive_bytes_total
container_network_transmit_bytes_total
```

### Container Health Metrics
- Container uptime
- Container restart count
- Container status (running, stopped, etc.)

## Dashboards

### Creating Custom Dashboards in Grafana

1. **Navigate to Grafana** (http://localhost:3000)
2. **Create New Dashboard**:
   - Click "+" → "Dashboard"
   - Click "Add panel"
   - Select "Prometheus" as data source
   - Enter PromQL query

3. **Example Panel: API Gateway Request Rate**:
   ```
   rate(http_requests_total{service="api-gateway"}[1m])
   ```

4. **Example Panel: Memory Usage**:
   ```
   node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes
   ```

### Pre-configured Dashboard Ideas

- **System Health**: CPU, Memory, Disk, Network
- **Application Performance**: Request rates, error rates, latencies
- **Database Performance**: Connection pool, query times
- **Container Performance**: Per-container resource usage
- **Service Dependencies**: Trace-based dependency visualization

## Troubleshooting

### Issue: Jaeger not receiving traces

**Symptoms**: No traces showing in Jaeger UI

**Solutions**:
1. Verify OTEL_EXPORTER_OTLP_ENDPOINT is set correctly
2. Check Jaeger container is running: `docker-compose ps | grep jaeger`
3. Check service logs: `docker-compose logs jaeger`
4. Verify network connectivity: `docker exec <service> curl http://jaeger:4318`

### Issue: Prometheus not scraping metrics

**Symptoms**: No data in Prometheus UI

**Solutions**:
1. Check Prometheus configuration: `cat ./monitoring/prometheus.yml`
2. Verify scrape targets: Navigate to Prometheus UI → Status → Targets
3. Check target health status (should be "UP")
4. Review Prometheus logs: `docker-compose logs prometheus`

### Issue: Node Exporter not exporting metrics

**Symptoms**: host_* metrics not appearing in Prometheus

**Solutions**:
1. Verify node-exporter container is running
2. Check metrics endpoint: `curl http://localhost:9100/metrics`
3. Review prometheus.yml job configuration for node-exporter
4. Check Docker volume mounts for node-exporter

### Issue: Grafana can't connect to data sources

**Symptoms**: "Data source is not working" error in Grafana

**Solutions**:
1. Go to Grafana Settings → Data Sources
2. Test connection for each data source
3. Verify URLs are using container names (http://prometheus:9090)
4. Check Grafana container logs: `docker-compose logs grafana`

### Issue: High memory usage in services

**Solutions**:
1. Check for memory leaks in traces
2. Reduce trace sampling rate if needed
3. Check Prometheus retention settings
4. Review container resource limits

## Performance Tuning

### Optimize Prometheus Storage
```yaml
# In prometheus.yml
global:
  scrape_interval: 15s      # Reduce from default 1m
  evaluation_interval: 15s  # Reduce from default 1m
  external_labels:
    cluster: 'production'

# In docker-compose.yml (prometheus service)
command:
  - '--storage.tsdb.retention.time=7d'  # Set retention period
```

### Optimize Jaeger Storage
- Use OpenSearch or Elasticsearch for larger deployments
- Adjust sampling rate based on traffic

### Optimize Grafana Dashboards
- Limit query time range for faster visualization
- Use recording rules in Prometheus for expensive queries
- Cache frequently used dashboards

## Additional Resources

- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [Jaeger Documentation](https://www.jaegertracing.io/docs/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Node Exporter Metrics](https://github.com/prometheus/node_exporter)
- [cAdvisor Documentation](https://github.com/google/cadvisor)
