// Package main is the entry point for the backend server.
// Comment to pass lint
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

func newRouter(db bd.Database) *gin.Engine {
	authH := handlers.NewAuthHandler(db)
	reviewH := handlers.NewReviewHandler(db)
	adminH := handlers.NewAdminHandler(db)

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
		c.JSON(http.StatusOK, gin.H{"message": "Hello from the API!!!!"})
	})

	authGroup := r.Group("/auth")
	authGroup.POST("/register", authH.RegisterHandler)
	authGroup.POST("/login", authH.LoginHandler)

	api.POST("/reviews", middleware.RequireAuth(), reviewH.CreateReviewHandler)
	api.GET("/reviews", middleware.RequireAuth(), reviewH.GetUserReviewsHandler)
	api.PUT("/reviews/:id", middleware.RequireAuth(), reviewH.UpdateReviewHandler)
	api.DELETE("/reviews/:id", middleware.RequireAuth(), reviewH.DeleteReviewHandler)
	api.GET("/products", middleware.RequireAuth(), reviewH.SearchProductHandler)
	api.GET("/fans", middleware.RequireAuth(), reviewH.GetAllFansHandler)
	api.GET("/influencers", middleware.RequireAuth(), reviewH.GetAllInfluencersHandler)
	api.POST("/follow", middleware.RequireAuth(), reviewH.FollowSomeoneHandler)
	api.POST("/unfollow", middleware.RequireAuth(), reviewH.UnfollowSomeoneHandler)
	api.GET("/recommendations", middleware.RequireAuth(), reviewH.GetRecommendationsHandler)
	api.GET("/recommendations/influencer", middleware.RequireAuth(), reviewH.GetInfluencerRecommendationHandler)
	api.GET("/recommendations/influencer/not", middleware.RequireAuth(), reviewH.GetInfluencerNotRecommendationHandler)
	api.GET("/products/random", reviewH.GetRandomProductsHandler)
	api.GET("/products/top", middleware.RequireAuth(), adminH.TopRatedHandler)
	api.GET("/products/worst", middleware.RequireAuth(), adminH.WorstRatedHandler)

	api.GET("/users/:id/profile", middleware.RequireAuth(), reviewH.GetUserProfileHandler)
	api.GET("/users/:id/reviews", middleware.RequireAuth(), reviewH.GetUserReviewsByIDHandler)
	api.GET("/users/search", middleware.RequireAuth(), reviewH.SearchUsersHandler)
	api.POST("/users/avatar", middleware.RequireAuth(), authH.UpdateAvatarHandler)
	api.DELETE("/users/avatar", middleware.RequireAuth(), authH.DeleteAvatarHandler)

	admin := r.Group("/api/admin")
	admin.Use(middleware.RequireAdmin())
	admin.GET("/products", adminH.ListProductsHandler)
	admin.GET("/products/:id", adminH.GetProductHandler)
	admin.POST("/products", adminH.CreateProductHandler)
	admin.PUT("/products/:id", adminH.UpdateProductHandler)
	admin.DELETE("/products/:id", adminH.DeleteProductHandler)
	admin.POST("/products/:id/image", adminH.UploadProductImageHandler)
	admin.DELETE("/products/:id/image", adminH.DeleteProductImageHandler)

	return r
}

var logger = slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelDebug}))

// main
func main() {
	database, err := bd.NewSupabaseDB()
	if err != nil {
		log.Fatalf("Could not connect to the database: %v", err)
	}

	ctx := context.Background()

	cfg := config.Load()

	// Initialize auth package with JWT secret
	auth.Initialize(cfg.JWTSecret)

	gin.SetMode(cfg.GinMode)

	r := newRouter(database)

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
