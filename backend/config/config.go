package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	DatabaseURL    string
	JWTSecret      string
	AWSRegion      string
	AWSAccessKeyID string
	AWSSecretKey   string
	S3BucketName   string
	Port           string
}

func Load() *Config {
	// .env.local を読み込む（存在しない場合は無視）
	if err := godotenv.Load("../.env.local"); err != nil {
		log.Println("No .env.local file found, using environment variables")
	}

	cfg := &Config{
		DatabaseURL:    getEnv("DATABASE_URL", "postgresql://ryogasakai@localhost:5432/zen-ken"),
		JWTSecret:      getEnv("JWT_SECRET", "dev-secret-please-change"),
		AWSRegion:      getEnv("AWS_REGION", "ap-northeast-1"),
		AWSAccessKeyID: getEnv("AWS_ACCESS_KEY_ID", ""),
		AWSSecretKey:   getEnv("AWS_SECRET_ACCESS_KEY", ""),
		S3BucketName:   getEnv("S3_BUCKET_NAME", "zen-kendama"),
		Port:           getEnv("PORT", "8080"),
	}

	return cfg
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
