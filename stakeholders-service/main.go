package main

import (
	"fmt"
	"net/http"
	"stakeholders-service/db"
	"stakeholders-service/handler"
	"stakeholders-service/middleware"

	"github.com/gorilla/mux"
)

func main() {
	db.Connect()

	r := mux.NewRouter()

	r.HandleFunc("/auth/register", handler.Register).Methods("POST")
	r.HandleFunc("/auth/login", handler.Login).Methods("POST")
	r.HandleFunc("/auth/create-admin", handler.CreateAdmin).Methods("POST")

	api := r.PathPrefix("/").Subrouter()
	api.Use(middleware.JWTMiddleware)
	api.HandleFunc("/users", handler.GetAllUsers).Methods("GET")
	api.HandleFunc("/users/{id}/block", handler.BlockUser).Methods("PUT")
	api.HandleFunc("/users/profile", handler.GetProfile).Methods("GET")
	api.HandleFunc("/users/profile", handler.UpdateProfile).Methods("PUT")

	fmt.Println("Stakeholders service launched at :8081")
	http.ListenAndServe(":8081", r)
}