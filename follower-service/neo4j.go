package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"
)

type Neo4jClient struct {
	endpoint string
	user     string
	password string
	http     *http.Client
}

type cypherStatement struct {
	Statement  string         `json:"statement"`
	Parameters map[string]any `json:"parameters,omitempty"`
}

type cypherRequest struct {
	Statements []cypherStatement `json:"statements"`
}

type cypherResponse struct {
	Results []struct {
		Data []struct {
			Row []any `json:"row"`
		} `json:"data"`
	} `json:"results"`
	Errors []struct {
		Code    string `json:"code"`
		Message string `json:"message"`
	} `json:"errors"`
}

func NewNeo4jClient(cfg Config) *Neo4jClient {
	baseURL := strings.TrimRight(cfg.Neo4jURL, "/")
	return &Neo4jClient{
		endpoint: fmt.Sprintf("%s/db/%s/tx/commit", baseURL, cfg.Neo4jDatabase),
		user:     cfg.Neo4jUser,
		password: cfg.Neo4jPassword,
		http:     &http.Client{Timeout: 30 * time.Second},
	}
}

func (c *Neo4jClient) Exec(statement string, params map[string]any) error {
	_, err := c.Query(statement, params)
	return err
}

func (c *Neo4jClient) Query(statement string, params map[string]any) ([][]any, error) {
	body, err := json.Marshal(cypherRequest{
		Statements: []cypherStatement{{
			Statement:  statement,
			Parameters: params,
		}},
	})
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest(http.MethodPost, c.endpoint, bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.SetBasicAuth(c.user, c.password)

	resp, err := c.http.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var cypherResp cypherResponse
	if err := json.NewDecoder(resp.Body).Decode(&cypherResp); err != nil {
		return nil, err
	}
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("neo4j returned status %d", resp.StatusCode)
	}
	if len(cypherResp.Errors) > 0 {
		return nil, fmt.Errorf("neo4j error %s: %s", cypherResp.Errors[0].Code, cypherResp.Errors[0].Message)
	}
	if len(cypherResp.Results) == 0 {
		return [][]any{}, nil
	}

	rows := make([][]any, 0, len(cypherResp.Results[0].Data))
	for _, item := range cypherResp.Results[0].Data {
		rows = append(rows, item.Row)
	}
	return rows, nil
}
