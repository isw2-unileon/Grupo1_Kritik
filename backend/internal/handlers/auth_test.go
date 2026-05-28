package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/isw2-unileon/GRUPO1_KRITIK/backend/bd"
	"github.com/isw2-unileon/GRUPO1_KRITIK/backend/internal/auth"
)

func init() {
	auth.Initialize("test-secret")
}

func setupAuthRouter(db bd.Database) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	h := NewAuthHandler(db)
	r.POST("/auth/register", h.RegisterHandler)
	r.POST("/auth/login", h.LoginHandler)
	return r
}

func TestRegisterHandler_Success(t *testing.T) {
	mock := &bd.MockDatabase{
		MockGetUserByEmail: func(email string) (*bd.User, error) {
			return nil, nil
		},
		MockGetUserByUserName: func(name string) (*bd.User, error) {
			return nil, nil
		},
		MockAddUser: func(u bd.User) (*bd.User, error) {
			return &bd.User{ID: 1, Email: u.Email, Name: u.Name, Surname: u.Surname, UserName: u.UserName, Password: u.Password}, nil
		},
	}
	r := setupAuthRouter(mock)

	body, _ := json.Marshal(map[string]string{
		"email":    "new@test.com",
		"password": "secure123",
		"name":     "Test",
		"surname":  "User",
		"user_name": "testuser",
	})
	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/auth/register", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Errorf("expected 201, got %d: %s", w.Code, w.Body.String())
	}

	var resp UserResponse
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to parse response: %v", err)
	}
	if resp.Email != "new@test.com" {
		t.Errorf("expected email new@test.com, got %s", resp.Email)
	}
}

func TestRegisterHandler_DuplicateEmail(t *testing.T) {
	mock := &bd.MockDatabase{
		MockGetUserByEmail: func(email string) (*bd.User, error) {
			return &bd.User{ID: 1, Email: email}, nil
		},
	}
	r := setupAuthRouter(mock)

	body, _ := json.Marshal(map[string]string{
		"email":    "dup@test.com",
		"password": "pass",
		"name":     "Dup",
	})
	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/auth/register", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusConflict {
		t.Errorf("expected 409, got %d: %s", w.Code, w.Body.String())
	}
}

func TestRegisterHandler_DuplicateUsername(t *testing.T) {
	mock := &bd.MockDatabase{
		MockGetUserByEmail: func(email string) (*bd.User, error) {
			return nil, nil
		},
		MockGetUserByUserName: func(name string) (*bd.User, error) {
			return &bd.User{ID: 2, UserName: name}, nil
		},
	}
	r := setupAuthRouter(mock)

	body, _ := json.Marshal(map[string]string{
		"email":    "other@test.com",
		"password": "pass",
		"name":     "Other",
		"user_name": "taken",
	})
	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/auth/register", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusConflict {
		t.Errorf("expected 409, got %d: %s", w.Code, w.Body.String())
	}
}

func TestRegisterHandler_MissingFields(t *testing.T) {
	mock := &bd.MockDatabase{}
	r := setupAuthRouter(mock)

	body, _ := json.Marshal(map[string]string{
		"email": "missing@test.com",
	})
	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/auth/register", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d: %s", w.Code, w.Body.String())
	}
}

func TestLoginHandler_Success(t *testing.T) {
	hash, err := bd.HashPassword("secret123")
	if err != nil {
		t.Fatalf("HashPassword failed: %v", err)
	}

	mock := &bd.MockDatabase{
		MockGetUserByEmail: func(email string) (*bd.User, error) {
			return &bd.User{ID: 10, Email: email, Name: "Login", Surname: "User", UserName: "loginuser", Password: hash}, nil
		},
	}
	r := setupAuthRouter(mock)

	body, _ := json.Marshal(map[string]string{
		"email":    "login@test.com",
		"password": "secret123",
	})
	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/auth/login", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d: %s", w.Code, w.Body.String())
	}

	var resp AuthResponse
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to parse response: %v", err)
	}
	if resp.User.ID != 10 {
		t.Errorf("expected user id 10, got %d", resp.User.ID)
	}
	if resp.Token == "" {
		t.Error("expected non-empty token")
	}
}

func TestLoginHandler_WrongPassword(t *testing.T) {
	hash, err := bd.HashPassword("correct-password")
	if err != nil {
		t.Fatalf("HashPassword failed: %v", err)
	}

	mock := &bd.MockDatabase{
		MockGetUserByEmail: func(email string) (*bd.User, error) {
			return &bd.User{ID: 10, Email: email, Password: hash}, nil
		},
	}
	r := setupAuthRouter(mock)

	body, _ := json.Marshal(map[string]string{
		"email":    "login@test.com",
		"password": "wrong-password",
	})
	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/auth/login", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d: %s", w.Code, w.Body.String())
	}
}

func TestLoginHandler_UserNotFound(t *testing.T) {
	mock := &bd.MockDatabase{
		MockGetUserByEmail: func(email string) (*bd.User, error) {
			return nil, nil
		},
	}
	r := setupAuthRouter(mock)

	body, _ := json.Marshal(map[string]string{
		"email":    "nonexistent@test.com",
		"password": "pass",
	})
	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/auth/login", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d: %s", w.Code, w.Body.String())
	}
}

func TestLoginHandler_LoginByUsername(t *testing.T) {
	hash, err := bd.HashPassword("mypass")
	if err != nil {
		t.Fatalf("HashPassword failed: %v", err)
	}

	mock := &bd.MockDatabase{
		MockGetUserByUserName: func(name string) (*bd.User, error) {
			return &bd.User{ID: 20, Email: "byuser@test.com", UserName: name, Password: hash}, nil
		},
	}
	r := setupAuthRouter(mock)

	body, _ := json.Marshal(map[string]string{
		"user_name": "myuser",
		"password":  "mypass",
	})
	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/auth/login", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d: %s", w.Code, w.Body.String())
	}
}
