package main

import "os"

type Config struct {
	Port           string
	Neo4jURL       string
	Neo4jUser      string
	Neo4jPassword  string
	Neo4jDatabase  string
	BlogServiceURL string
}

func loadConfig() Config {
	return Config{
		Port:           env("PORT", "8083"),
		Neo4jURL:       env("NEO4J_URL", "http://localhost:7474"),
		Neo4jUser:      env("NEO4J_USER", "neo4j"),
		Neo4jPassword:  env("NEO4J_PASSWORD", "password123"),
		Neo4jDatabase:  env("NEO4J_DATABASE", "neo4j"),
		BlogServiceURL: env("BLOG_SERVICE_URL", "http://localhost:8082"),
	}
}

func env(key, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}
