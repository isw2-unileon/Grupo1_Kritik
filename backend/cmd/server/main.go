// Package main is the entry point for the backend server.
package main

import (
	"context"
	"log"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/isw2-unileon/GRUPO1_KRITIK/backend/bd"
	"github.com/isw2-unileon/GRUPO1_KRITIK/backend/internal/auth"
	"github.com/isw2-unileon/GRUPO1_KRITIK/backend/internal/config"
	"github.com/isw2-unileon/GRUPO1_KRITIK/backend/internal/handlers"
	"github.com/isw2-unileon/GRUPO1_KRITIK/backend/internal/middleware"
)

var logger = slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelDebug}))

// main
func main() {
	database, err := bd.NewSupabaseDB()
	if err != nil {
		log.Fatalf("Could not connect to the database: %v", err)
	}

	//Handlers
	authH := handlers.NewAuthHandler(database)
	reviewH := handlers.NewReviewHandler(database)

	ctx := context.Background()

	cfg := config.Load()

	// Initialize auth package with JWT secret
	auth.Initialize(cfg.JWTSecret)

	gin.SetMode(cfg.GinMode)

	r := gin.New()
	r.Use(gin.Logger(), gin.Recovery())

	r.Use(cors.New(cors.Config{
		AllowOrigins: []string{
			"https://grupo1-kritik.onrender.com",
			"http://localhost:5173",
		},
		AllowMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders: []string{"Origin", "Content-Type", "Authorization"},
	}))

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	api := r.Group("/api")
	api.GET("/hello", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "Hello from the API!!!"})
	})

	// Auth endpoints
	authGroup := r.Group("/auth")
	authGroup.POST("/register", authH.RegisterHandler)
	authGroup.POST("/login", authH.LoginHandler)

	// Review endpoints (protected: require a valid JWT)
	api.POST("/reviews", middleware.RequireAuth(), reviewH.CreateReviewHandler)
	api.GET("/reviews", middleware.RequireAuth(), reviewH.GetUserReviewsHandler)
	api.GET("/products", middleware.RequireAuth(), reviewH.SearchProductHandler)

	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      r,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
	}

	ctx, stop := signal.NotifyContext(ctx, os.Interrupt, syscall.SIGTERM)
	defer stop()

	go func() {
		slog.Info("server listening", "addr", srv.Addr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Error("server error", "error!", err)
			os.Exit(1)
		}
	}()

	<-ctx.Done()
	slog.Info("shutting down server")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		logger.Error("shutdown error", "error", err)
	}

	logger.Info("server stopped")
}
