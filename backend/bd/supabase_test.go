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
		Email:    "testuser2@gmail.com",
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
		Name:     "testuser2",
		Password: "testpassword2",
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
 Product functions
 =========================================================
*/

// GET PRODUCT
func TestGetProductByName(t *testing.T) {
	product, err := GetProductByName("testproduct")

	if err != nil {
		t.Error(err)
	}

	if product == nil {
		t.Errorf("Product is nil")
	}
}

func TestGetProductByNameNotFound(t *testing.T) {
	product, err := GetProductByName("0")

	if err == nil {
		t.Errorf("Expected error")
	}

	if product != nil {
		t.Errorf("Product should be nil")
	}
}

// ADD PRODUCT
func TestAddProduct(t *testing.T) {
	newProduct := Product{
		Name:         "testproduct2",
		Type:         "Film",
		AverageGrade: 10,
	}

	addedProduct, err := AddProduct(newProduct)

	if err != nil {
		t.Error(err)
	}

	if addedProduct == nil {
		t.Errorf("Added product is nil")
	}
}

func TestAddProductMissingData(t *testing.T) {
	newProduct := Product{
		Type:         "Film",
		AverageGrade: 10,
	}

	addedProduct, err := AddProduct(newProduct)

	if err == nil {
		t.Errorf("An error was espected")
	}

	if addedProduct != nil {
		t.Errorf("Added product should be nil")
	}
}

// DELETE PRODUCT
func TestDeleteProductByName(t *testing.T) {
	productToDelete := Product{
		Name:         "producttodelete",
		Type:         "Series",
		AverageGrade: 5,
	}

	addedProduct, err := AddProduct(productToDelete)

	if err != nil {
		t.Errorf("Could not add product to delete")
	}

	if addedProduct == nil {
		t.Errorf("Added product is nil")
		return
	}

	isDeleted, err := DeleteProductByName(addedProduct.Name)

	if err != nil {
		t.Error(err)
	}

	if !isDeleted {
		t.Errorf("Function returned false")
	}
}

func TestDeleteProductByNameError(t *testing.T) {
	isDeleted, err := DeleteProductByName("0")

	if err == nil {
		t.Error(err)
	}

	if isDeleted {
		t.Errorf("Function returned true")
	}
}

// UPDATE PRODUCT
func TestUpdateProductInfo(t *testing.T) {
	newProductInfo := Product{
		Type: "Series",
	}

	updatedProduct, err := UpdateProductInfo("testproduct", newProductInfo)

	if err != nil {
		t.Error(err)
	}

	if updatedProduct == nil {
		t.Errorf("Updated product is nil")
	}
}

func TestUpdateProductInfoError(t *testing.T) {
	nenProductInfo := Product{
		Name: "testproduct2",
	}

	updatedProduct, err := UpdateProductInfo("dhfdskhjdfsj", nenProductInfo) // Product not in BD

	if err == nil {
		t.Error("An error was expected")
	}

	if updatedProduct != nil {
		t.Errorf("Updated product should be nil")
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
