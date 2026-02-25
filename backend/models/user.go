package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type User struct {
	ID           uuid.UUID  `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Email        string     `gorm:"uniqueIndex;not null" json:"email"`
	Username     string     `gorm:"not null" json:"username"`
	PasswordHash *string    `gorm:"column:password_hash" json:"-"`
	AvatarURL    *string    `gorm:"column:avatar_url" json:"avatarUrl,omitempty"`
	Provider     string     `gorm:"not null;default:'email'" json:"provider"`
	ProviderID   *string    `gorm:"column:provider_id" json:"providerId,omitempty"`
	CreatedAt    time.Time  `json:"createdAt"`
	UpdatedAt    time.Time  `json:"updatedAt"`
}

func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return nil
}
