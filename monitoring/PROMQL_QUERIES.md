# PromQL Query Reference

This guide provides useful PromQL queries for monitoring the SOA Tourism Application.

## Service-Level Metrics

### Request Rate by Service

```promql
# Requests per second by service
sum(rate(http_requests_total[1m])) by (service)

# Requests per second by service and endpoint
sum(rate(http_requests_total[1m])) by (service, endpoint)

# Requests per second by status code
sum(rate(http_requests_total[1m])) by (status)
```

### Error Rate

```promql
# Error rate (5xx responses)
sum(rate(http_requests_total{status=~"5.."}[1m])) by (service)

# Error rate percentage
sum(rate(http_requests_total{status=~"5.."}[5m])) by (service) 
/ 
sum(rate(http_requests_total[5m])) by (service) * 100

# 4xx error rate (client errors)
sum(rate(http_requests_total{status=~"4.."}[1m])) by (service)
```

### Response Time (Latency)

```promql
# Average response time
avg(http_request_duration_seconds) by (service)

# P50 (median) response time
histogram_quantile(0.50, http_request_duration_seconds_bucket) by (service)

# P95 response time
histogram_quantile(0.95, http_request_duration_seconds_bucket) by (service)

# P99 response time
histogram_quantile(0.99, http_request_duration_seconds_bucket) by (service)

# Max response time
max(http_request_duration_seconds) by (service)
```

## Host Machine Metrics

### CPU Metrics

```promql
# CPU usage percentage (all cores average)
100 - (avg(irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# CPU usage per core
100 - (avg by (cpu) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# User mode CPU time
avg(rate(node_cpu_seconds_total{mode="user"}[5m])) * 100

# System mode CPU time
avg(rate(node_cpu_seconds_total{mode="system"}[5m])) * 100

# Load average (1 minute)
node_load1

# Load average (5 minutes)
node_load5

# Load average (15 minutes)
node_load15
```

### Memory Metrics

```promql
# Memory usage percentage
(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100

# Memory usage in GB
(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / 1024 / 1024 / 1024

# Free memory in GB
node_memory_MemAvailable_bytes / 1024 / 1024 / 1024

# Total memory in GB
node_memory_MemTotal_bytes / 1024 / 1024 / 1024

# Cached memory percentage
(node_memory_Cached_bytes / node_memory_MemTotal_bytes) * 100

# Swap usage percentage
(1 - (node_memory_SwapFree_bytes / node_memory_SwapTotal_bytes)) * 100
```

### Disk Metrics

```promql
# Disk usage percentage (root filesystem)
(1 - (node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"})) * 100

# Disk usage per filesystem
(1 - (node_filesystem_avail_bytes / node_filesystem_size_bytes)) * 100

# Free disk space in GB
node_filesystem_avail_bytes / 1024 / 1024 / 1024

# Total disk space in GB
node_filesystem_size_bytes / 1024 / 1024 / 1024

# Disk read speed (bytes per second)
rate(node_disk_read_bytes_total[1m])

# Disk write speed (bytes per second)
rate(node_disk_written_bytes_total[1m])

# Disk I/O operations per second
rate(node_disk_reads_completed_total[1m]) + rate(node_disk_writes_completed_total[1m])
```

### Network Metrics

```promql
# Network receive speed (bytes per second)
rate(node_network_receive_bytes_total[1m])

# Network transmit speed (bytes per second)
rate(node_network_transmit_bytes_total[1m])

# Total network traffic (bytes per second)
rate(node_network_receive_bytes_total[1m]) + rate(node_network_transmit_bytes_total[1m])

# Network packets received per second
rate(node_network_receive_packets_total[1m])

# Network packets transmitted per second
rate(node_network_transmit_packets_total[1m])

# Network errors (received)
rate(node_network_receive_errs_total[1m])

# Network errors (transmitted)
rate(node_network_transmit_errs_total[1m])

# Dropped packets (received)
rate(node_network_receive_drop_total[1m])

# Dropped packets (transmitted)
rate(node_network_transmit_drop_total[1m])
```

## Container Metrics (cAdvisor)

### Container Memory

```promql
# Memory usage per container (MB)
container_memory_usage_bytes / 1024 / 1024

# Memory limit per container (MB)
container_spec_memory_limit_bytes / 1024 / 1024

# Memory usage percentage per container
(container_memory_usage_bytes / container_spec_memory_limit_bytes) * 100
```

### Container CPU

```promql
# CPU usage per container (cores)
rate(container_cpu_user_seconds_total[1m]) + rate(container_cpu_system_seconds_total[1m])

# CPU usage percentage per container
(rate(container_cpu_user_seconds_total[1m]) + rate(container_cpu_system_seconds_total[1m])) * 100
```

### Container Filesystem

```promql
# Filesystem usage per container (MB)
container_fs_usage_bytes / 1024 / 1024

# Filesystem limit per container (MB)
container_fs_limit_bytes / 1024 / 1024

# Filesystem usage percentage
(container_fs_usage_bytes / container_fs_limit_bytes) * 100
```

### Container Network I/O

```promql
# Network receive bytes per container (per second)
rate(container_network_receive_bytes_total[1m])

# Network transmit bytes per container (per second)
rate(container_network_transmit_bytes_total[1m])

# Network packets received per container (per second)
rate(container_network_receive_packets_total[1m])

# Network packets transmitted per container (per second)
rate(container_network_transmit_packets_total[1m])
```

## Application-Specific Metrics

### Blog Service

```promql
# Blog posts created per minute
increase(blog_posts_created_total[1m])

# Blog posts created (cumulative)
blog_posts_created_total

# Average blog post creation time
avg(blog_post_creation_duration_seconds)

# Blog post comments per service
increase(blog_comments_total[1m])

# Blog post likes per minute
increase(blog_likes_total[1m])
```

### Tour Service

```promql
# Tours created per minute
increase(tour_created_total[1m])

# Tours published per minute
increase(tour_published_total[1m])

# Tours by difficulty
count(tour_info{difficulty!=""}) by (difficulty)

# Average tour price
avg(tour_price)

# Tour executions active
tour_executions_active

# Tour execution completion rate
rate(tour_executions_completed_total[1m]) / rate(tour_executions_total[1m])
```

### Purchase Service

```promql
# Purchases per minute
increase(purchase_total[1m])

# Total purchase amount
increase(purchase_amount_total[1m])

# Average purchase amount
avg(purchase_amount)

# Purchases by status
increase(purchase_total[1m]) by (status)

# Purchase error rate
rate(purchase_errors_total[1m])
```

### Follower Service

```promql
# New followers per minute
increase(followers_total[1m])

# Active followers
followers_active_total

# Follower recommendations served
rate(recommendations_served_total[1m])
```

## Combined/Cross-Service Metrics

### System Health Overview

```promql
# All critical alerts
ALERTS{alertstate="firing"}

# Service availability (percentage of requests without errors)
(sum(rate(http_requests_total{status!~"5.."}[5m])) by (service) / sum(rate(http_requests_total[5m])) by (service)) * 100

# Total request throughput
sum(rate(http_requests_total[1m]))

# Total error throughput
sum(rate(http_requests_total{status=~"5.."}[1m]))

# System resource utilization score
(100 - avg(irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100 
+ (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100
+ (1 - (node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"})) * 100) / 3
```

### SLA Monitoring

```promql
# Service availability (5xx errors)
100 * (1 - sum(rate(http_requests_total{status=~"5.."}[1m])) / sum(rate(http_requests_total[1m])))

# P95 latency SLA (target: 200ms)
histogram_quantile(0.95, http_request_duration_seconds_bucket) < 0.2

# Error rate SLA (target: <1%)
(sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))) < 0.01
```

### Trace-Based Metrics

```promql
# Trace count by service
traces_service_requests_total

# Average trace duration
avg(traces_service_request_duration_seconds)

# Traces with errors
traces_service_request_errors_total
```

## Recording Rules (For Performance)

Add to `./monitoring/prometheus.yml` for expensive queries:

```yaml
global:
  evaluation_interval: 15s

rule_files:
  - 'recording_rules.yml'
```

Create `./monitoring/recording_rules.yml`:

```yaml
groups:
  - name: cpu_metrics
    interval: 15s
    rules:
      - record: cpu:usage:percent
        expr: 100 - (avg(irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

  - name: memory_metrics
    interval: 15s
    rules:
      - record: memory:usage:percent
        expr: (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100

  - name: disk_metrics
    interval: 15s
    rules:
      - record: disk:usage:percent
        expr: (1 - (node_filesystem_avail_bytes / node_filesystem_size_bytes)) * 100

  - name: http_metrics
    interval: 15s
    rules:
      - record: http:requests:rate1m
        expr: sum(rate(http_requests_total[1m])) by (service, status)
      
      - record: http:errors:rate1m
        expr: sum(rate(http_requests_total{status=~"5.."}[1m])) by (service)
```

Then use the recording rules in queries:

```promql
# Use pre-computed metric
cpu:usage:percent

# Use pre-computed HTTP metrics
http:requests:rate1m
```

## Query Tips

1. **Use `rate()` for counters**: `rate(metric[5m])`
2. **Use `increase()` for trending**: `increase(metric[1h])`
3. **Use `histogram_quantile()` for latency**: `histogram_quantile(0.95, metric_bucket)`
4. **Filter by labels**: `metric{label="value"}`
5. **Aggregate across labels**: `sum(metric) by (label)`
6. **Use `offset` for comparisons**: `metric vs metric offset 1d`
