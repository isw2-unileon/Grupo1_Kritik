package bd

import (
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	"github.com/supabase-community/supabase-go"
	"golang.org/x/crypto/bcrypt"
)

// User struct
type User struct {
	Email    string `json:"Email,omitempty"`
	Name     string `json:"Name,omitempty"`
	Password string `json:"Password,omitempty"`
}

// Content struct
type Content struct {
	Name        string `json:"Name,omitempty"`
	Type        string `json:"Type,omitempty"`
	Grade       int    `json:"Grade,omitempty"`
	Description string `json:"Description,omitempty"`
}

var client *supabase.Client

func init() {
	if err := godotenv.Load(); err != nil {
		if err = godotenv.Load("../../.env"); err != nil {
			log.Fatal("Error al cargar el archivo .env:\n", err)
		}
	}

	url := os.Getenv("SUPABASE_URL")
	key := os.Getenv("SUPABASE_KEY")

	var errClient error
	client, errClient = supabase.NewClient(url, key, &supabase.ClientOptions{})

	if errClient != nil {
		log.Fatalf("Error al crear cliente: %v", errClient)
	}
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

	hasedPassword, err := HashPassword(newUser.Password)

	if err != nil {
		return nil, err
	}

	newUser.Password = hasedPassword

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
// Returns true if the User was deleted, false y it could not be deleted or an error if it occurred
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
		return false, fmt.Errorf("not foud any user with the email %s to delete", userEmail)
	}

	return true, nil
}

// UpdateUserInfo updates 1 or more parameters from the selected User
//
// Recibes the email from the user to edit and an User with the new information
// (if any parameter is empty, it wont be edited)
//
// Returns the edited User if the info was edited or nil and an error if it could not be edited
func UpdateUserInfo(userEmail string, newUserInfo User) (*User, error) {

	newUserInfo.Email = userEmail
	if newUserInfo.Password != "" {
		hasedPassword, err := HashPassword(newUserInfo.Password)
		if err == nil {
			newUserInfo.Password = hasedPassword
		} else {
			return nil, err
		}
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
 Content functions
 =========================================================
*/

// GetContentByName returns the Content associated with the contentName or an error if it occurred
func GetContentByName(contentName string) (*Content, error) {

	var contents []Content
	_, err := client.From("Content").
		Select("*", "exact", false).
		Eq("Name", contentName).
		ExecuteTo(&contents)

	if err != nil {
		return nil, err
	}

	if len(contents) == 0 {
		return nil, fmt.Errorf("not found content with name %s", contentName)
	}

	return &contents[0], nil
}

// AddContent adds a new Content to the database
//
// Returns the added Content or nil and an error if it was not added
func AddContent(newContent Content) (*Content, error) {

	var insertedContent []Content

	_, err := client.From("Content").
		Insert(newContent, false, "", "", "").
		ExecuteTo(&insertedContent)

	if err != nil {
		return nil, fmt.Errorf("error inserting content:\n%w", err)
	}

	return &insertedContent[0], nil
}

// DeleteContentByName deletes the Content associated with the contentName
//
// Returns true if the Content was deleted, false y it could not be deleted or an error if it occurred
func DeleteContentByName(contentName string) (bool, error) {

	var deletedContent []Content

	_, err := client.From("Content").
		Delete("", "representation").
		Eq("Name", contentName).
		ExecuteTo(&deletedContent)

	if err != nil {
		return false, fmt.Errorf("error deleting content:\n%w", err)
	}

	if len(deletedContent) == 0 {
		return false, fmt.Errorf("not foud any content with the name %s to delete", contentName)
	}

	return true, nil
}

// UpdateContentInfo updates 1 or more parameters from the selected Content
//
// Recibes the name from the content to edit and a Content with the new information
// (if any parameter is empty, it wont be edited)
//
// Returns the edited Content if the info was edited or nil and an error if it could not be edited
func UpdateContentInfo(contentName string, newContentInfo Content) (*Content, error) {

	var updatedContents []Content

	_, err := client.From("Content").
		Update(newContentInfo, "", "").
		Eq("Name", contentName).
		ExecuteTo(&updatedContents)

	if err != nil {
		return nil, fmt.Errorf("error updating the content: %w", err)
	}

	if len(updatedContents) == 0 {
		return nil, fmt.Errorf("not foud any content with the Name %s to update", contentName)
	}

	return &updatedContents[0], nil
}

/*
 =========================================================
 Hash functions
 =========================================================
*/

// HashPassword recibes the plain password and return the hash
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

// VerifyPassword compares a plain password with the hassed password
func VerifyPassword(plainPassword, hashedPassword string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(plainPassword))
	return err == nil
}
