package main

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"
)

type Server struct {
	cfg   Config
	neo4j *Neo4jClient
	http  *http.Client
}

type recommendation struct {
	UserID            string `json:"userId"`
	MutualFollowed   int    `json:"mutualFollowedCount"`
	RecommendationBy string `json:"recommendationBy"`
}

func main() {
	cfg := loadConfig()
	server := &Server{
		cfg:   cfg,
		neo4j: NewNeo4jClient(cfg),
		http:  &http.Client{Timeout: 30 * time.Second},
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/health", server.health)
	mux.HandleFunc("/follow/", server.follow)
	mux.HandleFunc("/feed", server.feed)
	mux.HandleFunc("/recommendations", server.recommendations)

	handler := cors(mux)
	log.Printf("Follower service started on :%s", cfg.Port)
	log.Fatal(http.ListenAndServe(":"+cfg.Port, handler))
}

func (s *Server) health(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (s *Server) follow(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	currentUserID, ok := currentUser(r)
	if !ok {
		http.Error(w, "Missing X-User-Id header or Bearer token", http.StatusUnauthorized)
		return
	}

	targetID := strings.TrimPrefix(r.URL.Path, "/follow/")
	targetID = strings.TrimSpace(targetID)
	if targetID == "" {
		http.Error(w, "Missing target user id", http.StatusBadRequest)
		return
	}
	if currentUserID == targetID {
		http.Error(w, "Users cannot follow themselves", http.StatusBadRequest)
		return
	}

	err := s.neo4j.Exec(`
		MERGE (me:User {id: $userId})
		MERGE (target:User {id: $targetId})
		MERGE (me)-[:FOLLOWS]->(target)
	`, map[string]any{
		"userId":   currentUserID,
		"targetId": targetID,
	})
	if err != nil {
		log.Printf("follow failed: %v", err)
		http.Error(w, "Could not follow user", http.StatusBadGateway)
		return
	}

	writeJSON(w, http.StatusCreated, map[string]string{
		"userId":   currentUserID,
		"targetId": targetID,
		"status":   "following",
	})
}

func (s *Server) feed(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	currentUserID, ok := currentUser(r)
	if !ok {
		http.Error(w, "Missing X-User-Id header or Bearer token", http.StatusUnauthorized)
		return
	}

	followedIDs, err := s.followedUserIDs(currentUserID)
	if err != nil {
		log.Printf("feed follow lookup failed: %v", err)
		http.Error(w, "Could not load followed users", http.StatusBadGateway)
		return
	}
	if len(followedIDs) == 0 {
		writeJSON(w, http.StatusOK, []any{})
		return
	}

	blogs, err := s.loadBlogsByAuthors(followedIDs, r.URL.Query())
	if err != nil {
		log.Printf("feed blog lookup failed: %v", err)
		http.Error(w, "Could not load feed", http.StatusBadGateway)
		return
	}
	writeJSON(w, http.StatusOK, blogs)
}

func (s *Server) recommendations(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	currentUserID, ok := currentUser(r)
	if !ok {
		http.Error(w, "Missing X-User-Id header or Bearer token", http.StatusUnauthorized)
		return
	}

	rows, err := s.neo4j.Query(`
		MATCH (me:User {id: $userId})-[:FOLLOWS]->(followed:User)<-[:FOLLOWS]-(candidate:User)
		WHERE candidate.id <> $userId AND NOT (me)-[:FOLLOWS]->(candidate)
		RETURN candidate.id AS userId, count(followed) AS mutualFollowedCount
		ORDER BY mutualFollowedCount DESC, userId ASC
	`, map[string]any{"userId": currentUserID})
	if err != nil {
		log.Printf("recommendations failed: %v", err)
		http.Error(w, "Could not load recommendations", http.StatusBadGateway)
		return
	}

	result := make([]recommendation, 0, len(rows))
	for _, row := range rows {
		if len(row) < 2 {
			continue
		}
		result = append(result, recommendation{
			UserID:            asString(row[0]),
			MutualFollowed:   asInt(row[1]),
			RecommendationBy: "shared-followed-users",
		})
	}
	writeJSON(w, http.StatusOK, result)
}

func (s *Server) followedUserIDs(userID string) ([]string, error) {
	rows, err := s.neo4j.Query(`
		MATCH (:User {id: $userId})-[:FOLLOWS]->(followed:User)
		RETURN followed.id AS userId
		ORDER BY userId ASC
	`, map[string]any{"userId": userID})
	if err != nil {
		return nil, err
	}

	ids := make([]string, 0, len(rows))
	for _, row := range rows {
		if len(row) > 0 {
			ids = append(ids, asString(row[0]))
		}
	}
	return ids, nil
}

func (s *Server) loadBlogsByAuthors(authorIDs []string, query url.Values) (any, error) {
	blogURL, err := url.Parse(strings.TrimRight(s.cfg.BlogServiceURL, "/") + "/api/v1/blogs/by-authors")
	if err != nil {
		return nil, err
	}

	params := blogURL.Query()
	params.Set("authorIds", strings.Join(authorIDs, ","))
	if page := query.Get("page"); page != "" {
		params.Set("page", page)
	}
	if size := query.Get("size"); size != "" {
		params.Set("size", size)
	}
	blogURL.RawQuery = params.Encode()

	resp, err := s.http.Get(blogURL.String())
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("blog service returned status %d", resp.StatusCode)
	}

	var payload any
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		return nil, err
	}
	if page, ok := payload.(map[string]any); ok {
		if content, ok := page["content"]; ok {
			return content, nil
		}
	}
	return payload, nil
}

func currentUser(r *http.Request) (string, bool) {
	userID := strings.TrimSpace(r.Header.Get("X-User-Id"))
	if userID != "" {
		return userID, true
	}

	authHeader := r.Header.Get("Authorization")
	if !strings.HasPrefix(authHeader, "Bearer ") {
		return "", false
	}
	return userIDFromJWT(strings.TrimPrefix(authHeader, "Bearer "))
}

func userIDFromJWT(token string) (string, bool) {
	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return "", false
	}

	secret := env("JWT_SECRET", "super-secret-key-123")
	mac := hmac.New(sha256.New, []byte(secret))
	_, _ = mac.Write([]byte(parts[0] + "." + parts[1]))
	expectedSignature := mac.Sum(nil)

	signature, err := base64.RawURLEncoding.DecodeString(parts[2])
	if err != nil || !hmac.Equal(signature, expectedSignature) {
		return "", false
	}

	payload, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return "", false
	}

	var claims struct {
		ID any `json:"id"`
	}
	if err := json.Unmarshal(payload, &claims); err != nil {
		return "", false
	}

	switch id := claims.ID.(type) {
	case string:
		return id, id != ""
	case float64:
		return strconv.FormatInt(int64(id), 10), true
	default:
		return "", false
	}
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func asString(value any) string {
	if s, ok := value.(string); ok {
		return s
	}
	return fmt.Sprint(value)
}

func asInt(value any) int {
	switch v := value.(type) {
	case int:
		return v
	case int64:
		return int(v)
	case float64:
		return int(v)
	default:
		return 0
	}
}

func cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-User-Id")
		next.ServeHTTP(w, r)
	})
}
