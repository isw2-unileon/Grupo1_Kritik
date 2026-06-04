package bd

import (
	"fmt"
	"log/slog"
	"os"
	"strconv"

	"cloud.google.com/go/civil"
	"github.com/bytedance/gopkg/util/logger"
	"github.com/joho/godotenv"
	"github.com/supabase-community/supabase-go"
	"golang.org/x/crypto/bcrypt"
)

// User struct
type User struct {
	ID       int         `json:"id,omitempty"`
	Email    string      `json:"Email,omitempty"`
	Name     string      `json:"Name,omitempty"`
	Surname  string      `json:"Surname,omitempty"`
	UserName string      `json:"UserName,omitempty"`
	Password string      `json:"Password,omitempty"`
	Birth    *civil.Date `json:"Birth,omitempty"`
	Image    string      `json:"Image,omitempty"`
}

// Product struct
type Product struct {
	ID           int         `json:"id,omitempty"`
	Name         string      `json:"Name,omitempty"`
	Type         string      `json:"Type,omitempty"`
	AverageGrade int         `json:"AverageGrade,omitempty"`
	Description  string      `json:"Description,omitempty"`
	Release      *civil.Date `json:"Release,omitempty"`
	Genre        []string    `json:"Genre,omitempty"`
	Image        string      `json:"Image,omitempty"`
}

// Review struct
type Review struct {
	ID          int    `json:"id,omitempty"`
	Recommended bool   `json:"Recommended"`
	Description string `json:"Description,omitempty"`

	ProductID int `json:"ProductId,omitempty"`
	UserID    int `json:"UserId,omitempty"`
}

// FollowerRelation struct
type FollowerRelation struct {
	ID         int `json:"id,omitempty"`
	Fan        int `json:"Fan,omitempty"`        // User who follows another User
	Influencer int `json:"Influencer,omitempty"` // User who is followed by another user
}

// Database interface
//
//nolint:dupl // DO NOT remove this
type Database interface {
	GetUserByEmail(userEmail string) (*User, error)
	GetUserByUserName(userName string) (*User, error)
	GetUserByID(userID int) (*User, error)
	AddUser(newUser User) (*User, error)
	DeleteUserByEmail(userEmail string) (bool, error)
	UpdateUserInfo(userEmail string, newUserInfo User) (*User, error)

	GetProductsByName(productName string) ([]Product, error)
	GetProductByID(productID int) (*Product, error)
	AddProduct(newProduct Product) (*Product, error)
	DeleteProductByName(productName string) (bool, error)
	UpdateProductInfo(productName string, newProductInfo Product) (*Product, error)

	GetReviewByID(reviewID int) (*Review, error)
	AddReview(newReview Review) (*Review, error)
	DeleteReviewByID(reviewID int) (bool, error)
	GetReviewsByUserID(userID int) ([]Review, error)
	GetReviewsByProductID(productID int) ([]Review, error)

	GetAllFans(influencerID int) ([]User, error)
	GetAllInfluencers(fanID int) ([]User, error)
	FollowSomeone(newRelation FollowerRelation) (*FollowerRelation, error)
	UnfollowSomeone(fanID int, influencerID int) (bool, error)
}

// SupabaseDB client struct
type SupabaseDB struct {
	client *supabase.Client
}

// NewSupabaseDB creates the supabase client
func NewSupabaseDB() (*SupabaseDB, error) {
	if err := godotenv.Load(); err != nil {
		if err = godotenv.Load("../../.env"); err != nil {
			slog.Warn("supabase: failed to load .env from standard paths, checking environment variables", "error", err)
		}
	}

	url := os.Getenv("SUPABASE_URL")
	key := os.Getenv("SUPABASE_KEY")

	if url == "" || key == "" {
		return nil, fmt.Errorf("supabase: SUPABASE_URL or SUPABASE_KEY not set in environment")
	}

	// Inicializamos el cliente de forma directa y limpia
	client, err := supabase.NewClient(url, key, &supabase.ClientOptions{})
	if err != nil {
		return nil, fmt.Errorf("supabase: failed to create client: %w", err)
	}

	slog.Info("supabase: client initialised successfully")
	return &SupabaseDB{client: client}, nil
}

/*
 =========================================================
 User functions
 =========================================================
*/

// GetUserByEmail returns the User associated with the userEmail or an error if it occurred
func (db *SupabaseDB) GetUserByEmail(userEmail string) (*User, error) {

	var users []User
	_, err := db.client.From("Users").
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

// GetUserByUserName returns the User associated with the username or an error if it occurred
func (db *SupabaseDB) GetUserByUserName(userName string) (*User, error) {

	var users []User
	_, err := db.client.From("Users").
		Select("*", "exact", false).
		Eq("UserName", userName).
		ExecuteTo(&users)

	if err != nil {
		return nil, err
	}

	if len(users) == 0 {
		return nil, fmt.Errorf("not found user with userName %s", userName)
	}

	return &users[0], nil
}

// GetUserByID returns the User associated with the userId or an error if it occurred
func (db *SupabaseDB) GetUserByID(userID int) (*User, error) {

	var users []User
	_, err := db.client.From("Users").
		Select("*", "exact", false).
		Eq("id", strconv.Itoa(userID)).
		ExecuteTo(&users)

	if err != nil {
		return nil, err
	}

	if len(users) == 0 {
		return nil, fmt.Errorf("not found user with id %d", userID)
	}

	return &users[0], nil
}

// AddUser adds a new User to the database
//
// Returns the added User or nil and an error if it was not added
func (db *SupabaseDB) AddUser(newUser User) (*User, error) {

	hashedPassword, err := HashPassword(newUser.Password)

	if err != nil {
		return nil, err
	}

	newUser.Password = hashedPassword

	var insertedUsers []User

	_, err = db.client.From("Users").
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
func (db *SupabaseDB) DeleteUserByEmail(userEmail string) (bool, error) {

	var deletedUsers []User

	_, err := db.client.From("Users").
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
func (db *SupabaseDB) UpdateUserInfo(userEmail string, newUserInfo User) (*User, error) {

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

	_, err := db.client.From("Users").
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

// GetProductsByName returns the Product associated with the productName or an error if it occurred
func (db *SupabaseDB) GetProductsByName(productName string) ([]Product, error) {

	var products []Product
	_, err := db.client.From("Product").
		Select("*", "exact", false).
		Eq("Name", productName).
		ExecuteTo(&products)

	if err != nil {
		return nil, err
	}

	if len(products) == 0 {
		return nil, fmt.Errorf("not found product with name %s", productName)
	}

	return products, nil
}

// GetProductByID returns the Product associated with the productID or an error if it occurred
func (db *SupabaseDB) GetProductByID(productID int) (*Product, error) {

	var products []Product
	_, err := db.client.From("Product").
		Select("*", "exact", false).
		Eq("id", strconv.Itoa(productID)).
		ExecuteTo(&products)

	if err != nil {
		return nil, err
	}

	if len(products) == 0 {
		return nil, fmt.Errorf("not found product with id %d", productID)
	}

	return &products[0], nil
}

// AddProduct adds a new Product to the database
//
// Returns the added Product or nil and an error if it was not added
func (db *SupabaseDB) AddProduct(newProduct Product) (*Product, error) {

	var insertedProduct []Product

	_, err := db.client.From("Product").
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
func (db *SupabaseDB) DeleteProductByName(productName string) (bool, error) {

	var deletedProduct []Product

	_, err := db.client.From("Product").
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
func (db *SupabaseDB) UpdateProductInfo(productName string, newProductInfo Product) (*Product, error) {

	var updatedProducts []Product

	_, err := db.client.From("Product").
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

// GetReviewByID returns the Review associated with the reviewID or an error if it occurred
func (db *SupabaseDB) GetReviewByID(reviewID int) (*Review, error) {
	var reviews []Review

	_, err := db.client.From("Review").
		Select("*", "exact", false).
		Eq("id", strconv.Itoa(reviewID)).
		ExecuteTo(&reviews)

	if err != nil {
		return nil, err
	}

	if len(reviews) == 0 {
		return nil, fmt.Errorf("not found review with id %d", reviewID)
	}

	return &reviews[0], nil
}

// GetReviewsByUserID gets an array of Review associated to an User
func (db *SupabaseDB) GetReviewsByUserID(userID int) ([]Review, error) {
	user, err := db.GetUserByID(userID)
	if err != nil {
		return nil, err
	}

	var reviews []Review

	_, err = db.client.From("Review").
		Select("*", "exact", false).
		Eq("UserId", fmt.Sprintf("%d", user.ID)).
		ExecuteTo(&reviews)

	if err != nil {
		return nil, fmt.Errorf("error getting reviews from the bd: %w", err)
	}

	return reviews, nil
}

// GetReviewsByProductID gets an array of Review associated to Product
func (db *SupabaseDB) GetReviewsByProductID(productID int) ([]Review, error) {
	product, err := db.GetProductByID(productID)
	if err != nil {
		return nil, err
	}

	var reviews []Review

	_, err = db.client.From("Review").
		Select("*", "exact", false).
		Eq("ProductID", fmt.Sprintf("%d", product.ID)).
		ExecuteTo(&reviews)

	if err != nil {
		return nil, fmt.Errorf("error getting reviews from the bd: %w", err)
	}

	return reviews, nil
}

// AddReview adds a new Review to the database
//
// Returns the added Review or nil and an error if it was not added
func (db *SupabaseDB) AddReview(newReview Review) (*Review, error) {

	var insertedReview []Review

	_, err := db.client.From("Review").
		Insert(newReview, false, "", "", "").
		ExecuteTo(&insertedReview)

	if err != nil {
		return nil, fmt.Errorf("error inserting review:\n%w", err)
	}

	return &insertedReview[0], nil
}

// DeleteReviewByID deletes the Review associated with the reviewID
//
// Returns true if the Review was deleted, false y it could not be deleted or an error if it occurred
func (db *SupabaseDB) DeleteReviewByID(reviewID int) (bool, error) {

	var deletedReview []Review

	_, err := db.client.From("Review").
		Delete("", "representation").
		Eq("id", strconv.Itoa(reviewID)).
		ExecuteTo(&deletedReview)

	if err != nil {
		return false, fmt.Errorf("error deleting review:\n%w", err)
	}

	if len(deletedReview) == 0 {
		return false, fmt.Errorf("not foud any review with the id %d to delete", reviewID)
	}

	return true, nil
}

/*
 =========================================================
 Relation functions
 =========================================================
*/

// GetAllFans returns an array of User that follows the given UserID, or an error if it occurred
//
//nolint:dupl // For some reason, lint sees this and GetAllInfluencers as duplicates
func (db *SupabaseDB) GetAllFans(influencerID int) ([]User, error) {

	var relations []FollowerRelation

	_, err := db.client.From("Followers").
		Select("Fan(*)", "exact", false).
		Eq("Influencer", fmt.Sprintf("%d", influencerID)).
		ExecuteTo(&relations)

	if err != nil {
		return nil, err
	}

	var followedUsers []User
	for _, rel := range relations {
		user, err2 := db.GetUserByID(rel.Fan)
		if err2 != nil {
			logger.Errorf("error getting the user\n")
		}

		if user != nil {
			followedUsers = append(followedUsers, *user)
		}

	}

	return followedUsers, nil
}

// GetAllInfluencers returns an array of User that are followed by the given UserID, or an error if it occurred
//
//nolint:dupl // For some reason, lint sees this and GetAllFans as duplicates
func (db *SupabaseDB) GetAllInfluencers(fanID int) ([]User, error) {
	var relations []FollowerRelation

	_, err := db.client.From("Followers").
		Select("Influencer(*)", "exact", false).
		Eq("Fan", fmt.Sprintf("%d", fanID)).
		ExecuteTo(&relations)

	if err != nil {
		return nil, err
	}

	var followedUsers []User
	for _, rel := range relations {
		user, err2 := db.GetUserByID(rel.Influencer)
		if err2 != nil {
			logger.Errorf("error getting the user\n")
		}

		if user != nil {
			followedUsers = append(followedUsers, *user)
		}
	}

	return followedUsers, nil
}

// FollowSomeone adds a follow relation between two Users
func (db *SupabaseDB) FollowSomeone(newRelation FollowerRelation) (*FollowerRelation, error) {
	var insertedRelation []FollowerRelation

	_, err := db.client.From("Followers").
		Insert(newRelation, false, "", "", "").
		ExecuteTo(&insertedRelation)

	if err != nil {
		return nil, fmt.Errorf("error inserting relation:\n%w", err)
	}

	return &insertedRelation[0], nil
}

// UnfollowSomeone deletes a follow relation between two Users using the fanID and influencerID
func (db *SupabaseDB) UnfollowSomeone(fanID int, influencerID int) (bool, error) {

	_, _, err := db.client.From("Followers").
		Delete("", "").
		Eq("Fan", fmt.Sprintf("%d", fanID)).
		Eq("Influencer", fmt.Sprintf("%d", influencerID)).
		Execute()

	if err != nil {
		return false, fmt.Errorf("error deleting relation:\n%w", err)
	}

	return true, nil
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
