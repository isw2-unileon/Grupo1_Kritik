package handlers

import (
	"bytes"
	"encoding/json"
	"errors"
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

func setupReviewsRouter(db bd.Database, withAuth bool) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	h := NewReviewHandler(db)

	r.GET("/api/products", h.SearchProductHandler)

	protected := r.Group("")
	if withAuth {
		protected.Use(func(c *gin.Context) {
			c.Set("userID", 1)
			c.Next()
		})
	}
	protected.POST("/api/reviews", h.CreateReviewHandler)
	protected.GET("/api/reviews", h.GetUserReviewsHandler)

	return r
}

func TestSearchProductHandler_EmptyQuery(t *testing.T) {
	mock := &bd.MockDatabase{}
	r := setupReviewsRouter(mock, false)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/api/products?q=", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}

	var products []bd.Product
	if err := json.Unmarshal(w.Body.Bytes(), &products); err != nil {
		t.Fatalf("failed to parse: %v", err)
	}
	if len(products) != 0 {
		t.Errorf("expected empty slice, got %d items", len(products))
	}
}

func TestSearchProductHandler_Found(t *testing.T) {
	mock := &bd.MockDatabase{
		MockGetProductByName: func(name string) (*bd.Product, error) {
			return &bd.Product{ID: 1, Name: name}, nil
		},
	}
	r := setupReviewsRouter(mock, false)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/api/products?q=Game", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}

	var product bd.Product
	if err := json.Unmarshal(w.Body.Bytes(), &product); err != nil {
		t.Fatalf("failed to parse: %v", err)
	}
	if product.Name != "Game" {
		t.Errorf("expected product with Name Game, got %+v", product)
	}
}

func TestCreateReviewHandler_Success(t *testing.T) {
	mock := &bd.MockDatabase{
		MockGetUserByID: func(id int) (*bd.User, error) {
			return &bd.User{ID: id, Email: "reviewer@test.com", UserName: "reviewer"}, nil
		},
		MockAddReview: func(r bd.Review) (*bd.Review, error) {
			return &bd.Review{ID: 1, Description: r.Description, Recommended: r.Recommended, ProductID: r.ProductID, UserID: r.UserID}, nil
		},
	}
	r := setupReviewsRouter(mock, true)

	body, _ := json.Marshal(map[string]interface{}{
		"title":       "Great Game",
		"product_id":  5,
		"description": "Really enjoyed it",
		"recommended": true,
	})
	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/api/reviews", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Errorf("expected 201, got %d: %s", w.Code, w.Body.String())
	}
}

func TestCreateReviewHandler_NoUserID(t *testing.T) {
	mock := &bd.MockDatabase{}
	r := setupReviewsRouter(mock, false)

	body, _ := json.Marshal(map[string]interface{}{
		"title":       "No Auth Review",
		"product_id":  1,
		"description": "Should fail",
		"recommended": true,
	})
	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/api/reviews", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d: %s", w.Code, w.Body.String())
	}
}

func TestCreateReviewHandler_InvalidBody(t *testing.T) {
	mock := &bd.MockDatabase{}
	r := setupReviewsRouter(mock, true)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/api/reviews", bytes.NewReader([]byte("not-json")))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d: %s", w.Code, w.Body.String())
	}
}

func TestGetUserReviewsHandler_Success(t *testing.T) {
	mock := &bd.MockDatabase{
		MockGetUserByID: func(id int) (*bd.User, error) {
			return &bd.User{ID: id, Email: "user@test.com", UserName: "user"}, nil
		},
		MockGetReviewsByUserEmail: func(email string) ([]bd.Review, error) {
			return []bd.Review{
				{ID: 1, Description: "Desc1", Recommended: true, ProductID: 1, UserID: 1},
			}, nil
		},
	}
	r := setupReviewsRouter(mock, true)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/api/reviews", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d: %s", w.Code, w.Body.String())
	}

	var reviews []bd.Review
	if err := json.Unmarshal(w.Body.Bytes(), &reviews); err != nil {
		t.Fatalf("failed to parse: %v", err)
	}
	if len(reviews) != 1 || reviews[0].ID != 1 {
		t.Errorf("expected 1 review with id = 1, got %+v", reviews)
	}
}

func TestGetUserReviewsHandler_NoAuth(t *testing.T) {
	mock := &bd.MockDatabase{}
	r := setupReviewsRouter(mock, false)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/api/reviews", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d: %s", w.Code, w.Body.String())
	}
}

func TestCreateReviewHandler_UserLookupFails(t *testing.T) {
	mock := &bd.MockDatabase{
		MockGetUserByID: func(id int) (*bd.User, error) {
			return nil, errors.New("user not found")
		},
	}
	r := setupReviewsRouter(mock, true)

	body, _ := json.Marshal(map[string]interface{}{
		"title":       "Fail Review",
		"product_id":  1,
		"description": "Should fail",
		"recommended": false,
	})
	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/api/reviews", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Errorf("expected 500, got %d: %s", w.Code, w.Body.String())
	}
}
