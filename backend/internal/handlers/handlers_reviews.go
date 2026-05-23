package handlers

import (
	"log/slog"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/isw2-unileon/GRUPO1_KRITIK/backend/bd"
)

// recommendThreshold: ratings at or above this value mark the review as recommended.
const recommendThreshold = 6.0

// CreateReviewRequest is the payload for publishing a review.
type CreateReviewRequest struct {
	Title       string  `json:"title"`        // stored as Review.Name (unique)
	ProductName string  `json:"product_name"` // must be an existing Product
	Description string  `json:"description"`
	Rating      float64 `json:"rating"` // 0-10, one decimal
}

// CreateReviewHandler creates a review for an existing product on behalf of the
// authenticated user. Recommended is derived from the rating.
func CreateReviewHandler(c *gin.Context) {
	userID := c.GetInt("userID")
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
	req.ProductName = strings.TrimSpace(req.ProductName)
	req.Description = strings.TrimSpace(req.Description)

	if req.Title == "" || req.ProductName == "" || req.Description == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "title, product and description are required"})
		return
	}
	if req.Rating < 0 || req.Rating > 10 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "rating must be between 0 and 10"})
		return
	}

	// The Review table stores the author by username, but the JWT only carries
	// the user ID, so we look the user up to get their username.
	user, err := bd.GetUserByID(strconv.Itoa(userID))
	if err != nil {
		slog.Error("create review: user lookup failed", "user_id", userID, "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to resolve user"})
		return
	}

	review, err := bd.AddReview(bd.Review{
		Name:        req.Title,
		Description: req.Description,
		Rating:      req.Rating,
		Recommended: req.Rating >= recommendThreshold,
		ProductName: req.ProductName,
		UserName:    user.UserName,
	})
	if err != nil {
		slog.Error("create review: insert failed", "user_id", userID, "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not create review (the title may already exist, or the product is not registered)"})
		return
	}

	slog.Info("create review: success", "review", review.Name, "user", user.UserName, "product", review.ProductName)
	c.JSON(http.StatusCreated, review)
}

// SearchProductHandler returns Products matching the ?q= query string.
func SearchProductHandler(c *gin.Context) {
	query := strings.TrimSpace(c.Query("q"))
	if query == "" {
		c.JSON(http.StatusOK, []bd.Product{})
		return
	}

	products, err := bd.SearchProductByName(query)
	if err != nil {
		slog.Error("search product: failed", "q", query, "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to search products"})
		return
	}

	c.JSON(http.StatusOK, products)
}
