package bd

import (
	"testing"
)

/*
 =========================================================
 User functions
 =========================================================
*/

// GET USER
func TestGetUserByEmail(t *testing.T) {
	user, err := GetUserByEmail("testuser@gmail.com")

	if err != nil {
		t.Error(err)
	}

	if user == nil {
		t.Errorf("User is nil")
	}
}

func TestGetUserByEmailNotFound(t *testing.T) {
	user, err := GetUserByEmail("0")

	if err == nil {
		t.Errorf("Expected error")
	}

	if user != nil {
		t.Errorf("User should be nil")
	}
}

// ADD USER
func TestAddUser(t *testing.T) {
	newUser := User{
		Email:    "testuser@gmail.com",
		Name:     "testuser",
		Password: "testpassword",
	}

	addedUser, err := AddUser(newUser)

	if err != nil {
		t.Error(err)
	}

	if addedUser == nil {
		t.Errorf("Added user is nil")
	}
}

func TestAddUserMissingData(t *testing.T) {
	newUser := User{
		Email:    "testuser2@gmail.com",
		Password: "testpassword",
	}

	addedUser, err := AddUser(newUser)

	if err == nil {
		t.Errorf("An error was espected")
	}

	if addedUser != nil {
		t.Errorf("Added user should be nil")
	}
}

// DELETE USER
func TestDeleteUserByEmail(t *testing.T) {
	userToDelete := User{
		Email:    "usertodelete@gmail.com",
		Name:     "usertodelete",
		Password: "testpassword",
	}

	addedUser, err := AddUser(userToDelete)

	if err != nil {
		t.Errorf("Could not add user to delete")
	}

	if addedUser == nil {
		t.Errorf("Added user is nil")
		return
	}

	isDeleted, err := DeleteUserByEmail(addedUser.Email)

	if err != nil {
		t.Error(err)
	}

	if !isDeleted {
		t.Errorf("Function returned false")
	}
}

func TestDeleteUserByEmailError(t *testing.T) {
	isDeleted, err := DeleteUserByEmail("0")

	if err == nil {
		t.Error(err)
	}

	if isDeleted {
		t.Errorf("Function returned true")
	}
}

// UPDATE USER
func TestUpdateUserInfo(t *testing.T) {
	newUserInfo := User{
		Name: "testuser2",
	}

	updatedUser, err := UpdateUserInfo("testuser@gmail.com", newUserInfo)

	if err != nil {
		t.Error(err)
	}

	if updatedUser == nil {
		t.Errorf("Updated user is nil")
	}
}

func TestUpdateUserInfoError(t *testing.T) {
	newUserInfo := User{
		Name: "testuser2",
	}

	updatedUser, err := UpdateUserInfo("dhfdskhjdfsj", newUserInfo) // User not in BD

	if err == nil {
		t.Error("An error was expected")
	}

	if updatedUser != nil {
		t.Errorf("Updated user should be nil")
	}
}

/*
 =========================================================
 Content functions
 =========================================================
*/

// GET CONTENT
func TestGetContentByName(t *testing.T) {
	content, err := GetContentByName("testcontent")

	if err != nil {
		t.Error(err)
	}

	if content == nil {
		t.Errorf("Content is nil")
	}
}

func TestGetContentByNameNotFound(t *testing.T) {
	content, err := GetContentByName("0")

	if err == nil {
		t.Errorf("Expected error")
	}

	if content != nil {
		t.Errorf("Content should be nil")
	}
}

// ADD CONTENT
func TestAddContent(t *testing.T) {
	newContent := Content{
		Name:  "testcontent",
		Type:  "Film",
		Grade: 10,
	}

	addedContent, err := AddContent(newContent)

	if err != nil {
		t.Error(err)
	}

	if addedContent == nil {
		t.Errorf("Added content is nil")
	}
}

func TestAddContentMissingData(t *testing.T) {
	newContent := Content{
		Type:  "Film",
		Grade: 10,
	}

	addedContent, err := AddContent(newContent)

	if err == nil {
		t.Errorf("An error was espected")
	}

	if addedContent != nil {
		t.Errorf("Added content should be nil")
	}
}

// DELETE CONTENT
func TestDeleteContentByName(t *testing.T) {
	contentToDelete := Content{
		Name:  "contenttodelete",
		Type:  "Series",
		Grade: 5,
	}

	addedContent, err := AddContent(contentToDelete)

	if err != nil {
		t.Errorf("Could not add content to delete")
	}

	if addedContent == nil {
		t.Errorf("Added content is nil")
		return
	}

	isDeleted, err := DeleteContentByName(addedContent.Name)

	if err != nil {
		t.Error(err)
	}

	if !isDeleted {
		t.Errorf("Function returned false")
	}
}

func TestDeleteContentByNameError(t *testing.T) {
	isDeleted, err := DeleteContentByName("0")

	if err == nil {
		t.Error(err)
	}

	if isDeleted {
		t.Errorf("Function returned true")
	}
}

// UPDATE CONTENT
func TestUpdateContentInfo(t *testing.T) {
	newContentInfo := Content{
		Type: "Series",
	}

	updatedContent, err := UpdateContentInfo("testcontent", newContentInfo)

	if err != nil {
		t.Error(err)
	}

	if updatedContent == nil {
		t.Errorf("Updated content is nil")
	}
}

func TestUpdateContentInfoError(t *testing.T) {
	newContentInfo := Content{
		Name: "testcontent2",
	}

	updatedContent, err := UpdateContentInfo("dhfdskhjdfsj", newContentInfo) // Content not in BD

	if err == nil {
		t.Error("An error was expected")
	}

	if updatedContent != nil {
		t.Errorf("Updated content should be nil")
	}
}

/*
 =========================================================
 Hash functions
 =========================================================
*/

func TestHashPassword(t *testing.T) {
	password := "testpassword"

	hashedPassword, err := HashPassword(password)

	if err != nil {
		t.Error(err)
	}

	if !VerifyPassword(password, hashedPassword) {
		t.Error("Passwords do not match")
	}
}

func TestHashEmptyPassword(t *testing.T) {
	password, err := HashPassword("")

	if err != nil {
		t.Error(err)
	}

	if password != "" {
		t.Error("Password should be empty")
	}
}
