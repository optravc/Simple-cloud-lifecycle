package cloud

import (
	"context"
	"fmt"
	"log"
	"mime/multipart"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/feature/s3/manager"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

// UploadImageToS3 รับไฟล์รูปจาก HTTP Request มาอัปโหลดขึ้น AWS S3
func UploadImageToS3(file multipart.File, filename string) (string, error) {
	// 1. โหลด Config แบบเดียวกับที่คุณทำใน aws_services.go
	cfg, err := config.LoadDefaultConfig(context.TODO())
	if err != nil {
		log.Printf("[Error] ไม่สามารถโหลด AWS Config ได้: %v", err)
		return "", err
	}

	// 2. สร้าง S3 Client และ Uploader
	client := s3.NewFromConfig(cfg)
	uploader := manager.NewUploader(client)

	bucketName := "simeple-cloud-lifecylce-demo-storage" 
	folderPath := "providers/icons/" + filename

	result, err := uploader.Upload(context.TODO(), &s3.PutObjectInput{
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