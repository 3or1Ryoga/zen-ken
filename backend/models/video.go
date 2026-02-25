package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Video struct {
	ID              uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	TrickID         uuid.UUID `gorm:"type:uuid;not null;column:trick_id" json:"trickId"`
	UserID          uuid.UUID `gorm:"type:uuid;not null;column:user_id" json:"userId"`
	VideoURL        string    `gorm:"column:video_url;not null" json:"videoUrl"`
	VideoType       string    `gorm:"type:video_type_enum;not null;column:video_type" json:"videoType"`
	ThumbnailURL    *string   `gorm:"column:thumbnail_url" json:"thumbnailUrl,omitempty"`
	Comment         *string   `json:"comment,omitempty"`
	Views           int       `gorm:"default:0" json:"views"`
	Likes           int       `gorm:"default:0" json:"likes"`
	DurationSeconds *int      `gorm:"column:duration_seconds" json:"durationSeconds,omitempty"`
	FileSizeBytes   *int64    `gorm:"column:file_size_bytes" json:"fileSizeBytes,omitempty"`
	User            *User     `gorm:"foreignKey:UserID" json:"user,omitempty"`
	CreatedAt       time.Time `json:"createdAt"`
	UpdatedAt       time.Time `json:"updatedAt"`
}

func (v *Video) BeforeCreate(tx *gorm.DB) error {
	if v.ID == uuid.Nil {
		v.ID = uuid.New()
	}
	return nil
}
