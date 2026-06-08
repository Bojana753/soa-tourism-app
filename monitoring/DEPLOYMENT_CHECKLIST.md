# Monitoring Implementation Summary & Deployment Checklist

## What Has Been Implemented

### ✅ Infrastructure Components Added

1. **Jaeger (Distributed Tracing)**
   - All-in-one deployment
   - OTLP HTTP receiver on port 4318
   - Web UI on port 16686
   - Connects to all microservices

2. **Prometheus (Metrics Collection)**
   - Metrics scraper and time-series database
   - Configured to collect from all services
   - Web UI on port 9090
   - Data retention: configurable

3. **Node Exporter (Host Metrics)**
   - Monitors host machine resources
   - CPU, Memory, Disk, Network metrics
   - Endpoint on port 9100

4. **cAdvisor (Container Metrics)**
   - Monitors Docker container metrics
   - Per-container resource usage
   - Web interface on port 8089

5. **Grafana (Visualization)**
   - Dashboards for metrics
   - Pre-configured data sources
   - Web interface on port 3000 (admin/admin)

### ✅ Java Services Updated

- **Blog Service** (pom.xml updated)
  - OpenTelemetry Spring Boot Starter
  - Micrometer + Prometheus registry
  - Application metrics endpoint at `/actuator/prometheus`

- **Tour Service** (pom.xml updated)
  - OpenTelemetry instrumentation
  - Prometheus metrics export
  - Application metrics endpoint at `/actuator/prometheus`

- **Purchase Service** (pom.xml updated)
  - OpenTelemetry integration
  - Micrometer metrics
  - Application metrics endpoint at `/actuator/prometheus`

### ✅ Go Services Updated

- **API Gateway** (telemetry.go created)
  - OpenTelemetry HTTP exporter
  - Prometheus metrics server on port 8888
  - Automatic tracing initialization

- **Stakeholders Service** (telemetry.go created)
  - OpenTelemetry instrumentation
  - Prometheus metrics export

- **Follower Service** (telemetry.go created)
  - OpenTelemetry tracing
  - Metrics server on port 8888

### ✅ Configuration Files Created

- **docker-compose.yml**: Updated with all monitoring services
- **monitoring/prometheus.yml**: Scrape configuration for all services
- **monitoring/grafana-datasources.yml**: Pre-configured data sources
- **monitoring/grafana-dashboards.yml**: Dashboard provisioning config

### ✅ Documentation Created

- **MONITORING.md**: Comprehensive monitoring guide
- **monitoring/QUICK_START.md**: Quick reference guide
- **monitoring/PROMQL_QUERIES.md**: PromQL query examples
- **monitoring/CUSTOM_INSTRUMENTATION.md**: How to add custom metrics/traces

## Deployment Checklist

### Pre-Deployment

- [ ] Java services: Confirm Maven dependencies are updated
  ```bash
  # In blog-service, tour-service, purchase-service directories
  mvn clean dependency:resolve
  ```

- [ ] Go services: Confirm module dependencies
  ```bash
  # In api-gateway, stakeholders-service, follower-service directories
  go mod download
  ```

- [ ] Verify Docker installation
  ```bash
  docker --version
  docker-compose --version
  ```

- [ ] Ensure ports 16686, 9090, 9100, 8089, 3000, 4318, 4317 are available

### Deployment

1. **Start the monitoring stack**:
   ```bash
   cd d:\SOA\soa-tourism-app
   docker-compose up -d
   ```

2. **Wait for services to initialize** (30-60 seconds):
   ```bash
   docker-compose ps
   ```

3. **Verify all services are running**:
   ```bash
   # Check containers
   docker ps | grep -E "jaeger|prometheus|grafana|node-exporter|cadvisor"
   ```

4. **Test connectivity**:
   ```bash
   # Test Jaeger
   curl http://localhost:16686/status
   
   # Test Prometheus
   curl http://localhost:9090/-/healthy
   
   # Test Node Exporter
   curl http://localhost:9100/metrics | head -10
   
   # Test Grafana
   curl -u admin:admin http://localhost:3000/api/health
   ```

### Post-Deployment Verification

- [ ] Access Jaeger UI: http://localhost:16686
  - Navigate to Services dropdown
  - Should see all 6 microservices listed

- [ ] Access Prometheus UI: http://localhost:9090
  - Go to Status → Targets
  - Verify all targets show "UP" status

- [ ] Generate test traces:
  ```bash
  for i in {1..10}; do
    curl http://localhost:8080/api/tours/published
    sleep 1
  done
  ```

- [ ] Verify traces in Jaeger:
  - Service: api-gateway
  - Operation: (should show operations)
  - Should see traces appearing

- [ ] Check metrics in Prometheus:
  - Execute: `http_requests_total`
  - Graph should show recent data points

- [ ] Access Grafana: http://localhost:3000
  - Login: admin / admin
  - Verify Prometheus data source is connected

## Metrics Exposed by Services

### Java Services - Actuator Metrics

```
GET /{service_port}/actuator/prometheus
```

Includes:
- JVM metrics (memory, GC, threads)
- HTTP request metrics
- Database connection pool metrics
- Spring Boot specific metrics

### Go Services - Prometheus Metrics

```
GET :8888/metrics  (for services with custom telemetry.go)
```

Includes:
- OpenTelemetry SDK metrics
- Process metrics (CPU, memory, file descriptors)
- Go runtime metrics (goroutines, GC, heap)

## Tracing Configuration

### Environment Variables Set

All services now receive:
- `OTEL_EXPORTER_OTLP_ENDPOINT`: Points to Jaeger (http://jaeger:4318)
- `OTEL_METRICS_EXPORTER`: Set to prometheus
- `MANAGEMENT_ENDPOINTS_WEB_EXPOSURE_INCLUDE`: Exposes actuator endpoints (Java)

### Trace Propagation

- Automatic context propagation across services
- Trace IDs flow through HTTP headers
- gRPC calls are automatically instrumented

## Metrics Collection

### Prometheus Scrape Intervals

- Application services: 10s
- Node Exporter: 15s (default)
- Jaeger: 10s
- cAdvisor: 15s (default)

Adjust in `monitoring/prometheus.yml` if needed.

## Common Monitoring Scenarios

### 1. Track a Single Request

```
1. Generate request: curl http://localhost:8080/api/tours/published
2. Open Jaeger: http://localhost:16686
3. Service: api-gateway → Find Traces
4. Click trace to see full path through all services
```

### 2. Monitor Service Health

```
1. Open Prometheus: http://localhost:9090
2. Query: up{job=~".*-service"}
3. Value 1 = UP, 0 = DOWN
```

### 3. Check Host Resources

```
1. Open Grafana: http://localhost:3000
2. Create panel with queries:
   - CPU: 100 - (avg(irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)
   - Memory: (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100
   - Disk: (1 - (node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"})) * 100
```

### 4. Debug High Latency

```
1. Prometheus: histogram_quantile(0.95, http_request_duration_seconds_bucket)
2. Jaeger: Filter by duration threshold
3. Identify slowest operations
```

## Troubleshooting Commands

```bash
# View all running containers and ports
docker-compose ps

# Check logs from specific service
docker-compose logs -f jaeger
docker-compose logs -f prometheus
docker-compose logs -f grafana

# Check if metrics are being collected
curl http://localhost:9090/api/v1/targets | jq '.data.activeTargets | length'

# Count number of metrics stored
curl 'http://localhost:9090/api/v1/query?query=count(ALERTS)' | jq

# Test service connectivity from within containers
docker-compose exec jaeger curl http://prometheus:9090/-/healthy

# Check Prometheus scrape errors
curl 'http://localhost:9090/api/v1/query_exemplars' | jq '.errors'
```

## Performance Impact

### Expected Resource Usage

- **Jaeger**: 100-200 MB RAM
- **Prometheus**: 200-500 MB RAM (depends on retention)
- **Grafana**: 50-100 MB RAM
- **Node Exporter**: 20-50 MB RAM
- **cAdvisor**: 100-200 MB RAM

**Total**: ~500-1000 MB additional RAM

### Mitigation Strategies

- Adjust Prometheus retention: `--storage.tsdb.retention.time=7d`
- Reduce scrape frequency in `prometheus.yml`
- Enable trace sampling in Jaeger (not 100% sampling)
- Use recording rules for expensive queries

## Backing Up Configuration

```bash
# Backup prometheus data
docker cp \
  $(docker ps -q -f "name=prometheus"):/prometheus \
  ./prometheus-backup

# Backup grafana dashboards
docker cp \
  $(docker ps -q -f "name=grafana"):/var/lib/grafana \
  ./grafana-backup

# Backup Jaeger data
docker cp \
  $(docker ps -q -f "name=jaeger"):/badger \
  ./jaeger-backup
```

## Updating Services

When you rebuild services after code changes:

```bash
# Rebuild and restart specific service
docker-compose up -d --build blog-service

# Rebuild and restart all services
docker-compose up -d --build

# Rebuild without caching (fresh start)
docker-compose build --no-cache
docker-compose up -d
```

## Cleanup

```bash
# Stop all services but keep data
docker-compose stop

# Stop and remove containers
docker-compose down

# Remove containers AND volumes (CAUTION: deletes data)
docker-compose down -v

# Remove specific service data
docker volume rm soa-tourism-app_prometheus_data
docker volume rm soa-tourism-app_grafana_data
```

## Next Steps for Development

1. **Add custom metrics** to critical business operations
   - See: `monitoring/CUSTOM_INSTRUMENTATION.md`

2. **Create custom dashboards** in Grafana
   - Start with templates in monitoring guide

3. **Set up alerts**
   - Define alert rules in Prometheus
   - Configure Alertmanager for notifications

4. **Integrate with external systems**
   - Send metrics to external Prometheus
   - Send traces to long-term trace storage
   - Integrate with incident management (PagerDuty, Slack, etc.)

5. **Performance optimization**
   - Analyze traces to find bottlenecks
   - Use metrics to guide optimization
   - Track improvements over time

## Success Criteria for 4th Control Point (ЧЕТВРТА КТ)

Your implementation should fulfill:

- ✅ **Distributed Tracing**: Traces visible in Jaeger UI showing cross-service calls
- ✅ **Host Metrics**: CPU, RAM, disk, network metrics available in Prometheus
- ✅ **Container Metrics**: Per-container resource usage in cAdvisor/Prometheus
- ✅ **Log Aggregation**: (Optional for full score, but you can integrate ELK stack)
- ✅ **Visualization**: Dashboards in Grafana showing system health
- ✅ **Documentation**: Clear explanation of monitoring setup

## Resources

- Full MONITORING.md guide
- Quick start in monitoring/QUICK_START.md
- PromQL queries in monitoring/PROMQL_QUERIES.md
- Custom instrumentation guide in monitoring/CUSTOM_INSTRUMENTATION.md

## Questions?

Refer to:
1. MONITORING.md for comprehensive documentation
2. monitoring/QUICK_START.md for immediate help
3. monitoring/PROMQL_QUERIES.md for metric examples
4. Docker logs for service-specific issues
