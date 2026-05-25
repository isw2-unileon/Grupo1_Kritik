package bd

import (
	"fmt"
	"log/slog"
	"os"

	"cloud.google.com/go/civil"
	"github.com/joho/godotenv"
	"github.com/supabase-community/supabase-go"
	"golang.org/x/crypto/bcrypt"
)

// User struct
type User struct {
	Id       int         `json:"id,omitempty"`
	Email    string      `json:"Email,omitempty"`
	Name     string      `json:"Name,omitempty"`
	Surname  string      `json:"Surname,omitempty"`
	UserName string      `json:"UserName,omitempty"`
	Password string      `json:"Password,omitempty"`
	Birth    *civil.Date `json:"Birth,omitempty"`
}

// Product struct
type Product struct {
	Id           int         `json:"id,omitempty"`
	Name         string      `json:"Name,omitempty"`
	Type         string      `json:"Type,omitempty"`
	AverageGrade int         `json:"AverageGrade,omitempty"`
	Description  string      `json:"Description,omitempty"`
	Release      *civil.Date `json:"Release,omitempty"`
	Genre        []string    `json:"Genre,omitempty"`
}

// Review struct
type Review struct {
	Id          int    `json:"id,omitempty"`
	Name        string `json:"Name,omitempty"`
	Recommended bool   `json:"Recommended,omitempty"`
	Description string `json:"Description,omitempty"`

	ProductId int `json:"ProductId,omitempty"`
	UserId    int `json:"UserId,omitempty"`
}

var client *supabase.Client

func init() {
	if err := godotenv.Load(); err != nil {
		if err = godotenv.Load("../../.env"); err != nil {
			slog.Error("supabase: failed to load .env", "error", err)
			os.Exit(1)
		}
	}

	url := os.Getenv("SUPABASE_URL")
	key := os.Getenv("SUPABASE_KEY")

	if url == "" || key == "" {
		slog.Error("supabase: SUPABASE_URL or SUPABASE_KEY not set")
		os.Exit(1)
	}

	var errClient error
	client, errClient = supabase.NewClient(url, key, &supabase.ClientOptions{})

	if errClient != nil {
		slog.Error("supabase: failed to create client", "error", errClient)
		os.Exit(1)
	}

	slog.Info("supabase: client initialised")
}

/*
 =========================================================
 User functions
 =========================================================
*/

// GetUserByEmail returns the User associated with the userEmail or an error if it occurred
func GetUserByEmail(userEmail string) (*User, error) {

	var users []User
	_, err := client.From("Users").
		Select("*", "exact", false).
		Eq("Email", userEmail).
		ExecuteTo(&users)

	if err != nil {
		return nil, err
	}

	if len(users) == 0 {
		return nil, fmt.Errorf("not found user with email %s", userEmail)
	}

	return &users[0], nil
}

// AddUser adds a new User to the database
//
// Returns the added User or nil and an error if it was not added
func AddUser(newUser User) (*User, error) {

	hashedPassword, err := HashPassword(newUser.Password)

	if err != nil {
		return nil, err
	}

	newUser.Password = hashedPassword

	var insertedUsers []User

	_, err = client.From("Users").
		Insert(newUser, false, "", "", "").
		ExecuteTo(&insertedUsers)

	if err != nil {
		return nil, fmt.Errorf("error inserting user:\n%w", err)
	}

	return &insertedUsers[0], nil
}

// DeleteUserByEmail deletes the User associated with the userEmail
//
// Returns true if the User was deleted, false if it could not be deleted, or an error if it occurred
func DeleteUserByEmail(userEmail string) (bool, error) {

	var deletedUsers []User

	_, err := client.From("Users").
		Delete("", "representation").
		Eq("Email", userEmail).
		ExecuteTo(&deletedUsers)

	if err != nil {
		return false, fmt.Errorf("error deleting user:\n%w", err)
	}

	if len(deletedUsers) == 0 {
		return false, fmt.Errorf("not found any user with the email %s to delete", userEmail)
	}

	return true, nil
}

// UpdateUserInfo updates 1 or more parameters from the selected User
//
// Recibes the email from the User to edit and an User with the new information
// (if any parameter is empty, it wont be edited)
//
// Returns the edited User if the info was edited or nil and an error if it could not be edited
func UpdateUserInfo(userEmail string, newUserInfo User) (*User, error) {

	newUserInfo.Email = userEmail
	if newUserInfo.Password != "" {
		hashedPassword, err := HashPassword(newUserInfo.Password)
		if err == nil {
			newUserInfo.Password = hashedPassword
		} else {
			return nil, err
		}
		newUserInfo.Password = hashedPassword
	}

	var updatedUsers []User

	_, err := client.From("Users").
		Update(newUserInfo, "", "").
		Eq("Email", userEmail).
		ExecuteTo(&updatedUsers)

	if err != nil {
		return nil, fmt.Errorf("error updating the user: %w", err)
	}

	if len(updatedUsers) == 0 {
		return nil, fmt.Errorf("not foud any user with the email %s to update", userEmail)
	}

	return &updatedUsers[0], nil
}

/*
 =========================================================
 Product functions
 =========================================================
*/

// GetProductByName returns the Product associated with the productName or an error if it occurred
func GetProductByName(productName string) (*Product, error) {

	var products []Product
	_, err := client.From("Product").
		Select("*", "exact", false).
		Eq("Name", productName).
		ExecuteTo(&products)

	if err != nil {
		return nil, err
	}

	if len(products) == 0 {
		return nil, fmt.Errorf("not found product with name %s", productName)
	}

	return &products[0], nil
}

// AddProduct adds a new Product to the database
//
// Returns the added Product or nil and an error if it was not added
func AddProduct(newProduct Product) (*Product, error) {

	var insertedProduct []Product

	_, err := client.From("Product").
		Insert(newProduct, false, "", "", "").
		ExecuteTo(&insertedProduct)

	if err != nil {
		return nil, fmt.Errorf("error inserting product:\n%w", err)
	}

	return &insertedProduct[0], nil
}

// DeleteProductByName deletes the Product associated with the productName
//
// Returns true if the Product was deleted, false y it could not be deleted or an error if it occurred
func DeleteProductByName(productName string) (bool, error) {

	var deletedProduct []Product

	_, err := client.From("Product").
		Delete("", "representation").
		Eq("Name", productName).
		ExecuteTo(&deletedProduct)

	if err != nil {
		return false, fmt.Errorf("error deleting product:\n%w", err)
	}

	if len(deletedProduct) == 0 {
		return false, fmt.Errorf("not foud any product with the name %s to delete", productName)
	}

	return true, nil
}

// UpdateProductInfo updates 1 or more parameters from the selected Product
//
// Recibes the name from the Product to edit and a Product with the new information
// (if any parameter is empty, it wont be edited)
//
// Returns the edited Product if the info was edited or nil and an error if it could not be edited
func UpdateProductInfo(productName string, newProductInfo Product) (*Product, error) {

	var updatedProducts []Product

	_, err := client.From("Product").
		Update(newProductInfo, "", "").
		Eq("Name", productName).
		ExecuteTo(&updatedProducts)

	if err != nil {
		return nil, fmt.Errorf("error updating the product: %w", err)
	}

	if len(updatedProducts) == 0 {
		return nil, fmt.Errorf("not foud any product with the Name %s to update", productName)
	}

	return &updatedProducts[0], nil
}

/*
 =========================================================
 Review functions
 =========================================================
*/

// GetReviewByName returns the Review associated with the reviewName or an error if it occurred
func GetReviewByName(reviewName string) (*Review, error) {
	var reviews []Review

	_, err := client.From("Review").
		Select("*", "exact", false).
		Eq("Name", reviewName).
		ExecuteTo(&reviews)

	if err != nil {
		return nil, err
	}

	if len(reviews) == 0 {
		return nil, fmt.Errorf("not found review with name %s", reviewName)
	}

	return &reviews[0], nil
}

// AddReview adds a new Review to the database
//
// Returns the added Review or nil and an error if it was not added
func AddReview(newReview Review) (*Review, error) {

	var insertedReview []Review

	_, err := client.From("Review").
		Insert(newReview, false, "", "", "").
		ExecuteTo(&insertedReview)

	if err != nil {
		return nil, fmt.Errorf("error inserting review:\n%w", err)
	}

	return &insertedReview[0], nil
}

// DeleteReviewByName deletes the Review associated with the reviewName
//
// Returns true if the Review was deleted, false y it could not be deleted or an error if it occurred
func DeleteReviewByName(reviewName string) (bool, error) {

	var deletedReview []Review

	_, err := client.From("Review").
		Delete("", "representation").
		Eq("Name", reviewName).
		ExecuteTo(&deletedReview)

	if err != nil {
		return false, fmt.Errorf("error deleting review:\n%w", err)
	}

	if len(deletedReview) == 0 {
		return false, fmt.Errorf("not foud any review with the name %s to delete", reviewName)
	}

	return true, nil
}

// GetReviewsByUserEmail gets an array of Review associated to a User
//
// Return an array of Review or an error if occurred
func GetReviewsByUserEmail(userEmail string) ([]Review, error) {
	user, err := GetUserByEmail(userEmail)
	if err != nil {
		return nil, err
	}

	var reviews []Review

	_, err = client.From("Review").
		Select("*", "exact", false).
		Eq("UserId", fmt.Sprintf("%d", user.Id)).
		ExecuteTo(&reviews)

	if err != nil {
		return nil, fmt.Errorf("error getting reviews from the bd: %w", err)
	}

	return reviews, nil
}

// GetReviewsByProductName gets an array of Review associated to Product
//
// Return an array of Review or an error if occurred
func GetReviewsByProductName(productName string) ([]Review, error) {
	product, err := GetProductByName(productName)
	if err != nil {
		return nil, err
	}

	var reviews []Review

	_, err = client.From("Review").
		Select("*", "exact", false).
		Eq("ProductId", fmt.Sprintf("%d", product.Id)).
		ExecuteTo(&reviews)

	if err != nil {
		return nil, fmt.Errorf("error getting reviews from the bd: %w", err)
	}

	return reviews, nil
}

/*
 =========================================================
 Hash functions
 =========================================================
*/

// HashPassword receives the plain password and returns the hash
func HashPassword(password string) (string, error) {
	if password == "" {
		return password, nil
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(hash), nil
}

// VerifyPassword compares a plain password with the hashed password
func VerifyPassword(plainPassword, hashedPassword string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(plainPassword))
	return err == nil
}
