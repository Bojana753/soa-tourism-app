# Monitoring Documentation Index

Welcome to the SOA Tourism Application Monitoring Setup! This directory contains comprehensive documentation for the distributed tracing, metrics collection, and host monitoring infrastructure.

## 📚 Documentation Files

### Getting Started
- **[QUICK_START.md](QUICK_START.md)** ⭐ START HERE
  - Fast setup instructions
  - Common commands
  - Access URLs for all UIs
  - Quick troubleshooting fixes
  - ~5 minutes to get everything running

### Core Documentation
- **[ARCHITECTURE.md](ARCHITECTURE.md)**
  - System architecture overview
  - Data flow diagrams
  - Port mapping
  - Component relationships
  - Helpful for understanding how everything fits together

- **[../MONITORING.md](../MONITORING.md)**
  - Comprehensive monitoring guide
  - Component descriptions
  - Detailed setup instructions
  - Accessing and using each UI
  - Troubleshooting guide
  - Performance tuning

### Advanced Guides
- **[PROMQL_QUERIES.md](PROMQL_QUERIES.md)**
  - PromQL query reference
  - Service-level metrics
  - Host machine metrics
  - Container metrics
  - Application-specific queries
  - SLA monitoring queries
  - Copy-paste ready examples

- **[CUSTOM_INSTRUMENTATION.md](CUSTOM_INSTRUMENTATION.md)**
  - How to add custom traces
  - How to add custom metrics
  - Java examples (Micrometer, Spring AOP)
  - Go examples (Prometheus client)
  - Best practices
  - Anti-patterns to avoid

### Deployment
- **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)**
  - What has been implemented
  - Pre-deployment checklist
  - Deployment steps
  - Post-deployment verification
  - Metrics reference
  - Success criteria
  - Troubleshooting commands

## 🚀 Quick Start (60 seconds)

```bash
# 1. Navigate to project root
cd d:\SOA\soa-tourism-app

# 2. Start all services with monitoring
docker-compose up -d

# 3. Open the UIs (wait 30 seconds)
# Jaeger:      http://localhost:16686
# Prometheus:  http://localhost:9090
# Grafana:     http://localhost:3000 (admin/admin)
# cAdvisor:    http://localhost:8089
```

That's it! All monitoring is ready to use.

## 📊 The 5 Monitoring UIs

| UI | Port | Purpose | When to Use |
|----|------|---------|-------------|
| **Jaeger** | 16686 | Distributed Tracing | Debug multi-service request flows |
| **Prometheus** | 9090 | Metrics Database | Query specific metrics, create alerts |
| **Grafana** | 3000 | Dashboards | Monitor system health in real-time |
| **cAdvisor** | 8089 | Container Stats | Check Docker container resource usage |
| **Node Exporter** | 9100 | Host Metrics | Raw host machine metrics |

## 🎯 Common Tasks

### I want to...

**View a distributed trace across services**
→ See QUICK_START.md → "View Distributed Traces"

**Check if a service is healthy**
→ See QUICK_START.md → "Check Service Health" or PROMQL_QUERIES.md → "System Health"

**Find slow API endpoints**
→ See PROMQL_QUERIES.md → "Response Time (Latency)"

**Monitor CPU/Memory/Disk usage**
→ See PROMQL_QUERIES.md → "Host Machine Metrics"

**Track container resource usage**
→ See PROMQL_QUERIES.md → "Container Metrics"

**Add custom metrics to my service**
→ See CUSTOM_INSTRUMENTATION.md

**Create a custom dashboard**
→ See MONITORING.md → "Creating Custom Dashboards in Grafana"

**Understand the data flow**
→ See ARCHITECTURE.md → "High-Level System Architecture"

**Debug monitoring issues**
→ See MONITORING.md → "Troubleshooting"

**Set up alerts**
→ See MONITORING.md → "Alerting Setup (Optional)"

## 📈 What's Being Monitored

### Application Metrics
- ✅ HTTP request rate, latency, errors (per service)
- ✅ Database query performance
- ✅ Business metrics (tours created, purchases, etc.)
- ✅ JVM metrics (Java services only)
- ✅ Go runtime metrics (Go services only)

### Host Metrics
- ✅ CPU utilization
- ✅ Memory usage
- ✅ Disk space and I/O
- ✅ Network traffic

### Container Metrics
- ✅ Per-container CPU usage
- ✅ Per-container memory usage
- ✅ Per-container network I/O
- ✅ Container lifecycle events

### Distributed Traces
- ✅ Request path through microservices
- ✅ Operation latencies
- ✅ Error tracking
- ✅ Span attributes and tags

## 🔧 Configuration

All monitoring configuration is located in the `monitoring/` directory:

- **prometheus.yml** - Prometheus scrape configuration
- **grafana-datasources.yml** - Grafana data source setup
- **grafana-dashboards.yml** - Grafana dashboard provisioning

To modify collection intervals, edit `prometheus.yml`:
```yaml
global:
  scrape_interval: 15s  # Change here (default 15s)
```

To change Prometheus retention, edit `docker-compose.yml`:
```yaml
command:
  - '--storage.tsdb.retention.time=7d'  # Change here
```

## 📝 Implementation Details

### Java Services (OpenTelemetry)
- **Dependencies**: opentelemetry-spring-boot-starter, micrometer-registry-prometheus
- **Configuration**: application.yml/properties
- **Metrics Endpoint**: `/actuator/prometheus`
- **Auto-instrumentation**: Spring Boot starter handles most instrumentation

### Go Services (OpenTelemetry)
- **Dependencies**: go.opentelemetry.io/otel packages, prometheus client
- **Implementation**: Custom telemetry.go files
- **Metrics Endpoint**: `:8888/metrics`
- **Manual instrumentation**: Services must create spans explicitly

### All Services
- **Trace Export**: OTLP HTTP to Jaeger (:4318)
- **Metrics Export**: Prometheus scrape endpoints
- **Environment Variables**: OTEL_EXPORTER_OTLP_ENDPOINT, etc.

## 🐛 Troubleshooting

**Can't access Jaeger UI?**
- Check: `docker-compose ps | grep jaeger`
- Check logs: `docker-compose logs jaeger`

**No metrics in Prometheus?**
- Check targets: http://localhost:9090/targets
- All targets should show "UP" status

**No traces in Jaeger?**
- Verify: `docker-compose logs | grep -i "otel\|jaeger"`
- Generate test traffic: `curl http://localhost:8080/api/tours/published`

**Services won't start?**
- Check logs: `docker-compose logs`
- Verify ports are available: `netstat -an | grep LISTEN`
- Try cleanup: `docker-compose down -v && docker-compose up -d`

See MONITORING.md for more detailed troubleshooting.

## 🎓 Learning Path

1. **Beginner**: Start with QUICK_START.md
2. **Intermediate**: Read ARCHITECTURE.md to understand components
3. **Practical**: Try queries in PROMQL_QUERIES.md
4. **Advanced**: Follow CUSTOM_INSTRUMENTATION.md to add your own metrics
5. **Expert**: Refer to DEPLOYMENT_CHECKLIST.md for production setup

## 📚 External Resources

- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [Jaeger Official Docs](https://www.jaegertracing.io/docs/)
- [Prometheus Official Docs](https://prometheus.io/docs/)
- [Grafana Official Docs](https://grafana.com/docs/)
- [Node Exporter GitHub](https://github.com/prometheus/node_exporter)
- [cAdvisor GitHub](https://github.com/google/cadvisor)

## ❓ FAQ

**Q: Will monitoring slow down my services?**
A: Minimal impact (<5% overhead). Instrumentation is optimized for production use.

**Q: How much storage does Prometheus need?**
A: 1-5 GB per week depending on traffic. Configurable via retention settings.

**Q: Can I use this in production?**
A: Yes! This is production-ready. For large-scale deployments, consider:
   - Distributed Prometheus setup
   - Elasticsearch backend for Jaeger
   - Dedicated monitoring infrastructure

**Q: How do I export/backup monitoring data?**
A: See DEPLOYMENT_CHECKLIST.md → "Backing Up Configuration"

**Q: Can I add more services to monitoring?**
A: Yes! Add to prometheus.yml and update docker-compose.yml

**Q: What if I want different retention periods?**
A: Edit docker-compose.yml prometheus service command

## 🎯 Success Criteria (4th Control Point - ЧЕТВРТА КТ)

Your monitoring setup successfully fulfills the requirements when:

- ✅ Jaeger shows distributed traces of multi-service requests
- ✅ Prometheus displays metrics from all microservices
- ✅ Node Exporter metrics show in Prometheus (CPU, RAM, disk, network)
- ✅ Container metrics visible in Prometheus/cAdvisor
- ✅ Grafana dashboards display real-time system health
- ✅ All documentation is clear and comprehensive

## 📞 Support

For issues:
1. Check QUICK_START.md for common fixes
2. Review MONITORING.md Troubleshooting section
3. Check `docker-compose logs <service_name>`
4. Verify all containers are running: `docker-compose ps`

## 📄 Documentation Structure

```
monitoring/
├── README.md (this file)
├── QUICK_START.md (Start here!)
├── ARCHITECTURE.md (How everything fits together)
├── PROMQL_QUERIES.md (Query examples)
├── CUSTOM_INSTRUMENTATION.md (Add your own metrics)
├── DEPLOYMENT_CHECKLIST.md (Full checklist)
├── prometheus.yml (Prometheus configuration)
├── grafana-datasources.yml (Grafana data sources)
└── grafana-dashboards.yml (Grafana dashboard config)
```

---

**Ready to get started?** Open [QUICK_START.md](QUICK_START.md) now!
