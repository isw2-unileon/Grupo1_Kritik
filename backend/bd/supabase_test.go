package bd

import (
	"fmt"
	"testing"
)

// GET USER
func TestGetUserByID(t *testing.T) {
	user, err := GetUserByID("14")

	if err != nil {
		t.Error(err)
	}

	if user == nil {
		t.Errorf("User is nil")
	}
}

func TestGetUserByIDNotFound(t *testing.T) {
	user, err := GetUserByID("0")

	if err == nil {
		t.Errorf("Expected error")
	}

	if user != nil {
		t.Errorf("User should be nil")
	}
}

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

func TestAddUserAlreadyExists(t *testing.T) {
	newUser := User{
		Email:    "testuser@gmail.com",
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
func TestDeleteUserByID(t *testing.T) {
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

	isDeleted, err := DeleteUserByID(fmt.Sprintf("%d", addedUser.ID))

	if err != nil {
		t.Error(err)
	}

	if !isDeleted {
		t.Errorf("Function returned false")
	}
}

func TestDeleteUserByIDError(t *testing.T) {
	isDeleted, err := DeleteUserByID("0")

	if err == nil {
		t.Error(err)
	}

	if isDeleted {
		t.Errorf("Function returned true")
	}
}

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

func TestUpdateUserInfo(t *testing.T) {

}
