package model

import "gorm.io/gorm"

type Role string

const (
	RoleAdmin   Role = "admin"
	RoleGuide   Role = "guide"
	RoleTourist Role = "tourist"
)

type User struct {
	gorm.Model
	Username  string `gorm:"unique;not null" json:"username"`
	Password  string `json:"-"`
	Email     string `gorm:"unique;not null" json:"email"`
	Role      Role   `json:"role"`
	IsBlocked bool   `json:"isBlocked"`
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
	Bio       string `json:"bio"`
	Motto     string `json:"motto"`
	ImageURL  string `json:"imageUrl"`
}