package services

import (
	"fmt"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"
)

type S3Service struct {
	client     *s3.S3
	bucketName string
}

func NewS3Service(region, bucketName string) *S3Service {
	sess := session.Must(session.NewSession(&aws.Config{
		Region: aws.String(region),
	}))
	return &S3Service{
		client:     s3.New(sess),
		bucketName: bucketName,
	}
}

func (s *S3Service) GenerateUploadURL(userID, videoID, contentType string) (string, error) {
	key := fmt.Sprintf("videos/%s/%s.mp4", userID, videoID)

	req, _ := s.client.PutObjectRequest(&s3.PutObjectInput{
		Bucket:      aws.String(s.bucketName),
		Key:         aws.String(key),
		ContentType: aws.String(contentType),
	})

	url, err := req.Presign(15 * time.Minute)
	if err != nil {
		return "", fmt.Errorf("failed to generate presigned URL: %w", err)
	}

	return url, nil
}

func (s *S3Service) VideoURL(userID, videoID string) string {
	return fmt.Sprintf("https://%s.s3.amazonaws.com/videos/%s/%s.mp4",
		s.bucketName, userID, videoID)
}
