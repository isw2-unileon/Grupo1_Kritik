package config

import (
	"os"
	"testing"
)

func TestLoadDefaults(t *testing.T) {
	os.Unsetenv("PORT")
	os.Unsetenv("GIN_MODE")
	os.Unsetenv("JWT_SECRET")
	os.Unsetenv("CORS_ALLOW_ORIGIN")

	cfg := Load()

	if cfg.Port != "8080" {
		t.Errorf("expected PORT 8080, got %s", cfg.Port)
	}
	if cfg.GinMode != "debug" {
		t.Errorf("expected GIN_MODE debug, got %s", cfg.GinMode)
	}
	if cfg.JWTSecret != "your-secret-key-change-in-production" {
		t.Errorf("unexpected default JWT secret")
	}
	if cfg.CORSAllowOrigin != "*" {
		t.Errorf("expected CORS_ALLOW_ORIGIN *, got %s", cfg.CORSAllowOrigin)
	}
}

func TestLoadFromEnv(t *testing.T) {
	os.Setenv("PORT", "9090")
	os.Setenv("GIN_MODE", "release")
	os.Setenv("JWT_SECRET", "custom-secret")
	os.Setenv("CORS_ALLOW_ORIGIN", "https://example.com")
	defer func() {
		os.Unsetenv("PORT")
		os.Unsetenv("GIN_MODE")
		os.Unsetenv("JWT_SECRET")
		os.Unsetenv("CORS_ALLOW_ORIGIN")
	}()

	cfg := Load()

	if cfg.Port != "9090" {
		t.Errorf("expected PORT 9090, got %s", cfg.Port)
	}
	if cfg.GinMode != "release" {
		t.Errorf("expected GIN_MODE release, got %s", cfg.GinMode)
	}
	if cfg.JWTSecret != "custom-secret" {
		t.Errorf("expected custom JWT secret, got %s", cfg.JWTSecret)
	}
	if cfg.CORSAllowOrigin != "https://example.com" {
		t.Errorf("expected CORS_ALLOW_ORIGIN https://example.com, got %s", cfg.CORSAllowOrigin)
	}
}

func TestLoadPartialEnv(t *testing.T) {
	os.Setenv("PORT", "3000")
	defer os.Unsetenv("PORT")

	cfg := Load()

	if cfg.Port != "3000" {
		t.Errorf("expected PORT 3000, got %s", cfg.Port)
	}
	if cfg.GinMode != "debug" {
		t.Errorf("expected GIN_MODE debug (default), got %s", cfg.GinMode)
	}
}
