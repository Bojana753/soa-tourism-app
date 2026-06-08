# Adding Custom Tracing and Metrics

This guide shows you how to add custom OpenTelemetry tracing and metrics to your microservices.

## Table of Contents
1. [Java Custom Instrumentation](#java-custom-instrumentation)
2. [Go Custom Instrumentation](#go-custom-instrumentation)
3. [Best Practices](#best-practices)
4. [Examples](#examples)

## Java Custom Instrumentation

### Adding Custom Metrics

**Using Micrometer**:

```java
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.stereotype.Service;

@Service
public class BlogService {
    private final MeterRegistry meterRegistry;
    
    public BlogService(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
    }
    
    public void createBlogPost(Blog blog) {
        try {
            // Your business logic
            meterRegistry.counter("blog.posts.created", 
                "author", blog.getAuthorId().toString()).increment();
            
            meterRegistry.timer("blog.post.creation.time").record(() -> {
                // Measure this block of code
                saveBlogPost(blog);
            });
        } catch (Exception e) {
            meterRegistry.counter("blog.posts.creation.errors").increment();
        }
    }
    
    public void likeBlogPost(Long postId) {
        meterRegistry.gauge("blog.post.likes", blog.getLikes());
    }
}
```

**Available Metric Types**:
- `counter()` - Monotonically increasing value
- `timer()` - Measures execution time
- `gauge()` - Current value
- `distributionSummary()` - Records a distribution of values

### Adding Custom Traces

**Using Spring AOP (Aspect-Oriented Programming)**:

```java
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;
import io.opentelemetry.api.trace.Tracer;
import io.opentelemetry.api.trace.Span;

@Aspect
@Component
public class TracingAspect {
    private final Tracer tracer;
    
    public TracingAspect(Tracer tracer) {
        this.tracer = tracer;
    }
    
    @Around("@annotation(com.example.Traced)")
    public Object traceMethod(ProceedingJoinPoint joinPoint) throws Throwable {
        Span span = tracer.spanBuilder(joinPoint.getSignature().getName()).startSpan();
        
        try (var scope = span.makeCurrent()) {
            span.setAttribute("method", joinPoint.getSignature().getName());
            span.setAttribute("class", joinPoint.getSignature().getDeclaringTypeName());
            
            Object result = joinPoint.proceed();
            
            span.setAttribute("success", true);
            return result;
        } catch (Exception e) {
            span.setAttribute("error", true);
            span.setAttribute("error.type", e.getClass().getName());
            throw e;
        } finally {
            span.end();
        }
    }
}
```

**Create a @Traced annotation**:

```java
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Traced {
}
```

**Use the annotation**:

```java
@Service
public class TourService {
    
    @Traced
    public Tour createTour(CreateTourRequest request) {
        // This method will be automatically traced
        return new Tour(request);
    }
}
```

### Manual Trace Creation

```java
import io.opentelemetry.api.GlobalOpenTelemetry;
import io.opentelemetry.api.trace.Tracer;

@Service
public class PurchaseService {
    private final Tracer tracer;
    
    public PurchaseService() {
        this.tracer = GlobalOpenTelemetry.getTracer("purchase-service");
    }
    
    public PurchaseToken purchaseTour(Long touristId, Long tourId) {
        var span = tracer.spanBuilder("purchaseTour")
            .setAttribute("touristId", touristId)
            .setAttribute("tourId", tourId)
            .startSpan();
            
        try (var scope = span.makeCurrent()) {
            // Validate tour
            validateTour(tourId);
            
            // Process payment
            processPayment(touristId, tourId);
            
            // Create token
            PurchaseToken token = createToken(touristId, tourId);
            span.setAttribute("token", token.getId());
            
            return token;
        } catch (Exception e) {
            span.recordException(e);
            span.setAttribute("error", true);
            throw e;
        } finally {
            span.end();
        }
    }
}
```

## Go Custom Instrumentation

### Adding Custom Metrics

**Using Prometheus client**:

```go
package main

import (
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

var (
	// Counter
	postsCreated = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "blog_posts_created_total",
			Help: "Total number of blog posts created",
		},
		[]string{"author_id", "status"},
	)

	// Histogram (for latency)
	postCreationDuration = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "blog_post_creation_duration_seconds",
			Help:    "Time spent creating blog posts",
			Buckets: prometheus.DefBuckets,
		},
		[]string{"author_id"},
	)

	// Gauge (for current value)
	activeUsers = promauto.NewGauge(
		prometheus.GaugeOpts{
			Name: "active_users_total",
			Help: "Total number of active users",
		},
	)
)

func createBlogPost(authorID string, blog *Blog) {
	timer := prometheus.NewTimer(postCreationDuration.WithLabelValues(authorID))
	defer timer.ObserveDuration()

	err := saveBlog(blog)
	if err != nil {
		postsCreated.WithLabelValues(authorID, "error").Inc()
		return
	}
	
	postsCreated.WithLabelValues(authorID, "success").Inc()
}
```

### Adding Custom Traces

**Using OpenTelemetry**:

```go
package main

import (
	"context"
	"github.com/prometheus/client_golang/prometheus"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
)

func main() {
	tracer := otel.Tracer("blog-service")
	
	ctx, span := tracer.Start(
		context.Background(),
		"createBlogPost",
		trace.WithAttributes(
			attribute.String("author", "user123"),
			attribute.String("title", "My First Post"),
		),
	)
	defer span.End()

	// Your business logic here
	if err := saveBlogToDatabase(ctx); err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, "Failed to save blog")
		return
	}
	
	span.AddEvent("blog_post_created", trace.WithAttributes(
		attribute.Int64("postId", 12345),
	))
}
```

**Creating child spans**:

```go
func processBlogRequest(ctx context.Context, blog *Blog) {
	tracer := otel.Tracer("blog-service")
	
	// Parent span
	ctx, span := tracer.Start(ctx, "processBlogRequest")
	defer span.End()
	
	// Child span 1: Validate
	ctx, validateSpan := tracer.Start(ctx, "validateBlog")
	if !validateBlog(blog) {
		validateSpan.SetStatus(codes.Error, "Validation failed")
	}
	validateSpan.End()
	
	// Child span 2: Save
	ctx, saveSpan := tracer.Start(ctx, "saveBlog")
	if err := saveBlog(ctx, blog); err != nil {
		saveSpan.RecordError(err)
		saveSpan.SetStatus(codes.Error, err.Error())
	}
	saveSpan.End()
	
	// Child span 3: Notify followers
	ctx, notifySpan := tracer.Start(ctx, "notifyFollowers")
	notifyFollowers(ctx, blog.AuthorID)
	notifySpan.End()
}
```

## Best Practices

### 1. Naming Conventions

**Metrics**:
```
[namespace]_[subsystem]_[name]_[unit]

Examples:
- blog_posts_created_total
- tour_execution_duration_seconds
- purchase_amount_total
- database_connection_pool_size
```

**Spans**:
```
Use verb-noun format or operation name

Examples:
- createBlogPost
- updateTourStatus
- processPurchase
- validateTourist
```

### 2. Appropriate Metric Types

```
Use COUNTER for:  - Requests processed
                  - Errors encountered
                  - Items created/deleted

Use GAUGE for:    - Current connections
                  - Memory usage
                  - Temperature readings
                  - Current number of users

Use HISTOGRAM for:- Request latency
                  - Response size
                  - Processing duration
```

### 3. Labeling Strategy

```java
// Good: Specific labels
meterRegistry.counter("http.requests", 
    "method", "POST",
    "endpoint", "/api/tours",
    "status", "200").increment();

// Bad: Too many labels (cardinality explosion)
meterRegistry.counter("http.requests",
    "user_id", userId,     // BAD! User IDs are unbounded
    "request_id", reqId).increment();
```

### 4. Sampling High-Volume Traces

```go
// Only sample 10% of traces
sampler := sdktrace.ParentBased(sdktrace.TraceIDRatioBased(0.1))

tp := sdktrace.NewTracerProvider(
    sdktrace.WithSampler(sampler),
    sdktrace.WithBatcher(exporter),
)
```

### 5. Avoid High-Cardinality Labels

```java
// Bad - Can create thousands of unique label combinations
counter("request", "user_id", userId).increment();

// Good - Limited values
counter("request", "status", status).increment();

// Good - Bucketed values
counter("request", "response_time_bucket", 
    getLatencyBucket(duration)).increment();
```

## Examples

### Example 1: Blog Post Creation Flow

**Java**:
```java
@Service
public class BlogService {
    private final MeterRegistry metrics;
    private final Tracer tracer;

    public Blog createPost(CreatePostRequest request) {
        Span span = tracer.spanBuilder("createBlogPost")
            .setAttribute("userId", request.getUserId())
            .startSpan();
        
        try (var scope = span.makeCurrent()) {
            // Step 1: Validate
            span.addEvent("validating_request");
            validateRequest(request);
            
            // Step 2: Create blog entity
            span.addEvent("creating_blog_entity");
            Blog blog = new Blog(request);
            metrics.counter("blog.posts.created", "status", "created").increment();
            
            // Step 3: Save to database
            span.addEvent("saving_to_database");
            Blog saved = repository.save(blog);
            metrics.counter("blog.posts.saved", "status", "success").increment();
            
            // Step 4: Notify followers
            span.addEvent("notifying_followers");
            followerService.notifyFollowers(request.getUserId());
            
            return saved;
        } catch (Exception e) {
            span.recordException(e);
            metrics.counter("blog.posts.created", "status", "error").increment();
            throw e;
        } finally {
            span.end();
        }
    }
}
```

**Go**:
```go
func createBlogPost(ctx context.Context, req *CreatePostRequest) (*Blog, error) {
    tracer := otel.Tracer("blog-service")
    ctx, span := tracer.Start(ctx, "createBlogPost")
    defer span.End()

    span.SetAttributes(
        attribute.String("userId", req.UserID),
        attribute.String("title", req.Title),
    )

    // Step 1: Validate
    span.AddEvent("validating_request")
    if err := validateRequest(req); err != nil {
        span.RecordError(err)
        postsCreated.WithLabelValues(req.UserID, "error").Inc()
        return nil, err
    }

    // Step 2: Create blog
    span.AddEvent("creating_blog")
    blog := &Blog{
        Title: req.Title,
        Content: req.Content,
        AuthorID: req.UserID,
    }

    // Step 3: Save to database
    span.AddEvent("saving_to_database")
    if err := db.Save(ctx, blog); err != nil {
        span.RecordError(err)
        postsCreated.WithLabelValues(req.UserID, "error").Inc()
        return nil, err
    }

    // Step 4: Notify followers
    span.AddEvent("notifying_followers")
    notifyFollowers(ctx, req.UserID)

    postsCreated.WithLabelValues(req.UserID, "success").Inc()
    return blog, nil
}
```

### Example 2: Tour Purchase with Error Tracking

**Java**:
```java
@Service
public class PurchaseService {
    private final MeterRegistry metrics;
    private final TourServiceClient tourClient;
    
    public PurchaseToken purchaseTour(Long touristId, Long tourId) {
        Timer.Sample sample = Timer.start(metrics.timer("purchase.duration"));
        
        try {
            // Validate tour
            Tour tour = tourClient.getTour(tourId);
            if (tour == null) {
                metrics.counter("purchase.errors", "reason", "tour_not_found").increment();
                throw new TourNotFoundException(tourId);
            }
            
            // Process payment
            processPayment(touristId, tour.getPrice());
            
            // Create token
            PurchaseToken token = new PurchaseToken(touristId, tourId);
            repository.save(token);
            
            metrics.counter("purchase.completed", 
                "tour_id", tourId.toString()).increment();
            metrics.gauge("purchase.amount", tour.getPrice());
            
            return token;
        } catch (PaymentException e) {
            metrics.counter("purchase.errors", "reason", "payment_failed").increment();
            throw e;
        } finally {
            sample.stop();
        }
    }
}
```

### Example 3: Tour Execution Tracking

**Go**:
```go
var (
    executionStarted = prometheus.NewCounterVec(
        prometheus.CounterOpts{
            Name: "tour_execution_started_total",
        },
        []string{"tour_id"},
    )
    
    executionDuration = prometheus.NewHistogramVec(
        prometheus.HistogramOpts{
            Name: "tour_execution_duration_seconds",
        },
        []string{"tour_id", "status"},
    )
)

func executeTour(ctx context.Context, touristId, tourId int64) error {
    tracer := otel.Tracer("tour-service")
    ctx, span := tracer.Start(ctx, "executeTour")
    defer span.End()
    
    span.SetAttributes(
        attribute.Int64("tourist_id", touristId),
        attribute.Int64("tour_id", tourId),
    )
    
    timer := prometheus.NewTimer(
        executionDuration.WithLabelValues(fmt.Sprintf("%d", tourId)),
    )
    defer timer.ObserveDuration()
    
    executionStarted.WithLabelValues(fmt.Sprintf("%d", tourId)).Inc()
    
    // Track keypoint completions
    for keypoint := range tour.Keypoints {
        ctx, kpSpan := tracer.Start(ctx, "completeKeypoint")
        kpSpan.SetAttributes(
            attribute.String("keypoint_name", keypoint.Name),
        )
        
        // Process keypoint
        completeKeypoint(ctx, touristId, keypoint)
        
        kpSpan.End()
    }
    
    return nil
}
```

## Querying Your Custom Metrics

### In Prometheus UI

```promql
# Blog posts by author
sum(rate(blog_posts_created_total[5m])) by (author_id)

# Tour purchase success rate
sum(rate(purchase_completed_total[5m])) / sum(rate(purchase_errors_total[5m])) * 100

# P95 purchase latency
histogram_quantile(0.95, purchase_duration_seconds_bucket)
```

### In Jaeger UI

1. Select service
2. Select operation (e.g., "createBlogPost")
3. Add tags to filter (e.g., userId="user123")
4. View trace details with your custom spans
