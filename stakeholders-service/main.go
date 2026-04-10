package main

import (
	"fmt"
	"net/http"
	"stakeholders-service/db"
	"stakeholders-service/handler"
	"stakeholders-service/middleware"

	"github.com/gorilla/mux"
)

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func main() {
	db.Connect()

	r := mux.NewRouter()
	r.Use(corsMiddleware)

	r.HandleFunc("/auth/register", handler.Register).Methods("POST", "OPTIONS")
	r.HandleFunc("/auth/login", handler.Login).Methods("POST", "OPTIONS")

	api := r.PathPrefix("/").Subrouter()
	api.Use(middleware.JWTMiddleware)
	api.HandleFunc("/users", handler.GetAllUsers).Methods("GET", "OPTIONS")
	api.HandleFunc("/users/{id}/block", handler.BlockUser).Methods("PUT", "OPTIONS")
	api.HandleFunc("/users/profile", handler.GetProfile).Methods("GET", "OPTIONS")
	api.HandleFunc("/users/profile", handler.UpdateProfile).Methods("PUT", "OPTIONS")

fmt.Println("Stakeholders service started on :8081")
	http.ListenAndServe(":8081", r)
}