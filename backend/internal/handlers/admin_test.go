package handlers

import (
	"bytes"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"mime/multipart"

	"github.com/gin-gonic/gin"
	"github.com/isw2-unileon/GRUPO1_KRITIK/backend/bd"
)

func setupAdminRouter(db bd.Database, isAdmin bool) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	h := NewAdminHandler(db)

	// Simula RequireAuth: mete userID y isAdmin en el contexto
	protected := r.Group("")
	protected.Use(func(c *gin.Context) {
		c.Set("userID", 1)
		c.Set("isAdmin", isAdmin)
		c.Next()
	})
	protected.GET("/api/products/top", h.TopRatedHandler)
	protected.GET("/api/products/worst", h.WorstRatedHandler)

	// Simula RequireAdmin
	admin := r.Group("")
	admin.Use(func(c *gin.Context) {
		c.Set("userID", 1)
		c.Set("isAdmin", isAdmin)
		if !isAdmin {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "admin access required"})
			return
		}
		c.Next()
	})
	admin.GET("/api/admin/products", h.ListProductsHandler)
	admin.GET("/api/admin/products/:id", h.GetProductHandler)
	admin.POST("/api/admin/products", h.CreateProductHandler)
	admin.PUT("/api/admin/products/:id", h.UpdateProductHandler)
	admin.DELETE("/api/admin/products/:id", h.DeleteProductHandler)
	admin.POST("/api/admin/products/:id/image", h.UploadProductImageHandler)
	admin.DELETE("/api/admin/products/:id/image", h.DeleteProductImageHandler)

	return r
}

func TestTopRatedHandler_Success(t *testing.T) {
	mock := &bd.MockDatabase{
		MockGetTopRated: func(limit int) ([]bd.Product, error) {
			return []bd.Product{
				{ID: 1, Name: "Top1", AverageGrade: 95},
				{ID: 2, Name: "Top2", AverageGrade: 90},
			}, nil
		},
	}
	r := setupAdminRouter(mock, false)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/api/products/top", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}

	var products []bd.Product
	if err := json.Unmarshal(w.Body.Bytes(), &products); err != nil {
		t.Fatalf("failed to parse: %v", err)
	}
	if len(products) != 2 {
		t.Errorf("expected 2 products, got %d", len(products))
	}
	if products[0].Name != "Top1" {
		t.Errorf("expected Top1, got %s", products[0].Name)
	}
}

func TestTopRatedHandler_DBError(t *testing.T) {
	mock := &bd.MockDatabase{
		MockGetTopRated: func(limit int) ([]bd.Product, error) {
			return nil, errors.New("db error")
		},
	}
	r := setupAdminRouter(mock, false)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/api/products/top", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Errorf("expected 500, got %d", w.Code)
	}
}

func TestWorstRatedHandler_Success(t *testing.T) {
	mock := &bd.MockDatabase{
		MockGetWorstRated: func(limit int) ([]bd.Product, error) {
			return []bd.Product{
				{ID: 1, Name: "Worst1", AverageGrade: 20},
			}, nil
		},
	}
	r := setupAdminRouter(mock, false)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/api/products/worst", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}
}

func TestListProductsHandler_Success(t *testing.T) {
	mock := &bd.MockDatabase{
		MockGetAllProducts: func() ([]bd.Product, error) {
			return []bd.Product{
				{ID: 1, Name: "A", Type: "game"},
				{ID: 2, Name: "B", Type: "film"},
			}, nil
		},
	}
	r := setupAdminRouter(mock, true)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/api/admin/products", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}

	var resp map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to parse: %v", err)
	}
	if resp["page"] != float64(1) {
		t.Errorf("expected page 1, got %v", resp["page"])
	}
}

func TestListProductsHandler_NotAdmin(t *testing.T) {
	mock := &bd.MockDatabase{}
	r := setupAdminRouter(mock, false)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/api/admin/products", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusForbidden {
		t.Errorf("expected 403, got %d", w.Code)
	}
}

func TestGetProductHandler_Success(t *testing.T) {
	mock := &bd.MockDatabase{
		MockGetProductByID: func(id int) (*bd.Product, error) {
			return &bd.Product{ID: id, Name: "Found"}, nil
		},
	}
	r := setupAdminRouter(mock, true)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/api/admin/products/1", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}

	var p bd.Product
	if err := json.Unmarshal(w.Body.Bytes(), &p); err != nil {
		t.Fatalf("failed to parse: %v", err)
	}
	if p.Name != "Found" {
		t.Errorf("expected Found, got %s", p.Name)
	}
}

func TestGetProductHandler_NotFound(t *testing.T) {
	mock := &bd.MockDatabase{
		MockGetProductByID: func(id int) (*bd.Product, error) {
			return nil, errors.New("not found")
		},
	}
	r := setupAdminRouter(mock, true)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/api/admin/products/999", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("expected 404, got %d", w.Code)
	}
}

func TestCreateProductHandler_Success(t *testing.T) {
	mock := &bd.MockDatabase{
		MockAddProduct: func(p bd.Product) (*bd.Product, error) {
			return &bd.Product{ID: 1, Name: p.Name, Type: p.Type}, nil
		},
	}
	r := setupAdminRouter(mock, true)

	body, _ := json.Marshal(map[string]interface{}{
		"name": "NewProduct",
		"type": "game",
	})
	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/api/admin/products", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Errorf("expected 201, got %d", w.Code)
	}

	var p bd.Product
	if err := json.Unmarshal(w.Body.Bytes(), &p); err != nil {
		t.Fatalf("failed to parse: %v", err)
	}
	if p.Name != "NewProduct" {
		t.Errorf("expected NewProduct, got %s", p.Name)
	}
	if p.ID != 1 {
		t.Errorf("expected ID 1, got %d", p.ID)
	}
}

func TestCreateProductHandler_InvalidBody(t *testing.T) {
	mock := &bd.MockDatabase{}
	r := setupAdminRouter(mock, true)

	body, _ := json.Marshal(map[string]interface{}{
		"name": "",
		"type": "",
	})
	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/api/admin/products", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestUpdateProductHandler_Success(t *testing.T) {
	mock := &bd.MockDatabase{
		MockGetProductByID: func(id int) (*bd.Product, error) {
			return &bd.Product{ID: id, Name: "Old", Type: "game"}, nil
		},
		MockUpdateProductByID: func(id int, info bd.Product) (*bd.Product, error) {
			return &bd.Product{ID: id, Name: info.Name, Type: info.Type}, nil
		},
	}
	r := setupAdminRouter(mock, true)

	body, _ := json.Marshal(map[string]interface{}{
		"name": "Updated",
	})
	w := httptest.NewRecorder()
	req := httptest.NewRequest("PUT", "/api/admin/products/1", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}

	var p bd.Product
	if err := json.Unmarshal(w.Body.Bytes(), &p); err != nil {
		t.Fatalf("failed to parse: %v", err)
	}
	if p.Name != "Updated" {
		t.Errorf("expected Updated, got %s", p.Name)
	}
}

func TestUpdateProductHandler_NotFound(t *testing.T) {
	mock := &bd.MockDatabase{
		MockGetProductByID: func(id int) (*bd.Product, error) {
			return nil, errors.New("not found")
		},
	}
	r := setupAdminRouter(mock, true)

	body, _ := json.Marshal(map[string]interface{}{
		"name": "Nope",
	})
	w := httptest.NewRecorder()
	req := httptest.NewRequest("PUT", "/api/admin/products/999", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("expected 404, got %d", w.Code)
	}
}

func TestDeleteProductHandler_Success(t *testing.T) {
	mock := &bd.MockDatabase{
		MockDeleteProductByID: func(id int) (bool, error) {
			return true, nil
		},
	}
	r := setupAdminRouter(mock, true)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("DELETE", "/api/admin/products/1", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}
}

func TestDeleteProductHandler_NotFound(t *testing.T) {
	mock := &bd.MockDatabase{
		MockDeleteProductByID: func(id int) (bool, error) {
			return false, errors.New("not found")
		},
	}
	r := setupAdminRouter(mock, true)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("DELETE", "/api/admin/products/999", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Errorf("expected 500, got %d", w.Code)
	}
}

func TestUploadProductImageHandler_Success(t *testing.T) {
	mock := &bd.MockDatabase{
		MockGetProductByID: func(id int) (*bd.Product, error) {
			return &bd.Product{ID: id, Name: "Test", Image: ""}, nil
		},
		MockUploadProductImage: func(id int, data []byte, ext, ct string) (string, error) {
			return "https://example.com/products/test.jpg", nil
		},
	}
	r := setupAdminRouter(mock, true)

	var buf bytes.Buffer
	mw := multipart.NewWriter(&buf)
	fw, err := mw.CreateFormFile("image", "test.jpg")
	if err != nil {
		t.Fatal(err)
	}
	if _, err := fw.Write([]byte("fake image")); err != nil {
		t.Fatal(err)
	}
	mw.Close()

	req := httptest.NewRequest("POST", "/api/admin/products/1/image", &buf)
	req.Header.Set("Content-Type", mw.FormDataContentType())
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}

	var resp map[string]string
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to parse: %v", err)
	}
	if resp["image"] != "https://example.com/products/test.jpg" {
		t.Errorf("expected image URL, got %s", resp["image"])
	}
}

func TestUploadProductImageHandler_InvalidID(t *testing.T) {
	mock := &bd.MockDatabase{}
	r := setupAdminRouter(mock, true)

	var buf bytes.Buffer
	mw := multipart.NewWriter(&buf)
	fw, err := mw.CreateFormFile("image", "test.jpg")
	if err != nil {
		t.Fatal(err)
	}
	if _, err := fw.Write([]byte("data")); err != nil {
		t.Fatal(err)
	}
	mw.Close()

	req := httptest.NewRequest("POST", "/api/admin/products/abc/image", &buf)
	req.Header.Set("Content-Type", mw.FormDataContentType())
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestUploadProductImageHandler_NoFile(t *testing.T) {
	mock := &bd.MockDatabase{}
	r := setupAdminRouter(mock, true)

	req := httptest.NewRequest("POST", "/api/admin/products/1/image", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestUploadProductImageHandler_DBError(t *testing.T) {
	mock := &bd.MockDatabase{
		MockGetProductByID: func(id int) (*bd.Product, error) {
			return &bd.Product{ID: id, Name: "Test"}, nil
		},
		MockUploadProductImage: func(id int, data []byte, ext, ct string) (string, error) {
			return "", errors.New("upload failed")
		},
	}
	r := setupAdminRouter(mock, true)

	var buf bytes.Buffer
	mw := multipart.NewWriter(&buf)
	fw, err := mw.CreateFormFile("image", "test.png")
	if err != nil {
		t.Fatal(err)
	}
	if _, err := fw.Write([]byte("data")); err != nil {
		t.Fatal(err)
	}
	mw.Close()

	req := httptest.NewRequest("POST", "/api/admin/products/1/image", &buf)
	req.Header.Set("Content-Type", mw.FormDataContentType())
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Errorf("expected 500, got %d", w.Code)
	}
}

func TestDeleteProductImageHandler_Success(t *testing.T) {
	mock := &bd.MockDatabase{
		MockDeleteProductImage: func(id int) error {
			return nil
		},
	}
	r := setupAdminRouter(mock, true)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("DELETE", "/api/admin/products/1/image", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}

	var resp map[string]string
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to parse: %v", err)
	}
	if resp["image"] != "" {
		t.Errorf("expected empty image, got %s", resp["image"])
	}
}

func TestDeleteProductImageHandler_InvalidID(t *testing.T) {
	mock := &bd.MockDatabase{}
	r := setupAdminRouter(mock, true)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("DELETE", "/api/admin/products/abc/image", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestDeleteProductImageHandler_DBError(t *testing.T) {
	mock := &bd.MockDatabase{
		MockDeleteProductImage: func(id int) error {
			return errors.New("delete failed")
		},
	}
	r := setupAdminRouter(mock, true)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("DELETE", "/api/admin/products/1/image", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Errorf("expected 500, got %d", w.Code)
	}
}
