package bd

import (
	"testing"

	"cloud.google.com/go/civil"
)

/*
 =========================================================
 User functions
 =========================================================
*/

// GET USER
func TestGetUserByEmail(t *testing.T) {
	testUserToGet := User{
		Email:    "testusertoget@gmail.com",
		Name:     "testuser",
		Surname:  "toget",
		UserName: "testusertoget",
		Password: "testpassword",
		Birth:    &civil.Date{Year: 2009, Month: 11, Day: 10},
	}

	_, err := AddUser(testUserToGet)
	if err != nil {
		t.Error(err)
		return
	}

	user, err := GetUserByEmail(testUserToGet.Email)

	if err != nil {
		t.Error(err)
	}

	if user == nil {
		t.Errorf("User is nil")
	}

	_, err = DeleteUserByEmail(testUserToGet.Email)
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
	testUserToAdd := User{
		Email:    "testusertoadd@gmail.com",
		Name:     "testuser",
		Surname:  "toadd",
		UserName: "testusertoadd",
		Password: "testpassword",
		Birth:    &civil.Date{Year: 2009, Month: 11, Day: 10},
	}

	addedUser, err := AddUser(testUserToAdd)

	if err != nil {
		t.Error(err)
	}

	if addedUser == nil {
		t.Errorf("Added user is nil")
	}

	_, err = DeleteUserByEmail(testUserToAdd.Email)
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

	_, err = DeleteUserByEmail(newUser.Email)
}

// DELETE USER
func TestDeleteUserByEmail(t *testing.T) {
	testUserToDelete := User{
		Email:    "testusertodelete@gmail.com",
		Name:     "testuser",
		Surname:  "todelete",
		UserName: "testusertodelete",
		Password: "testpassword",
		Birth:    &civil.Date{Year: 2009, Month: 11, Day: 10},
	}

	_, err := AddUser(testUserToDelete)
	if err != nil {
		t.Error(err)
		return
	}

	isDeleted, err := DeleteUserByEmail(testUserToDelete.Email)

	if err != nil {
		t.Error(err)
	}

	if !isDeleted {
		t.Errorf("Function returned false, should be true")
	}
}

func TestDeleteUserByEmailError(t *testing.T) {
	isDeleted, err := DeleteUserByEmail("0")

	if err == nil {
		t.Error(err)
	}

	if isDeleted {
		t.Errorf("Function returned true, should be false")
	}
}

// UPDATE USER
func TestEditUserInfo(t *testing.T) {
	testUserToEdit := User{
		Email:    "testusertoedit@gmail.com",
		Name:     "testuser",
		Surname:  "toedit",
		UserName: "testusertoedit",
		Password: "testpassword",
		Birth:    &civil.Date{Year: 2009, Month: 11, Day: 10},
	}

	_, err := AddUser(testUserToEdit)
	if err != nil {
		t.Error(err)
		return
	}

	newUserInfo := User{
		Name:     "testuser2",
		Password: "testpassword2",
	}

	updatedUser, err := UpdateUserInfo(testUserToEdit.Email, newUserInfo)

	if err != nil {
		t.Error(err)
	}

	if updatedUser == nil {
		t.Errorf("Updated user is nil")
	} else if updatedUser.Name != newUserInfo.Name {
		t.Errorf("Updated user name is different")
	}

	_, err = DeleteUserByEmail(testUserToEdit.Email)
}

func TestEditUserInfoError(t *testing.T) {
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
	testProductToGet := Product{
		Name:         "testproduct",
		Type:         "Film",
		AverageGrade: 5,
		Description:  "testdescription",
		Release:      &civil.Date{Year: 2009, Month: 11, Day: 10},
		Genre:        []string{"Drama", "Comedy"},
	}

	_, err := AddProduct(testProductToGet)
	if err != nil {
		t.Error(err)
	}

	product, err := GetProductByName(testProductToGet.Name)

	if err != nil {
		t.Error(err)
	}

	if product == nil {
		t.Errorf("Product is nil")
	}

	_, err = DeleteProductByName(testProductToGet.Name)
}

func TestGetProductByNameNotFound(t *testing.T) {
	product, err := GetProductByName("skjvnlkjhvs")

	if err == nil {
		t.Errorf("Expected error")
	}

	if product != nil {
		t.Errorf("Product should be nil")
	}
}

// ADD PRODUCT
func TestAddProduct(t *testing.T) {
	testProductToAdd := Product{
		Name:         "testproduct",
		Type:         "Film",
		AverageGrade: 5,
		Description:  "testdescription",
		Release:      &civil.Date{Year: 2009, Month: 11, Day: 10},
		Genre:        []string{"Drama", "Comedy"},
	}

	addedProduct, err := AddProduct(testProductToAdd)

	if err != nil {
		t.Error(err)
	}

	if addedProduct == nil {
		t.Errorf("Added product is nil")
	}

	_, err = DeleteProductByName(testProductToAdd.Name)
}

func TestAddProductMissingData(t *testing.T) {
	testProductToAdd := Product{
		Name:         "testproduct",
		AverageGrade: 5,
		Description:  "testdescription",
		Release:      &civil.Date{Year: 2009, Month: 11, Day: 10},
		Genre:        []string{"Drama", "Comedy"},
	}

	addedProduct, err := AddProduct(testProductToAdd)

	if err == nil {
		t.Errorf("An error was espected")
	}

	if addedProduct != nil {
		t.Errorf("Added product should be nil")
	}
}

// DELETE PRODUCT
func TestDeleteProductByName(t *testing.T) {
	testProductToDelete := Product{
		Name:         "testproduct",
		Type:         "Film",
		AverageGrade: 5,
		Description:  "testdescription",
		Release:      &civil.Date{Year: 2009, Month: 11, Day: 10},
		Genre:        []string{"Drama", "Comedy"},
	}

	_, err := AddProduct(testProductToDelete)
	if err != nil {
		t.Error(err)
	}

	isDeleted, err := DeleteProductByName(testProductToDelete.Name)

	if err != nil {
		t.Error(err)
	}

	if !isDeleted {
		t.Errorf("Function returned false")
	}
}

func TestDeleteProductByNameError(t *testing.T) {
	isDeleted, err := DeleteProductByName("dfdgfdfdgs")

	if err == nil {
		t.Error(err)
	}

	if isDeleted {
		t.Errorf("Function returned true")
	}
}

// UPDATE PRODUCT
func TestEditProductInfo(t *testing.T) {
	testProductToEdit := Product{
		Name:         "testproduct",
		Type:         "Film",
		AverageGrade: 5,
		Description:  "testdescription",
		Release:      &civil.Date{Year: 2009, Month: 11, Day: 10},
		Genre:        []string{"Drama", "Comedy"},
	}

	_, err := AddProduct(testProductToEdit)
	if err != nil {
		t.Error(err)
	}

	newProductInfo := Product{
		Type: "Series",
	}

	updatedProduct, err := UpdateProductInfo(testProductToEdit.Name, newProductInfo)

	if err != nil {
		t.Error(err)
	}

	if updatedProduct == nil {
		t.Errorf("Updated product is nil")
	} else if updatedProduct.Name != testProductToEdit.Name {
		t.Errorf("Updated product name is different")
	}

	_, err = DeleteProductByName(testProductToEdit.Name)
}

func TestEditProductInfoError(t *testing.T) {
	newProductInfo := Product{
		Name: "testproduct2",
	}

	updatedProduct, err := UpdateProductInfo("dhfdskhjdfsj", newProductInfo) // Product not in BD

	if err == nil {
		t.Error("An error was expected")
	}

	if updatedProduct != nil {
		t.Errorf("Updated product should be nil")
	}
}

/*
 =========================================================
 Review functions
 =========================================================
*/

// GET REVIEW
func TestGetReviewByName(t *testing.T) {
	review, err := GetReviewByName("testreview")

	if err != nil {
		t.Error(err)
	}

	if review == nil {
		t.Errorf("Review is nil")
	}
}

func TestGetReviewByNameNotFound(t *testing.T) {
	review, err := GetReviewByName("0")

	if err == nil {
		t.Errorf("Expected error")
	}

	if review != nil {
		t.Errorf("Review should be nil")
	}
}

// ADD REVIEW
func TestAddReview(t *testing.T) {
	testUser := User{
		Email:    "testusertoaddreview@gmail.com",
		Name:     "testuser",
		Surname:  "toaddreview",
		UserName: "testusertoaddreview",
		Password: "testpassword",
		Birth:    &civil.Date{Year: 2009, Month: 11, Day: 10},
	}

	testProduct := Product{
		Name:    "testproduct",
		Type:    "Film",
		Genre:   []string{"terror", "suspense"},
		Release: &civil.Date{Year: 2004, Month: 11, Day: 10},
	}

	user, err := AddUser(testUser)
	if err != nil {
		DeleteUserByEmail(testUser.Email)
		t.Error(err)
		return
	}
	product, err := AddProduct(testProduct)
	if err != nil {
		// No need to handle this error
		DeleteUserByEmail(testUser.Email)
		DeleteProductByName(testProduct.Name)
		t.Error(err)
		return
	}

	newReview := Review{
		Name:        "testreview2",
		Recommended: true,
		Description: "Good film",
		UserName:    user.UserName,
		ProductName: product.Name,
	}

	addedReview, err := AddReview(newReview)

	if err != nil {
		t.Error(err)
	}

	if addedReview == nil {
		t.Errorf("Added review is nil")
	}

	_, err = DeleteUserByEmail(testUser.Email)
	_, err = DeleteProductByName(testProduct.Name)
}

func TestAddReviewMissingData(t *testing.T) {
	testUser := User{
		Email:    "testusertoaddreview@gmail.com",
		Name:     "testuser",
		Surname:  "toaddreview",
		UserName: "testusertoaddreview",
		Password: "testpassword",
	}

	testProduct := Product{
		Name:  "testproduct",
		Type:  "Film",
		Genre: []string{"terror", "suspense"},
	}

	user, err := AddUser(testUser)
	if err != nil {
		t.Error(err)
		return
	}
	product, err := AddProduct(testProduct)
	if err != nil {
		// No need to handle this error
		DeleteUserByEmail(testUser.Email)
		t.Error(err)
		return
	}

	newReview := Review{
		Recommended: true,
		Description: "Good film",
		UserName:    user.UserName,
		ProductName: product.Name,
	}

	addedReview, err := AddReview(newReview)

	if err == nil {
		t.Error("Should have returned an error")
	} else {
		t.Log(err)
	}

	if addedReview != nil {
		t.Errorf("Added review should be nil, but its not")
	}

	_, err = DeleteUserByEmail(testUser.Email)
	_, err = DeleteProductByName(testProduct.Name)
}

func TestAddReviewNotMatchingUserName(t *testing.T) {
	newReview := Review{
		Name:        "testreview2",
		Recommended: true,
		Description: "Good film",
		UserName:    "ajfsjfsk",
		ProductName: "skdnldsknjv",
	}

	addedReview, err := AddReview(newReview)

	if err == nil {
		t.Error("Should have returned an error")
	} else {
		t.Log(err)
	}

	if addedReview != nil {
		t.Errorf("Added review should be nil, but its not")
	}
}

// DELETE REVIEW
func TestDeleteReviewByName(t *testing.T) {
	reviewToDelete := Review{
		Name:        "reviewtodelete",
		Recommended: true,
	}

	addedReview, err := AddReview(reviewToDelete)

	if err != nil {
		t.Errorf("Could not add review to delete")
	}

	if addedReview == nil {
		t.Errorf("Added review is nil")
		return
	}

	isDeleted, err := DeleteReviewByName(addedReview.Name)

	if err != nil {
		t.Error(err)
	}

	if !isDeleted {
		t.Errorf("Function returned false")
	}
}

func TestDeleteReviewByNameError(t *testing.T) {
	isDeleted, err := DeleteReviewByName("0")

	if err == nil {
		t.Error(err)
	}

	if isDeleted {
		t.Errorf("Function returned true")
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
