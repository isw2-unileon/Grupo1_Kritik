package bd

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log/slog"
	"os"
	"strconv"
	"strings"
	"time"

	"cloud.google.com/go/civil"
	"github.com/bytedance/gopkg/util/logger"
	"github.com/joho/godotenv"
	"github.com/supabase-community/postgrest-go"
	storage_go "github.com/supabase-community/storage-go"
	"github.com/supabase-community/supabase-go"
	"golang.org/x/crypto/bcrypt"
)

// Comment for lint

// Defined structs:

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
	IsAdmin  bool        `json:"IsAdmin,omitempty"`
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

	ProductID   int    `json:"ProductId,omitempty"`
	UserID      int    `json:"UserId,omitempty"`
	ProductName string `json:"ProductName,omitempty"`
	UserName    string `json:"UserName,omitempty"`
	UserImage   string `json:"UserImage,omitempty"`
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
	GetUsersByUserName(userName string) ([]User, error)
	AddUser(newUser User) (*User, error)
	DeleteUserByEmail(userEmail string) (bool, error)
	UpdateUserInfo(userEmail string, newUserInfo User) (*User, error)
	UpdateUserImage(userID int, imageURL string) (*User, error)
	UploadAvatar(userID int, fileBytes []byte, ext string, contentType string) (string, error)
	DeleteAvatar(userID int) error

	GetProductsByName(productName string) ([]Product, error)
	GetProductByID(productID int) (*Product, error)
	GetRandomProducts(limit int) ([]Product, error)
	GetProductsFilter(typeFilter string, genreFilter []string, limit int) ([]Product, error)
	AddProduct(newProduct Product) (*Product, error)
	DeleteProductByName(productName string) (bool, error)
	UpdateProductInfo(productName string, newProductInfo Product) (*Product, error)
	DeleteProductByID(productID int) (bool, error)
	UpdateProductByID(productID int, newProductInfo Product) (*Product, error)
	GetAllProducts() ([]Product, error)
	GetTopRated(limit int) ([]Product, error)
	GetWorstRated(limit int) ([]Product, error)
	UploadProductImage(productID int, fileBytes []byte, ext string, contentType string) (string, error)
	DeleteProductImage(productID int) error

	GetReviewByID(reviewID int) (*Review, error)
	GetReviewsByUserID(userID int) ([]Review, error)
	GetReviewsByProductID(productID int) ([]Review, error)
	AddReview(newReview Review) (*Review, error)
	DeleteReviewByID(reviewID int) (bool, error)
	UpdateReviewInfo(reviewID int, newReviewInfo Review) (*Review, error)

	GetAllFans(influencerID int) ([]User, error)
	GetAllInfluencers(fanID int) ([]User, error)
	FollowSomeone(newRelation FollowerRelation) (*FollowerRelation, error)
	UnfollowSomeone(fanID int, influencerID int) (bool, error)

	GetRecommendations(userID int, limit int) ([]Product, error)
	GetInfluencerRecommendation(userID int, limit int) ([]Product, error)
	GetInfluencerNotRecommendation(userID int, limit int) ([]Product, error)
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
		return nil, fmt.Errorf("not found user with username %s", userName)
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

// GetUsersByUserName returns users whose UserName contains the given string (case-insensitive).
func (db *SupabaseDB) GetUsersByUserName(userName string) ([]User, error) {
	var users []User
	_, err := db.client.From("Users").
		Select("*", "exact", false).
		Ilike("UserName", "*"+userName+"*").
		ExecuteTo(&users)

	if err != nil {
		return nil, err
	}

	return users, nil
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

// UpdateUserImage updates only the Image field for a given user ID.
// Returns the updated User or an error.
func (db *SupabaseDB) UpdateUserImage(userID int, imageURL string) (*User, error) {
	var updatedUsers []User
	_, err := db.client.From("Users").
		Update(map[string]string{"Image": imageURL}, "", "").
		Eq("id", strconv.Itoa(userID)).
		ExecuteTo(&updatedUsers)
	if err != nil {
		return nil, fmt.Errorf("error updating user image: %w", err)
	}
	if len(updatedUsers) == 0 {
		return nil, fmt.Errorf("user with id %d not found", userID)
	}
	return &updatedUsers[0], nil
}

// UploadAvatar uploads a user's avatar file to Supabase Storage, deletes the
// old one if present, updates the Image column in the DB, and returns the
// public URL.
func (db *SupabaseDB) UploadAvatar(userID int, fileBytes []byte, ext string, contentType string) (string, error) {
	user, err := db.GetUserByID(userID)
	if err != nil {
		return "", fmt.Errorf("failed to get user: %w", err)
	}

	if user.Image != "" {
		oldPath := extractStoragePath("avatars", user.Image)
		if oldPath != "" {
			_, _ = db.client.Storage.RemoveFile("avatars", []string{oldPath})
		}
	}

	fileName := fmt.Sprintf("%d_%d%s", userID, time.Now().UnixNano(), ext)
	_, err = db.client.Storage.UploadFile("avatars", fileName, bytes.NewReader(fileBytes), storage_go.FileOptions{
		ContentType: &contentType,
	})
	if err != nil {
		return "", fmt.Errorf("failed to upload avatar: %w", err)
	}

	publicURL := db.client.Storage.GetPublicUrl("avatars", fileName).SignedURL

	_, err = db.UpdateUserImage(userID, publicURL)
	if err != nil {
		return "", err
	}

	return publicURL, nil
}

// DeleteAvatar removes the user's avatar from Storage and clears the Image
// column in the DB. If the user has no avatar, it's a no-op.
func (db *SupabaseDB) DeleteAvatar(userID int) error {
	user, err := db.GetUserByID(userID)
	if err != nil {
		return fmt.Errorf("failed to get user: %w", err)
	}

	if user.Image != "" {
		oldPath := extractStoragePath("avatars", user.Image)
		if oldPath != "" {
			_, _ = db.client.Storage.RemoveFile("avatars", []string{oldPath})
		}
	}

	_, err = db.UpdateUserImage(userID, "")
	if err != nil {
		return fmt.Errorf("failed to clear image: %w", err)
	}
	return nil
}

// extractStoragePath extracts the relative file path from a Supabase Storage
// public URL for the given bucket. Returns empty string if the URL does not
// match the expected pattern (so we don't try to delete external URLs).
func extractStoragePath(bucket, imageURL string) string {
	marker := "/" + bucket + "/"
	if idx := strings.Index(imageURL, marker); idx >= 0 {
		return imageURL[idx+len(marker):]
	}
	return ""
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
		Ilike("Name", "*"+productName+"*"). // antes: Eq("Name", productName).
		ExecuteTo(&products)

	if err != nil {
		return nil, err
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

// GetProductsFilter returns random products filtered by type and genres
func (db *SupabaseDB) GetProductsFilter(typeFilter string, genreFilter []string, limit int) ([]Product, error) {

	var finalType interface{} = typeFilter
	if typeFilter == "" {
		finalType = nil
	}

	finalGenres := genreFilter
	if finalGenres == nil {
		finalGenres = []string{}
	}

	body := db.client.Rpc("get_random_products_advanced", "exact", map[string]interface{}{
		"lim":          limit,
		"type_filter":  finalType,
		"genre_filter": finalGenres,
	})

	if body == "" {
		return nil, fmt.Errorf("error getting filtered products: empty response")
	}

	var products []Product
	if err := json.Unmarshal([]byte(body), &products); err != nil {
		return nil, fmt.Errorf("error getting random products: %s", body)
	}

	return products, nil
}

// GetRandomProducts returns random products limited by the limit parameter
func (db *SupabaseDB) GetRandomProducts(limit int) ([]Product, error) {
	body := db.client.Rpc("get_random_products", "exact", map[string]interface{}{
		"lim": limit,
	})

	if body == "" {
		return nil, fmt.Errorf("error getting random products: empty response")
	}

	var products []Product
	if err := json.Unmarshal([]byte(body), &products); err != nil {
		return nil, fmt.Errorf("error getting random products: %s", body)
	}

	return products, nil
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

// GetAllProducts returns all products from the database
func (db *SupabaseDB) GetAllProducts() ([]Product, error) {
	var products []Product
	_, err := db.client.From("Product").
		Select("*", "exact", false).
		ExecuteTo(&products)

	if err != nil {
		return nil, fmt.Errorf("error getting all products: %w", err)
	}

	return products, nil
}

// GetTopRated returns the top N products ordered by AverageGrade descending
func (db *SupabaseDB) GetTopRated(limit int) ([]Product, error) {
	var products []Product
	_, err := db.client.From("Product").
		Select("*", "exact", false).
		Order("AverageGrade", &postgrest.OrderOpts{Ascending: false}).
		Limit(limit, "").
		ExecuteTo(&products)

	if err != nil {
		return nil, fmt.Errorf("error getting top rated products: %w", err)
	}

	return products, nil
}

// GetWorstRated returns the bottom N products ordered by AverageGrade ascending
func (db *SupabaseDB) GetWorstRated(limit int) ([]Product, error) {
	var products []Product
	_, err := db.client.From("Product").
		Select("*", "exact", false).
		Order("AverageGrade", &postgrest.OrderOpts{Ascending: true}).
		Limit(limit, "").
		ExecuteTo(&products)

	if err != nil {
		return nil, fmt.Errorf("error getting worst rated products: %w", err)
	}

	return products, nil
}

// DeleteProductByID deletes the Product associated with the given ID
func (db *SupabaseDB) DeleteProductByID(productID int) (bool, error) {
	var deletedProduct []Product

	_, err := db.client.From("Product").
		Delete("", "representation").
		Eq("id", strconv.Itoa(productID)).
		ExecuteTo(&deletedProduct)

	if err != nil {
		return false, fmt.Errorf("error deleting product:\n%w", err)
	}

	if len(deletedProduct) == 0 {
		return false, fmt.Errorf("not found any product with id %d to delete", productID)
	}

	return true, nil
}

// UpdateProductByID updates 1 or more parameters of the Product identified by its ID
func (db *SupabaseDB) UpdateProductByID(productID int, newProductInfo Product) (*Product, error) {
	var updatedProducts []Product

	_, err := db.client.From("Product").
		Update(newProductInfo, "", "").
		Eq("id", strconv.Itoa(productID)).
		ExecuteTo(&updatedProducts)

	if err != nil {
		return nil, fmt.Errorf("error updating the product: %w", err)
	}

	if len(updatedProducts) == 0 {
		return nil, fmt.Errorf("not found any product with id %d to update", productID)
	}

	return &updatedProducts[0], nil
}

// UploadProductImage uploads a product image file to Supabase Storage, deletes
// the old one if present, updates the Image column in the DB, and returns the
// public URL.
func (db *SupabaseDB) UploadProductImage(productID int, fileBytes []byte, ext string, contentType string) (string, error) {
	product, err := db.GetProductByID(productID)
	if err != nil {
		return "", fmt.Errorf("failed to get product: %w", err)
	}

	if product.Image != "" {
		oldPath := extractStoragePath("products", product.Image)
		if oldPath != "" {
			_, _ = db.client.Storage.RemoveFile("products", []string{oldPath})
		}
	}

	fileName := fmt.Sprintf("product_%d_%d%s", productID, time.Now().UnixNano(), ext)
	_, err = db.client.Storage.UploadFile("products", fileName, bytes.NewReader(fileBytes), storage_go.FileOptions{
		ContentType: &contentType,
	})
	if err != nil {
		return "", fmt.Errorf("failed to upload product image: %w", err)
	}

	publicURL := db.client.Storage.GetPublicUrl("products", fileName).SignedURL

	updated := *product
	updated.Image = publicURL
	_, err = db.UpdateProductByID(productID, updated)
	if err != nil {
		return "", err
	}

	return publicURL, nil
}

// DeleteProductImage removes the product image from Storage and clears the
// Image column in the DB. If the product has no image, it's a no-op.
func (db *SupabaseDB) DeleteProductImage(productID int) error {
	product, err := db.GetProductByID(productID)
	if err != nil {
		return fmt.Errorf("failed to get product: %w", err)
	}

	if product.Image != "" {
		oldPath := extractStoragePath("products", product.Image)
		if oldPath != "" {
			_, _ = db.client.Storage.RemoveFile("products", []string{oldPath})
		}
	}

	_, err = db.client.From("Product").
		Update(map[string]interface{}{"Image": nil}, "", "").
		Eq("id", strconv.Itoa(productID)).
		ExecuteTo(nil)
	if err != nil {
		return fmt.Errorf("failed to clear product image: %w", err)
	}

	return nil
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
		Eq("ProductId", fmt.Sprintf("%d", product.ID)).
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

// UpdateReviewInfo updates 1 or more parameters from the selected Review
//
// Recibes the id from the Review to edit and a Review with the new information
// (if any parameter is empty, it wont be edited)
//
// Returns the edited Review if the info was edited or nil and an error if it could not be edited
func (db *SupabaseDB) UpdateReviewInfo(reviewID int, newReviewInfo Review) (*Review, error) {
	var updatedReviews []Review

	_, err := db.client.From("Review").
		Update(newReviewInfo, "", "").
		Eq("id", strconv.Itoa(reviewID)).
		ExecuteTo(&updatedReviews)

	if err != nil {
		return nil, fmt.Errorf("error updating the review: %w", err)
	}

	if len(updatedReviews) == 0 {
		return nil, fmt.Errorf("not foud any product with the id %d to update", reviewID)
	}

	return &updatedReviews[0], nil
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
		Select("*", "exact", false).
		Eq("Influencer", fmt.Sprintf("%d", influencerID)).
		ExecuteTo(&relations)

	if err != nil {
		return nil, err
	}

	followedUsers := []User{}
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
		Select("*", "exact", false).
		Eq("Fan", fmt.Sprintf("%d", fanID)).
		ExecuteTo(&relations)

	if err != nil {
		return nil, err
	}

	followedUsers := []User{}
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
 Recommender functions
 =========================================================
*/

// GetRecommendations returns recommended products based of user and user friends likes
// userID is the id of the user and limit is the number of products to recommend
//
//nolint:dupl
func (db *SupabaseDB) GetRecommendations(userID int, limit int) ([]Product, error) {
	_, err := db.GetUserByID(userID)
	if err != nil {
		return nil, err
	}

	body := db.client.Rpc("get_recommended_products", "exact", map[string]interface{}{
		"user_id_param": userID,
		"lim":           limit,
	})

	if body == "" {
		return nil, fmt.Errorf("error getting recommendations: empty response")
	}

	var products []Product
	if err := json.Unmarshal([]byte(body), &products); err != nil {
		return nil, fmt.Errorf("error getting recommendations: %s", body)
	}

	return products, nil
}

// GetInfluencerRecommendation returns recommended products based of user friends likes
// userID is the id of the user and limit is the number of products to recommend
//
//nolint:dupl
func (db *SupabaseDB) GetInfluencerRecommendation(userID int, limit int) ([]Product, error) {
	_, err := db.GetUserByID(userID)
	if err != nil {
		return nil, err
	}

	body := db.client.Rpc("get_influencer_recommended_products", "exact", map[string]interface{}{
		"user_id_param": userID,
		"lim":           limit,
	})

	if body == "" {
		return nil, fmt.Errorf("error getting recommendations: empty response")
	}

	var products []Product
	if err := json.Unmarshal([]byte(body), &products); err != nil {
		return nil, fmt.Errorf("error getting recommendations: %s", body)
	}

	return products, nil
}

// GetInfluencerNotRecommendation returns recommended products based of user friends dislikes
// userID is the id of the user and limit is the number of products to recommend
//
//nolint:dupl
func (db *SupabaseDB) GetInfluencerNotRecommendation(userID int, limit int) ([]Product, error) {
	_, err := db.GetUserByID(userID)
	if err != nil {
		return nil, err
	}

	body := db.client.Rpc("get_influencer_not_recommended_products", "exact", map[string]interface{}{
		"user_id_param": userID,
		"lim":           limit,
	})

	if body == "" {
		return nil, fmt.Errorf("error getting recommendations: empty response")
	}

	var products []Product
	if err := json.Unmarshal([]byte(body), &products); err != nil {
		return nil, fmt.Errorf("error getting recommendations: %s", body)
	}

	return products, nil
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
