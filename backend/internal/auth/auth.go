// Package auth handles JWT token generation and validation.
package auth

import (
	"fmt"
	"log/slog"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// Claims represents the JWT claims structure.
type Claims struct {
	UserID int    `json:"user_id"`
	Email  string `json:"email"`
	jwt.RegisteredClaims
}

var jwtSecret string

// Initialize sets the JWT secret key.
func Initialize(secret string) {
	jwtSecret = secret
}

// GenerateToken creates a signed JWT token for a user.
// Token expires in 24 hours.
func GenerateToken(userID int, email string) (string, error) {
	claims := Claims{
		UserID: userID,
		Email:  email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(jwtSecret))
	if err != nil {
		slog.Error("auth: failed to sign token", "user_id", userID, "error", err)
		return "", fmt.Errorf("error signing token: %w", err)
	}

	slog.Debug("auth: token generated", "user_id", userID, "email", email)
	return tokenString, nil
}

// ValidateToken parses and validates a JWT token.
func ValidateToken(tokenString string) (*Claims, error) {
	claims := &Claims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(jwtSecret), nil
	})
	if err != nil {
		slog.Warn("auth: token validation failed", "error", err)
		return nil, fmt.Errorf("error parsing token: %w", err)
	}

	if !token.Valid {
		slog.Warn("auth: invalid token")
		return nil, fmt.Errorf("invalid token")
	}

	slog.Debug("auth: token validated", "user_id", claims.UserID, "email", claims.Email)
	return claims, nil
}
