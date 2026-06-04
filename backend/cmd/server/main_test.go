package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/isw2-unileon/GRUPO1_KRITIK/backend/bd"
)

func init() {
	gin.SetMode(gin.TestMode)
}

func TestNewRouter_HasAllRoutes(t *testing.T) {
	mock := &bd.MockDatabase{}
	r := newRouter(mock)

	routes := []struct {
		method string
		path   string
	}{
		{"GET", "/health"},
		{"GET", "/api/hello"},
		{"POST", "/auth/register"},
		{"POST", "/auth/login"},
		{"POST", "/api/reviews"},
		{"GET", "/api/reviews"},
		{"GET", "/api/products"},
		{"GET", "/api/fans"},
		{"GET", "/api/influencers"},
		{"POST", "/api/follow"},
	}

	for _, rt := range routes {
		req := httptest.NewRequest(rt.method, rt.path, nil)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)
		if w.Code == http.StatusNotFound {
			t.Errorf("route %s %s not registered (got 404)", rt.method, rt.path)
		}
	}
}

func TestNewRouter_HealthEndpoint(t *testing.T) {
	mock := &bd.MockDatabase{}
	r := newRouter(mock)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/health", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}

	var body map[string]string
	if err := json.NewDecoder(w.Body).Decode(&body); err != nil {
		t.Fatalf("failed to parse: %v", err)
	}
	if body["status"] != "ok" {
		t.Errorf(`expected status="ok", got %v`, body)
	}
}
