package main

import (
	"fmt"
	"net/http"
	"net/http/httputil"
	"net/url"

	"github.com/gorilla/mux"
)

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
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
		proxy.ServeHTTP(w, r)
	}
}

func main() {
	r := mux.NewRouter()
	r.Use(corsMiddleware)

	r.PathPrefix("/auth/").HandlerFunc(proxyHandler("http://stakeholders-service:8081"))
	r.PathPrefix("/users/").HandlerFunc(proxyHandler("http://stakeholders-service:8081"))
	r.PathPrefix("/users").HandlerFunc(proxyHandler("http://stakeholders-service:8081"))

	r.PathPrefix("/api/v1/blogs").HandlerFunc(proxyHandler("http://blog-service:8082"))

	fmt.Println("API Gateway started on :8080")
	http.ListenAndServe(":8080", r)
}