package auth

import (
	"testing"
)

func init() {
	Initialize("test-secret-key")
}

func TestGenerateAndValidateToken(t *testing.T) {
	token, err := GenerateToken(42, "test@example.com", false)
	if err != nil {
		t.Fatalf("GenerateToken failed: %v", err)
	}

	claims, err := ValidateToken(token)
	if err != nil {
		t.Fatalf("ValidateToken failed: %v", err)
	}

	if claims.UserID != 42 {
		t.Errorf("expected UserID 42, got %d", claims.UserID)
	}
	if claims.Email != "test@example.com" {
		t.Errorf("expected Email test@example.com, got %s", claims.Email)
	}
}

func TestValidateMalformedToken(t *testing.T) {
	_, err := ValidateToken("not-a-jwt-token")
	if err == nil {
		t.Error("expected error for malformed token")
	}
}

func TestValidateExpiredToken(t *testing.T) {
	oldSecret := jwtSecret
	Initialize("test-secret-key")

	token, err := GenerateToken(1, "expired@test.com", false)
	if err != nil {
		t.Fatalf("GenerateToken failed: %v", err)
	}
	Initialize(oldSecret)

	_, err = ValidateToken(token)
	if err != nil {
		t.Fatalf("ValidateToken with same secret should succeed: %v", err)
	}
}

func TestValidateTokenWrongSecret(t *testing.T) {
	originalSecret := jwtSecret

	Initialize("first-secret")
	token, err := GenerateToken(1, "test@test.com", false)
	if err != nil {
		t.Fatalf("GenerateToken failed: %v", err)
	}

	Initialize("different-secret")
	_, err = ValidateToken(token)
	if err == nil {
		t.Error("expected error when validating token signed with a different secret")
	}

	Initialize(originalSecret)
}


