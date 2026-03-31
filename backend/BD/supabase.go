package BD

import (
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	"github.com/supabase-community/supabase-go"
)

type User struct {
	ID       int    `json:"id,omitempty"`
	Email    string `json:"Email"`
	Name     string `json:"Name"`
	Password string `json:"Password"`
}

type Content struct {
	ID    int    `json:"id,omitempty"`
	Name  string `json:"Name"`
	Type  string `json:"Type"`
	Grade int    `json:"Grade"`
}

var client *supabase.Client

func InitialiseBD() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error al cargar el archivo .env")
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
 ======================
 User functions
 ======================
*/

// GetUserByID returns the User associated with the userID or an error if it occurred
func GetUserByID(userID string) (*User, error) {
	if client == nil {
		InitialiseBD()
	}

	var users []User
	_, err := client.From("Users").Select("*", "exact", false).Eq("id", userID).ExecuteTo(&users)

	if err != nil {
		return nil, err
	}

	if len(users) == 0 {
		return nil, fmt.Errorf("not found user with ID %s", userID)
	}

	return &users[0], nil
}

// GetUserByEmail returns the User associated with the userEmail or an error if it occurred
func GetUserByEmail(userEmail string) (*User, error) {
	if client == nil {
		InitialiseBD()
	}

	var users []User
	_, err := client.From("Users").Select("*", "exact", false).Eq("Email", userEmail).ExecuteTo(&users)

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
// Returns true if the User was added or false and an error if it was not added
func AddUser(newUser User) (bool, error) {
	if client == nil {
		InitialiseBD()
	}

	//TODO: queda hasear la contraseña

	var insertedUsers []User

	_, err := client.From("Users").Insert(newUser, false, "", "", "").ExecuteTo(&insertedUsers)

	if err != nil {
		return false, fmt.Errorf("error inserting user:\n%w", err)
	}

	return true, nil
}

// DeleteUserByID deletes the User associated with the userID
//
// Returns true if the User was deleted, false y it could not be deleted or an error if it occurred
func DeleteUserByID(userID string) (bool, error) {
	if client == nil {
		InitialiseBD()
	}

	var deletedUsers []User

	_, err := client.From("Users").Delete("exact", "").Eq("id", userID).ExecuteTo(&deletedUsers)

	if err != nil {
		return false, fmt.Errorf("error deleting user:\n%w", err)
	}

	if len(deletedUsers) == 0 {
		return false, fmt.Errorf("not foud any user with the ID %s to delete", userID)
	}

	return true, nil
}

// DeleteUserByEmail deletes the User associated with the userEmail
//
// Returns true if the User was deleted, false y it could not be deleted or an error if it occurred
func DeleteUserByEmail(userEmail string) (bool, error) {
	if client == nil {
		InitialiseBD()
	}

	var deletedUsers []User

	_, err := client.From("Users").Delete("exact", "").Eq("Email", userEmail).ExecuteTo(&deletedUsers)

	if err != nil {
		return false, fmt.Errorf("error deleting user:\n%w", err)
	}

	if len(deletedUsers) == 0 {
		return false, fmt.Errorf("not foud any user with the email %s to delete", userEmail)
	}

	return true, nil
}

/*
 ======================
 Content functions
 ======================
*/

// GetContentByID returns the Content associated with the contentID or an error if it occurred
func GetContentByID(contentID string) (*Content, error) {
	if client == nil {
		InitialiseBD()
	}

	var contents []Content
	_, err := client.From("Content").Select("*", "exact", false).Eq("id", contentID).ExecuteTo(&contents)

	if err != nil {
		return nil, err
	}

	if len(contents) == 0 {
		return nil, fmt.Errorf("not found content with ID %s", contentID)
	}

	return &contents[0], nil
}

// GetContentByName returns the Content associated with the contentName or an error if it occurred
func GetContentByName(contentName string) (*Content, error) {
	if client == nil {
		InitialiseBD()
	}

	var contents []Content
	_, err := client.From("Content").Select("*", "exact", false).Eq("Name", contentName).ExecuteTo(&contents)

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
// Returns true if the Content was added or false and an error if it was not added
func AddContent(newContent Content) (bool, error) {
	if client == nil {
		InitialiseBD()
	}

	var insertedContent []Content

	_, err := client.From("Content").Insert(newContent, false, "", "", "").ExecuteTo(&insertedContent)

	if err != nil {
		return false, fmt.Errorf("error inserting content:\n%w", err)
	}

	return true, nil
}

// DeleteContentByID deletes the Content associated with the contentID
//
// Returns true if the Content was deleted, false y it could not be deleted or an error if it occurred
func DeleteContentByID(contentID string) (bool, error) {
	if client == nil {
		InitialiseBD()
	}

	var deletedContents []Content

	_, err := client.From("Content").Delete("exact", "").Eq("id", contentID).ExecuteTo(&deletedContents)

	if err != nil {
		return false, fmt.Errorf("error deleting content:\n%w", err)
	}

	if len(deletedContents) == 0 {
		return false, fmt.Errorf("not foud any content with the ID %s to delete", contentID)
	}

	return true, nil
}

// DeleteContentByName deletes the Content associated with the contentName
//
// Returns true if the Content was deleted, false y it could not be deleted or an error if it occurred
func DeleteContentByName(contentName string) (bool, error) {
	if client == nil {
		InitialiseBD()
	}

	var deletedContent []Content

	_, err := client.From("Content").Delete("exact", "").Eq("Email", contentName).ExecuteTo(&deletedContent)

	if err != nil {
		return false, fmt.Errorf("error deleting content:\n%w", err)
	}

	if len(deletedContent) == 0 {
		return false, fmt.Errorf("not foud any content with the name %s to delete", contentName)
	}

	return true, nil
}
