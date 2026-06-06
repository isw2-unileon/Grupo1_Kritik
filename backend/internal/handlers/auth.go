package handlers

import (
	"fmt"
	"log/slog"
	"mime"
	"net/http"
	"path/filepath"
	"strings"

	"cloud.google.com/go/civil"
	"github.com/gin-gonic/gin"
	"github.com/isw2-unileon/GRUPO1_KRITIK/backend/bd"
	"github.com/isw2-unileon/GRUPO1_KRITIK/backend/internal/auth"
)

// RegisterRequest represents the payload for user registration.
type RegisterRequest struct {
	Email    string      `json:"email" binding:"required,email"`
	Password string      `json:"password" binding:"required"`
	Name     string      `json:"name" binding:"required"`
	Surname  string      `json:"surname"`
	UserName string      `json:"user_name"`
	Birth    *civil.Date `json:"birth"`
	Image    string      `json:"Image,omitempty"`
}

// LoginRequest represents the payload for user login.
type LoginRequest struct {
	Email    string `json:"email"`
	UserName string `json:"user_name"`
	Password string `json:"password" binding:"required"`
}

// AuthResponse represents the response returned after successful authentication.
type AuthResponse struct {
	Token string       `json:"token"`
	User  UserResponse `json:"user"`
}

// UserResponse represents the user data returned in API responses.
type UserResponse struct {
	ID       int    `json:"id"`
	Email    string `json:"email"`
	Name     string `json:"name"`
	Surname  string `json:"surname"`
	UserName string `json:"user_name"`
	Image    string `json:"image,omitempty"`
}

// AuthHandler struct
type AuthHandler struct {
	DB bd.Database
}

// NewAuthHandler initialices the authentication handler
func NewAuthHandler(db bd.Database) *AuthHandler {
	return &AuthHandler{DB: db}
}

// RegisterHandler handles user registration.
func (h *AuthHandler) RegisterHandler(c *gin.Context) {
	var req RegisterRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		slog.Warn("register: invalid request body", "error", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request: missing required fields"})
		return
	}

	req.Email = strings.TrimSpace(req.Email)
	req.Password = strings.TrimSpace(req.Password)
	req.Name = strings.TrimSpace(req.Name)
	req.Surname = strings.TrimSpace(req.Surname)
	req.UserName = strings.TrimSpace(req.UserName)

	if req.Email == "" || req.Password == "" || req.Name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "email, password, and name cannot be empty"})
		return
	}

	existingUser, err := h.DB.GetUserByEmail(req.Email)
	if err != nil {
		slog.Warn("register: email lookup failed", "email", req.Email, "error", err)
	}
	if existingUser != nil {
		slog.Info("register: duplicate email", "email", req.Email)
		c.JSON(http.StatusConflict, gin.H{"error": "email already registered"})
		return
	}

	if req.UserName != "" {
		existingUsername, err := h.DB.GetUserByUserName(req.UserName)
		if err != nil {
			slog.Warn("register: username lookup failed", "user_name", req.UserName, "error", err)
		}
		if existingUsername != nil {
			slog.Info("register: duplicate username", "user_name", req.UserName)
			c.JSON(http.StatusConflict, gin.H{"error": "username already taken"})
			return
		}
	}

	newUser := bd.User{
		Email:    req.Email,
		Password: req.Password,
		Name:     req.Name,
		Surname:  req.Surname,
		UserName: req.UserName,
		Birth:    req.Birth,
		Image:    req.Image,
	}

	addedUser, err := h.DB.AddUser(newUser)
	if err != nil {
		slog.Error("register: failed to create user", "email", req.Email, "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create user"})
		return
	}

	slog.Info("register: user created", "id", addedUser.ID, "email", addedUser.Email, "user_name", addedUser.UserName)

	response := UserResponse{
		ID:       addedUser.ID,
		Email:    addedUser.Email,
		Name:     addedUser.Name,
		Surname:  addedUser.Surname,
		UserName: addedUser.UserName,
		Image:    addedUser.Image,
	}

	c.JSON(http.StatusCreated, response)
}

// LoginHandler handles user login and returns a JWT token.
func (h *AuthHandler) LoginHandler(c *gin.Context) {
	var req LoginRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		slog.Warn("login: invalid request body", "error", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request: missing required fields"})
		return
	}

	req.Email = strings.TrimSpace(req.Email)
	req.UserName = strings.TrimSpace(req.UserName)
	req.Password = strings.TrimSpace(req.Password)

	if (req.Email == "" && req.UserName == "") || req.Password == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "email or username, and password are required"})
		return
	}

	var user *bd.User
	var err error

	if req.Email != "" {
		user, err = h.DB.GetUserByEmail(req.Email)
		if err != nil {
			slog.Warn("login: user not found by email", "email", req.Email, "error", err)
		}
	} else {
		user, err = h.DB.GetUserByUserName(req.UserName)
		if err != nil {
			slog.Warn("login: user not found by username", "user_name", req.UserName, "error", err)
		}
	}

	if err != nil || user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	if !bd.VerifyPassword(req.Password, user.Password) {
		slog.Warn("login: wrong password", "email", user.Email, "user_name", user.UserName)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	token, err := auth.GenerateToken(user.ID, user.Email)
	if err != nil {
		slog.Error("login: token generation failed", "user_id", user.ID, "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token"})
		return
	}

	slog.Info("login: success", "id", user.ID, "email", user.Email, "user_name", user.UserName)

	response := AuthResponse{
		Token: token,
		User: UserResponse{
			ID:       user.ID,
			Email:    user.Email,
			Name:     user.Name,
			Surname:  user.Surname,
			UserName: user.UserName,
			Image:    user.Image,
		},
	}

	c.JSON(http.StatusOK, response)
}

var allowedAvatarExts = map[string]string{
	".jpg":  "image/jpeg",
	".jpeg": "image/jpeg",
	".png":  "image/png",
	".webp": "image/webp",
	".gif":  "image/gif",
}

const maxAvatarSize = 5 << 20 // 5 MB

// UpdateAvatarHandler handles avatar upload for the authenticated user.
// Accepts multipart/form-data with an "avatar" field containing the image file.
func (h *AuthHandler) UpdateAvatarHandler(c *gin.Context) {
	userID := c.GetInt("userID")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthenticated"})
		return
	}

	file, header, err := c.Request.FormFile("avatar")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "se requiere un archivo de imagen"})
		return
	}
	defer file.Close()

	if header.Size > maxAvatarSize {
		c.JSON(http.StatusBadRequest, gin.H{"error": "la imagen no puede superar los 5 MB"})
		return
	}

	ext := strings.ToLower(filepath.Ext(header.Filename))
	contentType, ok := allowedAvatarExts[ext]
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("formato no soportado: %s. Usa jpg, png, webp o gif", ext)})
		return
	}

	if contentType == "" {
		contentType = mime.TypeByExtension(ext)
	}

	fileBytes := make([]byte, header.Size)
	if _, err := file.Read(fileBytes); err != nil {
		slog.Error("avatar: failed to read file", "userID", userID, "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "error al leer el archivo"})
		return
	}

	publicURL, err := h.DB.UploadAvatar(userID, fileBytes, ext, contentType)
	if err != nil {
		slog.Error("avatar: upload failed", "userID", userID, "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"image": publicURL})
}
