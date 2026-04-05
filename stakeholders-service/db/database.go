package db

import (
	"fmt"
	"os"
	"stakeholders-service/model"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Connect() {
    host := os.Getenv("DB_HOST")
    if host == "" {
        host = "localhost"
    }
    dsn := fmt.Sprintf(
        "postgresql://postgres:root@%s:5432/stakeholders?sslmode=disable",
        host,
    )
    var err error
    DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
    if err != nil {
        panic("Can't connect to the database:" + err.Error())
    }
    DB.AutoMigrate(&model.User{})
    fmt.Println("Database connected!")
}