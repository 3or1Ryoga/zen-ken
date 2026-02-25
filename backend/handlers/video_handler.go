package handlers

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/ryogasakai/zen-ken-backend/models"
	"github.com/ryogasakai/zen-ken-backend/services"
)

type VideoHandler struct {
	db        *gorm.DB
	s3Service *services.S3Service
}

func NewVideoHandler(db *gorm.DB, s3Service *services.S3Service) *VideoHandler {
	return &VideoHandler{db: db, s3Service: s3Service}
}

func (h *VideoHandler) ListByTrick(c *gin.Context) {
	slug := c.Param("slug")

	var trick models.Trick
	if err := h.db.Where("slug = ?", slug).First(&trick).Error; err != nil {
		c.JSON(404, gin.H{"success": false, "error": "Trick not found"})
		return
	}

	var videos []models.Video
	if err := h.db.Preload("User").
		Where("trick_id = ?", trick.ID).
		Order("created_at DESC").
		Find(&videos).Error; err != nil {
		c.JSON(500, gin.H{"success": false, "error": "Failed to fetch videos"})
		return
	}

	c.JSON(200, gin.H{
		"success": true,
		"data":    gin.H{"videos": videos},
	})
}

type uploadURLRequest struct {
	Filename    string `json:"filename" binding:"required"`
	ContentType string `json:"contentType" binding:"required"`
	TrickID     string `json:"trickId" binding:"required"`
}

func (h *VideoHandler) GetUploadURL(c *gin.Context) {
	var req uploadURLRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"success": false, "error": err.Error()})
		return
	}

	userID, _ := c.Get("userID")
	videoID := uuid.New().String()

	uploadURL, err := h.s3Service.GenerateUploadURL(userID.(string), videoID, req.ContentType)
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": "Failed to generate upload URL"})
		return
	}

	c.JSON(200, gin.H{
		"success": true,
		"data": gin.H{
			"uploadUrl": uploadURL,
			"videoId":   videoID,
			"expiresIn": 900,
		},
	})
}

type createVideoRequest struct {
	TrickID         string  `json:"trickId" binding:"required"`
	VideoURL        string  `json:"videoUrl" binding:"required"`
	VideoType       string  `json:"videoType" binding:"required,oneof=youtube instagram tiktok upload"`
	Comment         *string `json:"comment"`
	DurationSeconds *int    `json:"durationSeconds"`
}

func (h *VideoHandler) Create(c *gin.Context) {
	var req createVideoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"success": false, "error": err.Error()})
		return
	}

	if req.DurationSeconds != nil && *req.DurationSeconds > 60 {
		c.JSON(400, gin.H{"success": false, "error": "Video must be 60 seconds or less"})
		return
	}

	userIDStr, _ := c.Get("userID")
	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		c.JSON(400, gin.H{"success": false, "error": "Invalid user ID"})
		return
	}

	trickID, err := uuid.Parse(req.TrickID)
	if err != nil {
		c.JSON(400, gin.H{"success": false, "error": "Invalid trick ID"})
		return
	}

	video := &models.Video{
		TrickID:         trickID,
		UserID:          userID,
		VideoURL:        req.VideoURL,
		VideoType:       req.VideoType,
		Comment:         req.Comment,
		DurationSeconds: req.DurationSeconds,
		Views:           0,
		Likes:           0,
	}

	if err := h.db.Create(video).Error; err != nil {
		c.JSON(500, gin.H{"success": false, "error": "Failed to save video"})
		return
	}

	c.JSON(201, gin.H{
		"success": true,
		"data":    gin.H{"video": video},
	})
}
