package handlers

import (
	"fmt"
	"log/slog"
	"mime"
	"net/http"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/isw2-unileon/GRUPO1_KRITIK/backend/bd"
)

var allowedProductImageExts = map[string]string{
	".jpg":  "image/jpeg",
	".jpeg": "image/jpeg",
	".png":  "image/png",
	".webp": "image/webp",
	".gif":  "image/gif",
}

const maxProductImageSize = 5 << 20 // 5 MB

// CreateProductRequest is the payload for creating a product.
type CreateProductRequest struct {
	Name        string   `json:"name" binding:"required"`
	Type        string   `json:"type" binding:"required"`
	Description string   `json:"description"`
	Release     string   `json:"release"`
	Genre       []string `json:"genre"`
	Image       string   `json:"image"`
}

// UpdateProductRequest is the payload for updating a product.
type UpdateProductRequest struct {
	Name        *string   `json:"name,omitempty"`
	Type        *string   `json:"type,omitempty"`
	Description *string   `json:"description,omitempty"`
	Genre       *[]string `json:"genre,omitempty"`
	Image       *string   `json:"image,omitempty"`
}

// AdminHandler struct
type AdminHandler struct {
	DB bd.Database
}

// NewAdminHandler initialices the admin handler
func NewAdminHandler(db bd.Database) *AdminHandler {
	return &AdminHandler{DB: db}
}

// ListProductsHandler returns all products (admin only).
// Supports optional query params: type, page, limit.
func (h *AdminHandler) ListProductsHandler(c *gin.Context) {
	products, err := h.DB.GetAllProducts()
	if err != nil {
		slog.Error("admin list products: query failed", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load products"})
		return
	}

	// Filter by type if provided
	typeFilter := strings.TrimSpace(c.Query("type"))
	if typeFilter != "" {
		var filtered []bd.Product
		for _, p := range products {
			if strings.EqualFold(p.Type, typeFilter) {
				filtered = append(filtered, p)
			}
		}
		products = filtered
	}

	// Pagination
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 50
	}
	start := (page - 1) * limit
	if start >= len(products) {
		products = []bd.Product{}
	} else {
		end := start + limit
		if end > len(products) {
			end = len(products)
		}
		products = products[start:end]
	}

	c.JSON(http.StatusOK, gin.H{
		"products": products,
		"page":     page,
		"limit":    limit,
	})
}

// GetProductHandler returns a single product by ID (admin only).
func (h *AdminHandler) GetProductHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid product id"})
		return
	}

	product, err := h.DB.GetProductByID(id)
	if err != nil {
		slog.Warn("admin get product: not found", "id", id, "error", err)
		c.JSON(http.StatusNotFound, gin.H{"error": "product not found"})
		return
	}

	c.JSON(http.StatusOK, product)
}

// CreateProductHandler creates a new product (admin only).
func (h *AdminHandler) CreateProductHandler(c *gin.Context) {
	var req CreateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		slog.Warn("admin create product: invalid body", "error", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	req.Name = strings.TrimSpace(req.Name)
	req.Type = strings.TrimSpace(req.Type)

	if req.Name == "" || req.Type == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "name and type are required"})
		return
	}

	product := bd.Product{
		Name:        req.Name,
		Type:        req.Type,
		Description: req.Description,
		Genre:       req.Genre,
		Image:       req.Image,
	}

	created, err := h.DB.AddProduct(product)
	if err != nil {
		slog.Error("admin create product: failed", "name", req.Name, "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create product"})
		return
	}

	slog.Info("admin create product: success", "id", created.ID, "name", created.Name)
	c.JSON(http.StatusCreated, created)
}

// UpdateProductHandler updates an existing product by ID (admin only).
func (h *AdminHandler) UpdateProductHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid product id"})
		return
	}

	var req UpdateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		slog.Warn("admin update product: invalid body", "error", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	// Fetch the current product to preserve existing values
	existing, err := h.DB.GetProductByID(id)
	if err != nil {
		slog.Warn("admin update product: not found", "id", id, "error", err)
		c.JSON(http.StatusNotFound, gin.H{"error": "product not found"})
		return
	}

	updated := *existing
	if req.Name != nil {
		updated.Name = *req.Name
	}
	if req.Type != nil {
		updated.Type = *req.Type
	}
	if req.Description != nil {
		updated.Description = *req.Description
	}
	if req.Genre != nil {
		updated.Genre = *req.Genre
	}
	if req.Image != nil {
		updated.Image = *req.Image
	}

	result, err := h.DB.UpdateProductByID(id, updated)
	if err != nil {
		slog.Error("admin update product: failed", "id", id, "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update product"})
		return
	}

	slog.Info("admin update product: success", "id", id)
	c.JSON(http.StatusOK, result)
}

// DeleteProductHandler deletes a product by ID (admin only).
func (h *AdminHandler) DeleteProductHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid product id"})
		return
	}

	deleted, err := h.DB.DeleteProductByID(id)
	if err != nil {
		slog.Error("admin delete product: failed", "id", id, "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete product"})
		return
	}
	if !deleted {
		c.JSON(http.StatusNotFound, gin.H{"error": "product not found"})
		return
	}

	slog.Info("admin delete product: success", "id", id)
	c.JSON(http.StatusOK, gin.H{"message": "product deleted"})
}

// UploadProductImageHandler handles product image upload (admin only).
// Accepts multipart/form-data with a "product_image" field containing the image file.
func (h *AdminHandler) UploadProductImageHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid product id"})
		return
	}

	file, header, err := c.Request.FormFile("product_image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "se requiere un archivo de imagen"})
		return
	}
	defer file.Close()

	if header.Size > maxProductImageSize {
		c.JSON(http.StatusBadRequest, gin.H{"error": "la imagen no puede superar los 5 MB"})
		return
	}

	ext := strings.ToLower(filepath.Ext(header.Filename))
	contentType, ok := allowedProductImageExts[ext]
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("formato no soportado: %s. Usa jpg, png, webp o gif", ext)})
		return
	}

	if contentType == "" {
		contentType = mime.TypeByExtension(ext)
	}

	fileBytes := make([]byte, header.Size)
	if _, err := file.Read(fileBytes); err != nil {
		slog.Error("admin upload product image: failed to read file", "productID", id, "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "error al leer el archivo"})
		return
	}

	publicURL, err := h.DB.UploadProductImage(id, fileBytes, ext, contentType)
	if err != nil {
		slog.Error("admin upload product image: upload failed", "productID", id, "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	slog.Info("admin upload product image: success", "productID", id)
	c.JSON(http.StatusOK, gin.H{"image": publicURL})
}

// DeleteProductImageHandler removes the product image from Storage and clears
// the Image field in the DB (admin only).
func (h *AdminHandler) DeleteProductImageHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid product id"})
		return
	}

	if err := h.DB.DeleteProductImage(id); err != nil {
		slog.Error("admin delete product image: failed", "productID", id, "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	slog.Info("admin delete product image: success", "productID", id)
	c.JSON(http.StatusOK, gin.H{"image": ""})
}

// TopRatedHandler returns the top N best-rated products (requires auth, not admin).
func (h *AdminHandler) TopRatedHandler(c *gin.Context) {
	limit := 5
	if l, err := strconv.Atoi(c.DefaultQuery("limit", "5")); err == nil && l > 0 && l <= 50 {
		limit = l
	}

	products, err := h.DB.GetTopRated(limit)
	if err != nil {
		slog.Error("top rated: query failed", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load top rated products"})
		return
	}

	c.JSON(http.StatusOK, products)
}

// WorstRatedHandler returns the bottom N worst-rated products (requires auth, not admin).
func (h *AdminHandler) WorstRatedHandler(c *gin.Context) {
	limit := 5
	if l, err := strconv.Atoi(c.DefaultQuery("limit", "5")); err == nil && l > 0 && l <= 50 {
		limit = l
	}

	products, err := h.DB.GetWorstRated(limit)
	if err != nil {
		slog.Error("worst rated: query failed", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load worst rated products"})
		return
	}

	c.JSON(http.StatusOK, products)
}
