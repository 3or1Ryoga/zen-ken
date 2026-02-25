package main

import (
	"log"

	"github.com/gin-gonic/gin"

	"github.com/ryogasakai/zen-ken-backend/config"
	"github.com/ryogasakai/zen-ken-backend/database"
	"github.com/ryogasakai/zen-ken-backend/handlers"
	"github.com/ryogasakai/zen-ken-backend/middleware"
	"github.com/ryogasakai/zen-ken-backend/services"
)

func main() {
	cfg := config.Load()

	db := database.Connect(cfg.DatabaseURL)

	authService := services.NewAuthService(db, cfg.JWTSecret)
	s3Service := services.NewS3Service(cfg.AWSRegion, cfg.S3BucketName)

	authHandler := handlers.NewAuthHandler(authService)
	trickHandler := handlers.NewTrickHandler(db)
	videoHandler := handlers.NewVideoHandler(db, s3Service)

	r := gin.Default()
	r.Use(middleware.CORS())

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	api := r.Group("/api")
	{
		// 認証
		auth := api.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
			auth.GET("/me", middleware.AuthRequired(cfg.JWTSecret), authHandler.Me)
		}

		// 技
		tricks := api.Group("/tricks")
		{
			tricks.GET("", trickHandler.List)
			tricks.GET("/:slug", trickHandler.GetBySlug)
			tricks.GET("/:slug/videos", videoHandler.ListByTrick)
		}

		// 動画
		videos := api.Group("/videos")
		videos.Use(middleware.AuthRequired(cfg.JWTSecret))
		{
			videos.POST("", videoHandler.Create)
			videos.POST("/upload-url", videoHandler.GetUploadURL)
		}
	}

	log.Printf("Server starting on port %s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
