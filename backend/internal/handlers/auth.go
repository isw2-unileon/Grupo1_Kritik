// Package handlers contains HTTP request handlers.
package handlers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/isw2-unileon/GRUPO1_KRITIK/backend/bd"
	"github.com/isw2-unileon/GRUPO1_KRITIK/backend/internal/auth"
)

// RegisterRequest holds the registration payload.
type RegisterRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
	Name     string `json:"name" binding:"required"`
}

// LoginRequest holds the login payload.
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// AuthResponse holds the successful auth response.
type AuthResponse struct {
	Token string       `json:"token"`
	User  UserResponse `json:"user"`
}

// UserResponse holds user data without the password.
type UserResponse struct {
	ID    int    `json:"id"`
	Email string `json:"email"`
	Name  string `json:"name"`
}

// RegisterHandler handles user registration.
func RegisterHandler(c *gin.Context) {
	var req RegisterRequest

	// Validate JSON binding
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request: missing required fields"})
		return
	}

	// Trim whitespace
	req.Email = strings.TrimSpace(req.Email)
	req.Password = strings.TrimSpace(req.Password)
	req.Name = strings.TrimSpace(req.Name)

	// Additional validation
	if req.Email == "" || req.Password == "" || req.Name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "email, password, and name cannot be empty"})
		return
	}

	// Check if email already exists
	existingUser, _ := bd.GetUserByEmail(req.Email)
	if existingUser != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "email already registered"})
		return
	}

	// Create new user
	newUser := bd.User{
		Email:    req.Email,
		Password: req.Password,
		Name:     req.Name,
	}

	addedUser, err := bd.AddUser(newUser)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create user"})
		return
	}

	// Return user without password
	response := UserResponse{
		ID:    addedUser.ID,
		Email: addedUser.Email,
		Name:  addedUser.Name,
	}

	c.JSON(http.StatusCreated, response)
}

// LoginHandler handles user login.
func LoginHandler(c *gin.Context) {
	var req LoginRequest

	// Validate JSON binding
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request: missing required fields"})
		return
	}

	// Trim whitespace
	req.Email = strings.TrimSpace(req.Email)
	req.Password = strings.TrimSpace(req.Password)

	// Additional validation
	if req.Email == "" || req.Password == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "email and password are required"})
		return
	}

	// Get user by email
	user, err := bd.GetUserByEmail(req.Email)
	if err != nil || user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid email or password"})
		return
	}

	// Verify password
	if !bd.VerifyPassword(req.Password, user.Password) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid email or password"})
		return
	}

	// Generate JWT token
	token, err := auth.GenerateToken(user.ID, user.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token"})
		return
	}

	// Return token and user data
	response := AuthResponse{
		Token: token,
		User: UserResponse{
			ID:    user.ID,
			Email: user.Email,
			Name:  user.Name,
		},
	}

	c.JSON(http.StatusOK, response)
}
