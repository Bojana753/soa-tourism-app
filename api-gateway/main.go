package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httputil"
	"net/url"
	"time"

	tourgrpc "api-gateway/generated/tour"

	"github.com/gorilla/mux"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-User-Id")
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func proxyHandler(target string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		targetURL, _ := url.Parse(target)
		proxy := httputil.NewSingleHostReverseProxy(targetURL)
		proxy.ModifyResponse = func(resp *http.Response) error {
			resp.Header.Del("Access-Control-Allow-Origin")
			resp.Header.Del("Access-Control-Allow-Methods")
			resp.Header.Del("Access-Control-Allow-Headers")
			resp.Header.Del("Access-Control-Allow-Credentials")
			return nil
		}
		proxy.ServeHTTP(w, r)
	}
}

type KeyPointJSON struct {
	Id          int64   `json:"id"`
	Name        string  `json:"name"`
	Description string  `json:"description"`
	Latitude    float64 `json:"latitude"`
	Longitude   float64 `json:"longitude"`
	ImageUrl    string  `json:"imageUrl"`
	OrderIndex  int32   `json:"orderIndex"`
}

type DurationJSON struct {
	Id            int64  `json:"id"`
	TransportType string `json:"transportType"`
	Minutes       int32  `json:"minutes"`
}

type TourJSON struct {
	Id          int64          `json:"id"`
	Name        string         `json:"name"`
	Description string         `json:"description"`
	Difficulty  string         `json:"difficulty"`
	Tags        []string       `json:"tags"`
	Status      string         `json:"status"`
	Price       float64        `json:"price"`
	AuthorId    int64          `json:"authorId"`
	LengthKm    float64        `json:"lengthKm"`
	PublishedAt string         `json:"publishedAt"`
	KeyPoints   []KeyPointJSON `json:"keyPoints"`
	Durations   []DurationJSON `json:"durations"`
}

func getPublishedToursGRPC(w http.ResponseWriter, r *http.Request) {
	conn, err := grpc.Dial(
		"tour-service:9090",
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		grpc.WithTimeout(5*time.Second),
	)
	if err != nil {
		fmt.Printf("gRPC connection error: %v\n", err)
		http.Error(w, "Failed to connect to tour-service via gRPC: "+err.Error(), http.StatusServiceUnavailable)
		return
	}
	defer conn.Close()

	client := tourgrpc.NewTourServiceClient(conn)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	response, err := client.GetPublishedTours(ctx, &tourgrpc.Empty{})
	if err != nil {
		fmt.Printf("gRPC call error: %v\n", err)
		http.Error(w, "gRPC call failed: "+err.Error(), http.StatusInternalServerError)
		return
	}

	fmt.Printf("gRPC received %d tours\n", len(response.Tours))

	result := make([]TourJSON, 0)

	for _, t := range response.Tours {
		keyPoints := make([]KeyPointJSON, 0)
		if t.FirstKeyPoint != nil {
			keyPoints = append(keyPoints, KeyPointJSON{
				Id:          t.FirstKeyPoint.Id,
				Name:        t.FirstKeyPoint.Name,
				Description: t.FirstKeyPoint.Description,
				Latitude:    t.FirstKeyPoint.Latitude,
				Longitude:   t.FirstKeyPoint.Longitude,
				ImageUrl:    t.FirstKeyPoint.ImageUrl,
				OrderIndex:  t.FirstKeyPoint.OrderIndex,
			})
		}

		durations := make([]DurationJSON, 0)
		for _, d := range t.Durations {
			durations = append(durations, DurationJSON{
				Id:            d.Id,
				TransportType: d.TransportType,
				Minutes:       d.Minutes,
			})
		}

		tags := t.Tags
		if tags == nil {
			tags = []string{}
		}

		result = append(result, TourJSON{
			Id:          t.Id,
			Name:        t.Name,
			Description: t.Description,
			Difficulty:  t.Difficulty,
			Tags:        tags,
			Status:      t.Status,
			Price:       t.Price,
			AuthorId:    t.AuthorId,
			LengthKm:    t.LengthKm,
			PublishedAt: t.PublishedAt,
			KeyPoints:   keyPoints,
			Durations:   durations,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

func main() {
	r := mux.NewRouter()
	r.Use(corsMiddleware)

	r.PathPrefix("/auth/").HandlerFunc(proxyHandler("http://stakeholders-service:8081"))
	r.PathPrefix("/users/").HandlerFunc(proxyHandler("http://stakeholders-service:8081"))
	r.PathPrefix("/users").HandlerFunc(proxyHandler("http://stakeholders-service:8081"))

	r.PathPrefix("/api/v1/blogs").HandlerFunc(proxyHandler("http://blog-service:8082"))

	r.PathPrefix("/follow/").HandlerFunc(proxyHandler("http://follower-service:8083"))
	r.PathPrefix("/feed").HandlerFunc(proxyHandler("http://follower-service:8083"))
	r.PathPrefix("/recommendations").HandlerFunc(proxyHandler("http://follower-service:8083"))
	r.PathPrefix("/following").HandlerFunc(proxyHandler("http://follower-service:8083"))

r.HandleFunc("/api/tours/published", getPublishedToursGRPC).Methods("GET")
	r.PathPrefix("/api/tours").HandlerFunc(proxyHandler("http://tour-service:8084"))
	r.PathPrefix("/api/position").HandlerFunc(proxyHandler("http://tour-service:8084"))

	r.PathPrefix("/api/purchase").HandlerFunc(proxyHandler("http://purchase-service:8085"))

	fmt.Println("API Gateway started on :8080")
	http.ListenAndServe(":8080", r)
}