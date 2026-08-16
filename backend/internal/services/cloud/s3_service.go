package cloud

import (
	"context"
	"fmt"
	"log"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/s3/manager"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

// UploadImageToS3 รับไฟล์รูปจาก HTTP Request มาอัปโหลดขึ้น AWS S3
func UploadImageToS3(ctx context.Context, file multipart.File, filename string) (string, error) {
	// 1. โหลด Config แบบเดียวกับที่คุณทำใน aws_services.go
	cfg, err := GetAWSConfig(ctx)
	if err != nil {
		log.Printf("[Error] ไม่สามารถโหลด AWS Config ได้: %v", err)
		return "", err
	}

	// 2. สร้าง S3 Client และ Uploader
	client := s3.NewFromConfig(cfg)
	uploader := manager.NewUploader(client)

	// Read bucket name from environment variable (fallback to corrected bucket name)
	bucketName := os.Getenv("S3_BUCKET_NAME")
	if bucketName == "" {
		bucketName = "simple-cloud-lifecycle-demo-storage"
	}

	// Sanitize filename to prevent S3 path traversal attacks
	safeFilename := filepath.Base(filename)
	safeFilename = strings.ReplaceAll(safeFilename, "..", "")
	if safeFilename == "." || safeFilename == "" {
		return "", fmt.Errorf("invalid filename")
	}
	folderPath := "providers/icons/" + safeFilename

	result, err := uploader.Upload(ctx, &s3.PutObjectInput{
		Bucket: aws.String(bucketName),
		Key:    aws.String(folderPath),
		Body:   file,
	})

	if err != nil {
		return "", fmt.Errorf("failed to upload file: %v", err)
	}

	// 4. รีเทิร์น URL ของรูปที่อัปโหลดเสร็จแล้วกลับไป
	return result.Location, nil
}