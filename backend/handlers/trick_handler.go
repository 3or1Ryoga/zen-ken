package handlers

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/ryogasakai/zen-ken-backend/models"
)

type TrickHandler struct {
	db *gorm.DB
}

func NewTrickHandler(db *gorm.DB) *TrickHandler {
	return &TrickHandler{db: db}
}

func (h *TrickHandler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	category := c.Query("category")
	difficulty := c.Query("difficulty")
	search := c.Query("q")

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	offset := (page - 1) * limit

	query := h.db.Model(&models.Trick{})

	if category != "" {
		query = query.Where("category = ?", category)
	}
	if difficulty != "" {
		query = query.Where("difficulty = ?", difficulty)
	}
	if search != "" {
		query = query.Where("name_ja ILIKE ? OR name_en ILIKE ?",
			"%"+search+"%", "%"+search+"%")
	}

	var total int64
	query.Count(&total)

	var tricks []models.Trick
	if err := query.Offset(offset).Limit(limit).
		Order("difficulty ASC, name_ja ASC").
		Find(&tricks).Error; err != nil {
		c.JSON(500, gin.H{"success": false, "error": "Failed to fetch tricks"})
		return
	}

	totalPages := int(total) / limit
	if int(total)%limit != 0 {
		totalPages++
	}

	c.JSON(200, gin.H{
		"success": true,
		"data": gin.H{
			"tricks": tricks,
			"pagination": gin.H{
				"page":       page,
				"limit":      limit,
				"total":      total,
				"totalPages": totalPages,
			},
		},
	})
}

func (h *TrickHandler) GetBySlug(c *gin.Context) {
	slug := c.Param("slug")

	var trick models.Trick
	if err := h.db.Preload("Videos.User").
		Where("slug = ?", slug).
		First(&trick).Error; err != nil {
		c.JSON(404, gin.H{"success": false, "error": "Trick not found"})
		return
	}

	c.JSON(200, gin.H{
		"success": true,
		"data":    gin.H{"trick": trick},
	})
}
