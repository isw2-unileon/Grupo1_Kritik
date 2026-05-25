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
	testUserToAdd := User{
		Email:    "testusertoadd@gmail.com",
		UserName: "testusertoadd",
		Password: "testpassword",
		Birth:    &civil.Date{Year: 2009, Month: 11, Day: 10},
	}

	addedUser, err := AddUser(testUserToAdd)

	if err == nil {
		t.Errorf("An error was espected")
	}

	if addedUser != nil {
		t.Errorf("Added user should be nil")
	}

	_, err = DeleteUserByEmail(testUserToAdd.Email)
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

	_, err = DeleteProductByName(testProductToAdd.Name)
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
	testUserToReview := User{
		Email:    "testusertoReview@gmail.com",
		Name:     "testuser",
		Surname:  "toreview",
		UserName: "testusertoreview",
		Password: "testpassword",
		Birth:    &civil.Date{Year: 2009, Month: 11, Day: 10},
	}

	testProductToReview := Product{
		Name:         "testproduct",
		Type:         "Film",
		AverageGrade: 5,
		Description:  "testdescription",
		Release:      &civil.Date{Year: 2009, Month: 11, Day: 10},
		Genre:        []string{"Drama", "Comedy"},
	}

	testUser, err := AddUser(testUserToReview)
	if err != nil {
		t.Error(err)
	}
	testProduct, err := AddProduct(testProductToReview)
	if err != nil {
		t.Error(err)
	}

	testReviewToGet := Review{
		Name:        "testreview",
		Recommended: true,
		Description: "testdescription",
		UserId:      testUser.Id,
		ProductId:   testProduct.Id,
	}
	_, err = AddReview(testReviewToGet)
	if err != nil {
		t.Error(err)
	}

	review, err := GetReviewByName(testReviewToGet.Name)

	if err != nil {
		t.Error(err)
	}

	if review == nil {
		t.Errorf("Review is nil")
	}

	_, err = DeleteReviewByName(testReviewToGet.Name)
	_, err = DeleteUserByEmail(testUserToReview.Email)
	_, err = DeleteProductByName(testProductToReview.Name)
}

func TestGetReviewByNameNotFound(t *testing.T) {
	review, err := GetReviewByName("dsgfsgffgdgfdsg")

	if err == nil {
		t.Errorf("Expected error")
	}

	if review != nil {
		t.Errorf("Review should be nil")
	}
}

// ADD REVIEW
func TestAddReview(t *testing.T) {
	testUserToReview := User{
		Email:    "testusertoReview@gmail.com",
		Name:     "testuser",
		Surname:  "toreview",
		UserName: "testusertoreview",
		Password: "testpassword",
		Birth:    &civil.Date{Year: 2009, Month: 11, Day: 10},
	}

	testProductToReview := Product{
		Name:         "testproduct",
		Type:         "Film",
		AverageGrade: 5,
		Description:  "testdescription",
		Release:      &civil.Date{Year: 2009, Month: 11, Day: 10},
		Genre:        []string{"Drama", "Comedy"},
	}

	testUser, err := AddUser(testUserToReview)
	if err != nil {
		t.Error(err)
	}
	testProduct, err := AddProduct(testProductToReview)
	if err != nil {
		t.Error(err)
	}

	testReviewToAdd := Review{
		Name:        "testreview",
		Recommended: true,
		Description: "testdescription",
		UserId:      testUser.Id,
		ProductId:   testProduct.Id,
	}

	addedReview, err := AddReview(testReviewToAdd)

	if err != nil {
		t.Error(err)
	}

	if addedReview == nil {
		t.Errorf("Added review is nil")
	}

	_, err = DeleteReviewByName(testReviewToAdd.Name)
	_, err = DeleteUserByEmail(testUserToReview.Email)
	_, err = DeleteProductByName(testProductToReview.Name)
}

func TestAddReviewMissingData(t *testing.T) {
	testReviewToAdd := Review{
		Name:        "testreview",
		Recommended: true,
		Description: "Good film",
	}

	addedReview, err := AddReview(testReviewToAdd)

	if err == nil {
		t.Error("Should have returned an error")
	}

	if addedReview != nil {
		t.Errorf("Added review should be nil, but its not")
	}

	_, err = DeleteReviewByName(testReviewToAdd.Name)
}

func TestAddReviewNotUserInBD(t *testing.T) {
	testReviewToAdd := Review{
		Name:        "testreview",
		Recommended: true,
		Description: "testdescription",
		UserId:      -1, // Non existing user
		ProductId:   -1, // Non existing product
	}

	addedReview, err := AddReview(testReviewToAdd)

	if err == nil {
		t.Error("Should have returned an error")
	}

	if addedReview != nil {
		t.Errorf("Added review should be nil, but its not")
	}

	_, err = DeleteReviewByName(testReviewToAdd.Name)
}

// DELETE REVIEW
func TestDeleteReviewByName(t *testing.T) {
	testUserToReview := User{
		Email:    "testusertoReview@gmail.com",
		Name:     "testuser",
		Surname:  "toreview",
		UserName: "testusertoreview",
		Password: "testpassword",
		Birth:    &civil.Date{Year: 2009, Month: 11, Day: 10},
	}

	testProductToReview := Product{
		Name:         "testproduct",
		Type:         "Film",
		AverageGrade: 5,
		Description:  "testdescription",
		Release:      &civil.Date{Year: 2009, Month: 11, Day: 10},
		Genre:        []string{"Drama", "Comedy"},
	}

	testUser, err := AddUser(testUserToReview)
	if err != nil {
		t.Error(err)
	}
	testProduct, err := AddProduct(testProductToReview)
	if err != nil {
		t.Error(err)
	}

	testReviewToDelete := Review{
		Name:        "testreview",
		Recommended: true,
		Description: "testdescription",
		UserId:      testUser.Id,
		ProductId:   testProduct.Id,
	}

	_, err = AddReview(testReviewToDelete)
	if err != nil {
		t.Error(err)
	}

	isDeleted, err := DeleteReviewByName(testReviewToDelete.Name)

	if err != nil {
		t.Error(err)
	}

	if !isDeleted {
		t.Errorf("Function returned false")
	}

	_, err = DeleteUserByEmail(testUserToReview.Email)
	_, err = DeleteProductByName(testProductToReview.Name)
}

func TestDeleteReviewByNameError(t *testing.T) {
	isDeleted, err := DeleteReviewByName("sdjhbkdsbf")

	if err == nil {
		t.Error(err)
	}

	if isDeleted {
		t.Errorf("Function returned true")
	}
}

func TestGetReviewsByUserEmail(t *testing.T) {
	testUserToReview := User{
		Email:    "testusertoReview@gmail.com",
		Name:     "testuser",
		Surname:  "toreview",
		UserName: "testusertoreview",
		Password: "testpassword",
		Birth:    &civil.Date{Year: 2009, Month: 11, Day: 10},
	}

	testProductToReview := Product{
		Name:         "testproduct",
		Type:         "Film",
		AverageGrade: 5,
		Description:  "testdescription",
		Release:      &civil.Date{Year: 2009, Month: 11, Day: 10},
		Genre:        []string{"Drama", "Comedy"},
	}

	testUser, err := AddUser(testUserToReview)
	if err != nil {
		t.Error(err)
	}
	testProduct, err := AddProduct(testProductToReview)
	if err != nil {
		t.Error(err)
	}

	testReview := Review{
		Name:        "testreview",
		Recommended: true,
		Description: "testdescription",
		UserId:      testUser.Id,
		ProductId:   testProduct.Id,
	}

	_, err = AddReview(testReview)
	if err != nil {
		t.Error(err)
	}

	reviews, err := GetReviewsByUserEmail(testUser.Email)
	if err != nil {
		t.Error(err)
	}

	if len(reviews) != 1 {
		t.Errorf("Function returned wrong number of reviews")
	}

	_, err = DeleteReviewByName(testReview.Name)
	_, err = DeleteUserByEmail(testUserToReview.Email)
	_, err = DeleteProductByName(testProductToReview.Name)
}

func TestGetReviewsByUserEmailInvalidUser(t *testing.T) {
	reviews, err := GetReviewsByUserEmail("-1")
	if err == nil {
		t.Error("An error was expected")
	}

	if len(reviews) != 0 {
		t.Errorf("Function returned wrong number of reviews")
	}
}

func TestGetReviewsByProductName(t *testing.T) {
	testUserToReview := User{
		Email:    "testusertoReview@gmail.com",
		Name:     "testuser",
		Surname:  "toreview",
		UserName: "testusertoreview",
		Password: "testpassword",
		Birth:    &civil.Date{Year: 2009, Month: 11, Day: 10},
	}

	testProductToReview := Product{
		Name:         "testproduct",
		Type:         "Film",
		AverageGrade: 5,
		Description:  "testdescription",
		Release:      &civil.Date{Year: 2009, Month: 11, Day: 10},
		Genre:        []string{"Drama", "Comedy"},
	}

	testUser, err := AddUser(testUserToReview)
	if err != nil {
		t.Error(err)
	}
	testProduct, err := AddProduct(testProductToReview)
	if err != nil {
		t.Error(err)
	}

	testReview := Review{
		Name:        "testreview",
		Recommended: true,
		Description: "testdescription",
		UserId:      testUser.Id,
		ProductId:   testProduct.Id,
	}

	_, err = AddReview(testReview)
	if err != nil {
		t.Error(err)
	}

	reviews, err := GetReviewsByProductName(testProduct.Name)
	if err != nil {
		t.Error(err)
	}

	if len(reviews) != 1 {
		t.Errorf("Function returned wrong number of reviews")
	}
	t.Log(len(reviews))

	_, err = DeleteReviewByName(testReview.Name)
	_, err = DeleteUserByEmail(testUserToReview.Email)
	_, err = DeleteProductByName(testProductToReview.Name)
}

func TestGetReviewsByProductNameInvalidUser(t *testing.T) {
	reviews, err := GetReviewsByProductName("-1")
	if err == nil {
		t.Error("An error was expected")
	}

	if len(reviews) != 0 {
		t.Errorf("Function returned wrong number of reviews")
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
