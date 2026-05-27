package handlers

import (
	"log/slog"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/isw2-unileon/GRUPO1_KRITIK/backend/bd"
)

// CreateReviewRequest is the payload for publishing a review.
type CreateReviewRequest struct {
	Title       string `json:"title"`        // stored as Review.Name (unique)
	ProductID   int    `json:"product_name"` // must be an existing Product
	Description string `json:"description"`
	Recommended bool   `json:"recommended"`
}

// ReviewHandler struct
type ReviewHandler struct {
	DB bd.Database
}

// NewReviewHandler initialices the handler with any bd.Database implementation
func NewReviewHandler(db bd.Database) *ReviewHandler {
	return &ReviewHandler{DB: db}
}

// CreateReviewHandler creates a review for an existing product on behalf of the
// authenticated user.
func (h *ReviewHandler) CreateReviewHandler(c *gin.Context) {
	userID := c.GetInt("UserID")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthenticated"})
		return
	}

	var req CreateReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		slog.Warn("create review: invalid body", "error", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	req.Title = strings.TrimSpace(req.Title)
	req.Description = strings.TrimSpace(req.Description)

	// The Review table stores the author by username, but the JWT only carries
	// the user ID, so we look the user up to get their username.
	user, err := h.DB.GetUserByID(userID)
	if err != nil {
		slog.Error("create review: user lookup failed", "user_id", userID, "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to resolve user"})
		return
	}

	review, err := h.DB.AddReview(bd.Review{
		Name:        req.Title,
		Description: req.Description,
		Recommended: req.Recommended,
		ProductID:   req.ProductID,
		UserID:      user.ID,
	})
	if err != nil {
		slog.Error("create review: insert failed", "user_id", userID, "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not create review (the title may already exist, or the product is not registered)"})
		return
	}

	slog.Info("create review: success", "review", review.Name, "user", user.UserName, "product", review.ProductID)
	c.JSON(http.StatusCreated, review)
}

// SearchProductHandler returns Products matching the ?q= query string.
func (h *ReviewHandler) SearchProductHandler(c *gin.Context) {
	query := strings.TrimSpace(c.Query("q"))
	if query == "" {
		c.JSON(http.StatusOK, []bd.Product{})
		return
	}

	products, err := h.DB.GetProductByName(query)
	if err != nil {
		slog.Error("search product: failed", "q", query, "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to search products"})
		return
	}

	c.JSON(http.StatusOK, products)
}

// GetUserReviewsHandler returns the reviews written by the authenticated user.
func (h *ReviewHandler) GetUserReviewsHandler(c *gin.Context) {
	userID := c.GetInt("userID")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthenticated"})
		return
	}

	user, err := h.DB.GetUserByID(userID)
	if err != nil {
		slog.Error("get reviews: user lookup failed", "user_id", userID, "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to resolve user"})
		return
	}

	reviews, err := h.DB.GetReviewsByUserEmail(user.Email)
	if err != nil {
		slog.Error("get reviews: query failed", "user", user.UserName, "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load reviews"})
		return
	}

	c.JSON(http.StatusOK, reviews)
}
