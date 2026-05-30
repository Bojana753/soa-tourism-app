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

func getPublishedToursGRPC(w http.ResponseWriter, r *http.Request) {
	conn, err := grpc.Dial(
		"tour-service:9090",
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		grpc.WithTimeout(5*time.Second),
	)
	if err != nil {
		http.Error(w, "Failed to connect to tour-service via gRPC: "+err.Error(), http.StatusServiceUnavailable)
		return
	}
	defer conn.Close()

	client := tourgrpc.NewTourServiceClient(conn)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	response, err := client.GetPublishedTours(ctx, &tourgrpc.Empty{})
	if err != nil {
		http.Error(w, "gRPC call failed: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response.Tours)
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