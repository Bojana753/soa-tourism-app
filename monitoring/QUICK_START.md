# Quick Start Guide - Monitoring Stack

## Fast Track Setup

### 1. Start Everything
```bash
cd d:\SOA\soa-tourism-app
docker-compose up -d
```

Wait 30-60 seconds for services to initialize.

### 2. Access the UI's

| Component | URL | Purpose |
|-----------|-----|---------|
| **Jaeger** | http://localhost:16686 | Distributed Tracing |
| **Prometheus** | http://localhost:9090 | Metrics Database |
| **Grafana** | http://localhost:3000 | Dashboards (admin/admin) |
| **Node Exporter** | http://localhost:9100/metrics | Host metrics |
| **cAdvisor** | http://localhost:8089 | Container metrics |

## Common Tasks

### View Distributed Traces

1. Open http://localhost:16686
2. Select service from dropdown (e.g., "api-gateway", "blog-service")
3. Click "Find Traces"
4. Click on any trace to see detailed breakdown

### Query Metrics in Prometheus

1. Open http://localhost:9090
2. Go to "Graph" tab
3. Enter PromQL query in the search box

**Example Queries**:
```promql
# Request rate (requests per second)
rate(http_requests_total[1m])

# Error rate
rate(http_requests_total{status=~"5.."}[1m])

# Response time (p95)
histogram_quantile(0.95, http_request_duration_seconds_bucket)

# Memory usage percentage
(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100

# CPU usage percentage
100 - (avg by (cpu) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# Disk usage percentage
(1 - (node_filesystem_avail_bytes / node_filesystem_size_bytes)) * 100

# Network traffic (bytes per second)
rate(node_network_receive_bytes_total[1m])
rate(node_network_transmit_bytes_total[1m])

# Docker container memory
container_memory_usage_bytes

# Docker container CPU
container_cpu_user_seconds_total
```

### Check Service Health

```bash
# Blog Service metrics
curl http://localhost:8082/actuator/health

# Tour Service metrics
curl http://localhost:8084/actuator/health

# Purchase Service metrics
curl http://localhost:8085/actuator/health
```

### View Container Metrics

1. Open http://localhost:8089
2. Browse `/docker` endpoint to see all containers
3. Check individual container stats under `/api/v1/docker/`

### Manually Trigger a Load

Generate traces and metrics:

```bash
# Send requests to API Gateway to generate traces
for i in {1..100}; do
  curl -X GET http://localhost:8080/api/tours/published
done

# Check traces in Jaeger
# Open http://localhost:16686
# Service: api-gateway
# Operation: GetPublishedTours
```

## Stopping Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v
```

## Checking Logs

```bash
# View logs from specific service
docker-compose logs blog-service
docker-compose logs jaeger
docker-compose logs prometheus

# Follow logs in real-time
docker-compose logs -f api-gateway

# View last 100 lines
docker-compose logs --tail=100 tour-service
```

## Performance Monitoring Commands

```bash
# Monitor real-time container stats
docker stats

# Check service resource usage
docker-compose stats

# View Prometheus targets status
curl http://localhost:9090/api/v1/targets | jq

# Check Jaeger status
curl http://localhost:16686/status

# List all metrics in Prometheus
curl http://localhost:9090/api/v1/label/__name__/values | jq '.data[]' | head -20
```

## Alerting Setup (Optional)

To add alerts, edit `./monitoring/prometheus.yml`:

```yaml
alerting:
  alertmanagers:
    - static_configs:
        - targets:
            - 'alertmanager:9093'

rule_files:
  - '/etc/prometheus/alerts.yml'
```

Create `./monitoring/alerts.yml`:

```yaml
groups:
  - name: example
    interval: 15s
    rules:
      - alert: HighMemoryUsage
        expr: (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) > 0.85
        for: 5m
        annotations:
          summary: "High memory usage detected"

      - alert: HighCPUUsage
        expr: (100 - (avg by (cpu) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)) > 80
        for: 5m
        annotations:
          summary: "High CPU usage detected"

      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        annotations:
          summary: "High error rate detected"
```

## Tips & Tricks

### 1. Export metrics data
```bash
# Export Prometheus data
curl 'http://localhost:9090/api/v1/query_range?query=http_requests_total&start=1234567890&end=1234567900&step=30' | jq > metrics.json
```

### 2. Search traces by span tags
In Jaeger UI, use advanced search:
- `service.name:"blog-service"`
- `span.kind:"server"`
- `http.status_code:500`

### 3. Create custom metrics in code

**Java Example**:
```java
import io.micrometer.core.instrument.MeterRegistry;

@Service
public class BlogService {
    private final MeterRegistry meterRegistry;
    
    public void createPost(Blog blog) {
        meterRegistry.counter("blog.posts.created").increment();
        // ... rest of logic
    }
}
```

**Go Example**:
```go
import "github.com/prometheus/client_golang/prometheus"

var postsCreated = prometheus.NewCounter(prometheus.CounterOpts{
    Name: "blog_posts_created_total",
    Help: "Total number of blog posts created",
})

func createPost(blog *Blog) {
    postsCreated.Inc()
    // ... rest of logic
}
```

### 4. Set up Grafana alerts
1. In Grafana, create an Alert Notification Channel
2. Add alert rules to panels
3. Set thresholds and notification channels

## Troubleshooting Quick Fixes

| Problem | Solution |
|---------|----------|
| No traces in Jaeger | Check: `docker-compose logs jaeger` |
| Prometheus has no data | Check targets: http://localhost:9090/targets |
| Can't connect to Grafana | Check if running: `docker ps \| grep grafana` |
| High memory usage | Reduce `storage.tsdb.retention.time` in prometheus |
| Slow dashboard | Use narrower time ranges, or use recording rules |

## Next Steps

1. **Create custom dashboards** in Grafana
2. **Set up alerts** for critical metrics
3. **Export traces** for long-term analysis
4. **Integrate with ELK stack** for log aggregation
5. **Set up distributed tracing** across multiple clusters
