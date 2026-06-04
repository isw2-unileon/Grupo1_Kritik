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
	protected.POST("/api/follow", h.FollowSomeoneHandler)
	protected.POST("/api/unfollow", h.UnfollowSomeoneHandler)
	protected.GET("/api/fans", h.GetAllFansHandler)
	protected.GET("/api/influencers", h.GetAllInfluencersHandler)

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
		MockGetProductsByName: func(name string) ([]bd.Product, error) {
			return []bd.Product{
				{
					ID:   1,
					Name: name,
				},
			}, nil
		},
	}
	r := setupReviewsRouter(mock, false)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/api/products?q=Game", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}

	var products []bd.Product
	if err := json.Unmarshal(w.Body.Bytes(), &products); err != nil {
		t.Fatalf("failed to parse: %v", err)
	}

	if len(products) == 0 {
		t.Fatalf("expected at least one product, got 0")
	}

	if products[0].Name != "Game" {
		t.Errorf("expected product with Name Game, got %+v", products[0])
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
		MockGetReviewsByUserID: func(id int) ([]bd.Review, error) {
			return []bd.Review{
				{ID: id, Description: "Desc1", Recommended: true, ProductID: 1, UserID: 1},
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

func TestFollowSomeoneHandler_Success(t *testing.T) {
	mock := &bd.MockDatabase{
		MockGetUserByID: func(id int) (*bd.User, error) {
			return &bd.User{ID: id, Email: "fan@test.com", UserName: "fan"}, nil
		},
		MockFollowSomeone: func(r bd.FollowerRelation) (*bd.FollowerRelation, error) {
			return &bd.FollowerRelation{ID: 1, Fan: r.Fan, Influencer: r.Influencer}, nil
		},
	}
	r := setupReviewsRouter(mock, true)

	body, _ := json.Marshal(map[string]interface{}{
		"influencer_id": 2,
	})
	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/api/follow", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Errorf("expected 201, got %d: %s", w.Code, w.Body.String())
	}

	var relation bd.FollowerRelation
	if err := json.Unmarshal(w.Body.Bytes(), &relation); err != nil {
		t.Fatalf("failed to parse: %v", err)
	}
	if relation.ID != 1 || relation.Fan != 1 || relation.Influencer != 2 {
		t.Errorf("unexpected relation: %+v", relation)
	}
}

func TestFollowSomeoneHandler_NoAuth(t *testing.T) {
	mock := &bd.MockDatabase{}
	r := setupReviewsRouter(mock, false)

	body, _ := json.Marshal(map[string]interface{}{
		"influencer_id": 2,
	})
	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/api/follow", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d: %s", w.Code, w.Body.String())
	}
}

func TestFollowSomeoneHandler_InvalidBody(t *testing.T) {
	mock := &bd.MockDatabase{}
	r := setupReviewsRouter(mock, true)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/api/follow", bytes.NewReader([]byte("not-json")))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d: %s", w.Code, w.Body.String())
	}
}

func TestFollowSomeoneHandler_DBError(t *testing.T) {
	mock := &bd.MockDatabase{
		MockGetUserByID: func(id int) (*bd.User, error) {
			return &bd.User{ID: id, Email: "fan@test.com", UserName: "fan"}, nil
		},
		MockFollowSomeone: func(r bd.FollowerRelation) (*bd.FollowerRelation, error) {
			return nil, errors.New("db error")
		},
	}
	r := setupReviewsRouter(mock, true)

	body, _ := json.Marshal(map[string]interface{}{
		"influencer_id": 2,
	})
	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/api/follow", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Errorf("expected 500, got %d: %s", w.Code, w.Body.String())
	}
}

func TestFollowSomeoneHandler_MissingField(t *testing.T) {
	mock := &bd.MockDatabase{}
	r := setupReviewsRouter(mock, true)

	body, _ := json.Marshal(map[string]interface{}{})
	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/api/follow", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d: %s", w.Code, w.Body.String())
	}
}

func TestUnfollowSomeoneHandler_Success(t *testing.T) {
	mock := &bd.MockDatabase{
		MockUnfollowSomeone: func(fanID, influencerID int) (bool, error) {
			return true, nil
		},
	}
	r := setupReviewsRouter(mock, true)

	body, _ := json.Marshal(map[string]interface{}{
		"influencer_id": 2,
	})
	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/api/unfollow", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d: %s", w.Code, w.Body.String())
	}
}

func TestUnfollowSomeoneHandler_NoAuth(t *testing.T) {
	mock := &bd.MockDatabase{}
	r := setupReviewsRouter(mock, false)

	body, _ := json.Marshal(map[string]interface{}{
		"influencer_id": 2,
	})
	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/api/unfollow", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d: %s", w.Code, w.Body.String())
	}
}

func TestUnfollowSomeoneHandler_InvalidBody(t *testing.T) {
	mock := &bd.MockDatabase{}
	r := setupReviewsRouter(mock, true)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/api/unfollow", bytes.NewReader([]byte("not-json")))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d: %s", w.Code, w.Body.String())
	}
}

func TestUnfollowSomeoneHandler_DBError(t *testing.T) {
	mock := &bd.MockDatabase{
		MockUnfollowSomeone: func(fanID, influencerID int) (bool, error) {
			return false, errors.New("db error")
		},
	}
	r := setupReviewsRouter(mock, true)

	body, _ := json.Marshal(map[string]interface{}{
		"influencer_id": 2,
	})
	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/api/unfollow", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Errorf("expected 500, got %d: %s", w.Code, w.Body.String())
	}
}

func TestUnfollowSomeoneHandler_MissingField(t *testing.T) {
	mock := &bd.MockDatabase{}
	r := setupReviewsRouter(mock, true)

	body, _ := json.Marshal(map[string]interface{}{})
	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/api/unfollow", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d: %s", w.Code, w.Body.String())
	}
}

func TestGetAllFansHandler_Success(t *testing.T) {
	mock := &bd.MockDatabase{
		MockGetAllFans: func(influencerID int) ([]bd.User, error) {
			return []bd.User{
				{ID: 2, Name: "fan1", Email: "fan1@test.com"},
				{ID: 3, Name: "fan2", Email: "fan2@test.com"},
			}, nil
		},
	}
	r := setupReviewsRouter(mock, true)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/api/fans", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d: %s", w.Code, w.Body.String())
	}

	var fans []bd.User
	if err := json.Unmarshal(w.Body.Bytes(), &fans); err != nil {
		t.Fatalf("failed to parse: %v", err)
	}
	if len(fans) != 2 {
		t.Errorf("expected 2 fans, got %d", len(fans))
	}
	if fans[0].Name != "fan1" {
		t.Errorf("expected fan name 'fan1', got '%s'", fans[0].Name)
	}
}

func TestGetAllFansHandler_NoAuth(t *testing.T) {
	mock := &bd.MockDatabase{}
	r := setupReviewsRouter(mock, false)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/api/fans", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d: %s", w.Code, w.Body.String())
	}
}

func TestGetAllFansHandler_DBError(t *testing.T) {
	mock := &bd.MockDatabase{
		MockGetAllFans: func(influencerID int) ([]bd.User, error) {
			return nil, errors.New("db error")
		},
	}
	r := setupReviewsRouter(mock, true)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/api/fans", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Errorf("expected 500, got %d: %s", w.Code, w.Body.String())
	}
}

func TestGetAllInfluencersHandler_Success(t *testing.T) {
	mock := &bd.MockDatabase{
		MockGetAllInfluencers: func(fanID int) ([]bd.User, error) {
			return []bd.User{
				{ID: 5, Name: "inf1", Email: "inf1@test.com"},
			}, nil
		},
	}
	r := setupReviewsRouter(mock, true)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/api/influencers", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d: %s", w.Code, w.Body.String())
	}

	var influencers []bd.User
	if err := json.Unmarshal(w.Body.Bytes(), &influencers); err != nil {
		t.Fatalf("failed to parse: %v", err)
	}
	if len(influencers) != 1 {
		t.Errorf("expected 1 influencer, got %d", len(influencers))
	}
	if influencers[0].Name != "inf1" {
		t.Errorf("expected influencer name 'inf1', got '%s'", influencers[0].Name)
	}
}

func TestGetAllInfluencersHandler_NoAuth(t *testing.T) {
	mock := &bd.MockDatabase{}
	r := setupReviewsRouter(mock, false)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/api/influencers", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d: %s", w.Code, w.Body.String())
	}
}

func TestGetAllInfluencersHandler_DBError(t *testing.T) {
	mock := &bd.MockDatabase{
		MockGetAllInfluencers: func(fanID int) ([]bd.User, error) {
			return nil, errors.New("db error")
		},
	}
	r := setupReviewsRouter(mock, true)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/api/influencers", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Errorf("expected 500, got %d: %s", w.Code, w.Body.String())
	}
}
