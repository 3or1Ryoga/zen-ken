package models

import (
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"
	"gorm.io/gorm"
)

type Trick struct {
	ID             uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Slug           string         `gorm:"uniqueIndex;not null" json:"slug"`
	NameJa         string         `gorm:"column:name_ja;not null" json:"nameJa"`
	NameEn         string         `gorm:"column:name_en;not null" json:"nameEn"`
	Category       string         `gorm:"type:category_enum;not null" json:"category"`
	Subcategory    *string        `json:"subcategory,omitempty"`
	Difficulty     int            `gorm:"not null" json:"difficulty"`
	DifficultyLabel *string       `gorm:"column:difficulty_label" json:"difficultyLabel,omitempty"`
	Attribute      *string        `json:"attribute,omitempty"`
	ThumbnailURL   *string        `gorm:"column:thumbnail_url" json:"thumbnailUrl,omitempty"`
	IconURL        *string        `gorm:"column:icon_url" json:"iconUrl,omitempty"`
	Tags           pq.StringArray `gorm:"type:text[]" json:"tags"`
	Videos         []Video        `gorm:"foreignKey:TrickID" json:"videos,omitempty"`
	CreatedAt      time.Time      `json:"createdAt"`
	UpdatedAt      time.Time      `json:"updatedAt"`
}

func (t *Trick) BeforeCreate(tx *gorm.DB) error {
	if t.ID == uuid.Nil {
		t.ID = uuid.New()
	}
	return nil
}
