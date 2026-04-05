package handler

import (
	"encoding/json"
	"net/http"
	"stakeholders-service/db"
	"stakeholders-service/middleware"
	"stakeholders-service/model"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

func Register(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Username string     `json:"username"`
		Password string     `json:"password"`
		Email    string     `json:"email"`
		Role     model.Role `json:"role"`
	}
	json.NewDecoder(r.Body).Decode(&input)

	if input.Role == model.RoleAdmin {
		http.Error(w, "You cannot register as an admin", http.StatusBadRequest)
		return
	}

	hashed, _ := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	user := model.User{
		Username: input.Username,
		Password: string(hashed),
		Email:    input.Email,
		Role:     input.Role,
	}
	result := db.DB.Create(&user)
	if result.Error != nil {
		http.Error(w, "Registration error", http.StatusBadRequest)
		return
	}
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(user)
}

func Login(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	json.NewDecoder(r.Body).Decode(&input)

	var user model.User
	db.DB.Where("username = ?", input.Username).First(&user)
	if user.ID == 0 {
		http.Error(w, "The user does not exist", http.StatusUnauthorized)
		return
	}
	if user.IsBlocked {
		http.Error(w, "Account blocked", http.StatusForbidden)
		return
	}
	err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password))
	if err != nil {
		http.Error(w, "Wrong password", http.StatusUnauthorized)
		return
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"id":   user.ID,
		"role": user.Role,
		"exp":  time.Now().Add(24 * time.Hour).Unix(),
	})
	tokenStr, _ := token.SignedString(middleware.JwtSecret)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"token": tokenStr})
}


func CreateAdmin(w http.ResponseWriter, r *http.Request) {
    hashed, _ := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
    user := model.User{
        Username: "admin",
        Password: string(hashed),
        Email:    "admin@test.com",
        Role:     model.RoleAdmin,
    }
    db.DB.Create(&user)
    w.WriteHeader(http.StatusCreated)
    json.NewEncoder(w).Encode(map[string]string{"message": "Admin created"})
}