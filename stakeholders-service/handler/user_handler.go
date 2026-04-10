package handler

import (
	"encoding/json"
	"net/http"
	"stakeholders-service/db"
	"stakeholders-service/middleware"
	"stakeholders-service/model"

	"github.com/gorilla/mux"
)

func GetAllUsers(w http.ResponseWriter, r *http.Request) {
	role := r.Context().Value(middleware.UserRoleKey)
	if role != string(model.RoleAdmin) {
		http.Error(w, "Admins only", http.StatusForbidden)
		return
	}
	var users []model.User
	db.DB.Find(&users)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(users)
}

func BlockUser(w http.ResponseWriter, r *http.Request) {
	role := r.Context().Value(middleware.UserRoleKey)
	if role != string(model.RoleAdmin) {
		http.Error(w, "Just admin", http.StatusForbidden)
		return
	}
	id := mux.Vars(r)["id"]
	db.DB.Model(&model.User{}).Where("id = ?", id).Update("is_blocked", true)
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "User blocked"})
}

func GetProfile(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey)
	var user model.User
	db.DB.First(&user, userID)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

func UpdateProfile(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey)
	var input struct {
		FirstName string `json:"firstName"`
		LastName  string `json:"lastName"`
		Bio       string `json:"bio"`
		Motto     string `json:"motto"`
		ImageURL  string `json:"imageUrl"`
	}
	json.NewDecoder(r.Body).Decode(&input)
	db.DB.Model(&model.User{}).Where("id = ?", userID).Updates(input)
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Profile updated"})
}