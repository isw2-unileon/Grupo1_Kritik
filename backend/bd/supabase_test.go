package bd

import (
	"errors"
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
	mockDB := &MockDatabase{
		MockGetUserByEmail: func(userEmail string) (*User, error) {
			return &User{
				Email:    userEmail,
				Name:     "testuser",
				Surname:  "toget",
				UserName: "testusertoget",
				Password: "testpassword",
				Birth:    &civil.Date{Year: 2009, Month: 11, Day: 10},
			}, nil
		},
	}

	user, err := mockDB.GetUserByEmail("testusertoget@gmail.com")

	if err != nil {
		t.Error(err)
	}

	if user == nil {
		t.Errorf("User is nil")
	}
}

func TestGetUserByEmailNotFound(t *testing.T) {
	mockDB := &MockDatabase{
		MockGetUserByEmail: func(email string) (*User, error) {
			return nil, errors.New("not found user with email 0")
		},
	}

	user, err := mockDB.GetUserByEmail("0")

	if err == nil {
		t.Errorf("Expected error")
	}

	if user != nil {
		t.Errorf("User should be nil")
	}
}

func TestGetUserByUserName(t *testing.T) {
	mockDB := &MockDatabase{
		MockGetUserByUserName: func(userName string) (*User, error) {
			return &User{
				Email:    "testusertoget@gmail.com",
				Name:     "testuser",
				Surname:  "toget",
				UserName: userName,
				Password: "testpassword",
				Birth:    &civil.Date{Year: 2009, Month: 11, Day: 10},
			}, nil
		},
	}

	user, err := mockDB.GetUserByUserName("testuser")

	if err != nil {
		t.Error(err)
	}

	if user == nil {
		t.Errorf("User is nil")
	}
}

func TestGetUserByUserNameNotFound(t *testing.T) {
	mockDB := &MockDatabase{
		MockGetUserByUserName: func(userName string) (*User, error) {
			return nil, errors.New("not found user with userName 0")
		},
	}

	user, err := mockDB.GetUserByUserName("0")

	if err == nil {
		t.Errorf("Expected error")
	}

	if user != nil {
		t.Errorf("User should be nil")
	}
}

func TestGetUserByID(t *testing.T) {
	mockDB := &MockDatabase{
		MockGetUserByID: func(id int) (*User, error) {
			return &User{
				ID:       id,
				Email:    "testusertoget@gmail.com",
				Name:     "testuser",
				Surname:  "toget",
				UserName: "testusertoget",
				Password: "testpassword",
				Birth:    &civil.Date{Year: 2009, Month: 11, Day: 10},
			}, nil
		},
	}

	user, err := mockDB.GetUserByID(-2)

	if err != nil {
		t.Error(err)
	}

	if user == nil {
		t.Errorf("User is nil")
	}
}

func TestGetUserByIDNotFound(t *testing.T) {
	mockDB := &MockDatabase{
		MockGetUserByID: func(id int) (*User, error) {
			return nil, errors.New("not found user with id 0")
		},
	}

	user, err := mockDB.GetUserByID(-1)

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

	mockDB := &MockDatabase{
		MockAddUser: func(newUser User) (*User, error) {
			newUser.ID = 1
			return &newUser, nil
		},
	}

	addedUser, err := mockDB.AddUser(testUserToAdd)

	if err != nil {
		t.Error(err)
	}

	if addedUser == nil {
		t.Errorf("Added user is nil")
	}
}

// DELETE USER
func TestDeleteUserByEmail(t *testing.T) {
	mockDB := &MockDatabase{
		MockDeleteUserByEmail: func(email string) (bool, error) {
			if email != "testusertodelete@gmail.com" {
				return false, errors.New("wrong email passed to mock")
			}
			return true, nil
		},
	}

	isDeleted, err := mockDB.DeleteUserByEmail("testusertodelete@gmail.com")

	if err != nil {
		t.Error(err)
	}

	if !isDeleted {
		t.Errorf("Function returned false, should be true")
	}
}

func TestDeleteUserByEmailError(t *testing.T) {
	mockDB := &MockDatabase{
		MockDeleteUserByEmail: func(email string) (bool, error) {
			return false, errors.New("not found any user with the email 0 to delete")
		},
	}

	isDeleted, err := mockDB.DeleteUserByEmail("0")

	if err == nil {
		t.Error("An error was expected but got nil")
	}

	if isDeleted {
		t.Errorf("Function returned true, should be false")
	}
}

// UPDATE USER
func TestEditUserInfo(t *testing.T) {
	emailToEdit := "testusertoedit@gmail.com"
	newUserInfo := User{
		Name:     "testuser2",
		Password: "testpassword2",
	}

	mockDB := &MockDatabase{
		MockUpdateUserInfo: func(userEmail string, info User) (*User, error) {
			return &User{
				Email:    userEmail,
				Name:     info.Name,
				Surname:  "toedit",
				UserName: "testusertoedit",
			}, nil
		},
	}

	updatedUser, err := mockDB.UpdateUserInfo(emailToEdit, newUserInfo)

	if err != nil {
		t.Error(err)
	}

	if updatedUser == nil {
		t.Errorf("Updated user is nil")
	} else if updatedUser.Name != newUserInfo.Name {
		t.Errorf("Updated user name is %s, but expected %s", updatedUser.Name, newUserInfo.Name)
	}
}

func TestEditUserInfoError(t *testing.T) {
	newUserInfo := User{
		Name: "testuser2",
	}

	mockDB := &MockDatabase{
		MockUpdateUserInfo: func(userEmail string, info User) (*User, error) {
			return nil, errors.New("not found any user with the email dhfdskhjdfsj to update")
		},
	}

	updatedUser, err := mockDB.UpdateUserInfo("dhfdskhjdfsj", newUserInfo)

	if err == nil {
		t.Error("An error was expected but got nil")
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
func TestGetProductsByName(t *testing.T) {
	mockDB := &MockDatabase{
		MockGetProductsByName: func(name string) ([]Product, error) {
			return []Product{
				{
					Name:         "testproduct",
					Type:         "Film",
					AverageGrade: 5,
					Description:  "testdescription",
					Release:      &civil.Date{Year: 2009, Month: 11, Day: 10},
					Genre:        []string{"Drama", "Comedy"},
				},
			}, nil
		},
	}

	product, err := mockDB.GetProductsByName("testproduct")

	if err != nil {
		t.Error(err)
	}

	if product == nil {
		t.Errorf("Product is nil")
	} else if product[0].Name != "testproduct" {
		t.Errorf("Expected product name 'testproduct', got '%s'", product[0].Name)
	}
}

func TestGetProductByNameNotFound(t *testing.T) {
	mockDB := &MockDatabase{
		MockGetProductsByName: func(name string) ([]Product, error) {
			return nil, errors.New("not found product with name skjvnlkjhvs")
		},
	}

	product, err := mockDB.GetProductsByName("skjvnlkjhvs")

	if err == nil {
		t.Errorf("Expected error")
	}

	if product != nil {
		t.Errorf("Product should be nil")
	}
}

func TestGetProductByID(t *testing.T) {
	mockDB := &MockDatabase{
		MockGetProductByID: func(id int) (*Product, error) {
			return &Product{
				ID:           -2,
				Name:         "testproduct",
				Type:         "Film",
				AverageGrade: 5,
				Description:  "testdescription",
				Release:      &civil.Date{Year: 2009, Month: 11, Day: 10},
				Genre:        []string{"Drama", "Comedy"},
			}, nil
		},
	}

	product, err := mockDB.GetProductByID(-2)

	if err != nil {
		t.Error(err)
	}

	if product == nil {
		t.Errorf("Product is nil")
	}
}

func TestGetProductByIDNotFound(t *testing.T) {
	mockDB := &MockDatabase{
		MockGetProductByID: func(id int) (*Product, error) {
			return nil, errors.New("not found product with id 0")
		},
	}

	product, err := mockDB.GetProductByID(-1)

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

	mockDB := &MockDatabase{
		MockAddProduct: func(newProduct Product) (*Product, error) {
			newProduct.ID = 42
			return &newProduct, nil
		},
	}

	addedProduct, err := mockDB.AddProduct(testProductToAdd)

	if err != nil {
		t.Error(err)
	}

	if addedProduct == nil {
		t.Errorf("Added product is nil")
	} else if addedProduct.ID != 42 {
		t.Errorf("Expected product ID 42, got %d", addedProduct.ID)
	}
}

func TestAddProductMissingData(t *testing.T) {
	testProductToAdd := Product{
		Name:         "testproduct",
		AverageGrade: 5,
		Description:  "testdescription",
		Release:      &civil.Date{Year: 2009, Month: 11, Day: 10},
		Genre:        []string{"Drama", "Comedy"},
	}

	mockDB := &MockDatabase{
		MockAddProduct: func(newProduct Product) (*Product, error) {
			return nil, errors.New("error inserting product: null value in column \"Type\" violates not-null constraint")
		},
	}

	addedProduct, err := mockDB.AddProduct(testProductToAdd)

	if err == nil {
		t.Errorf("An error was expected")
	}

	if addedProduct != nil {
		t.Errorf("Added product should be nil")
	}
}

// DELETE PRODUCT
func TestDeleteProductByName(t *testing.T) {
	productNameToDelete := "testproduct"

	mockDB := &MockDatabase{
		MockDeleteProductByName: func(name string) (bool, error) {
			if name != productNameToDelete {
				return false, errors.New("wrong product name passed to mock")
			}
			return true, nil
		},
	}

	isDeleted, err := mockDB.DeleteProductByName(productNameToDelete)

	if err != nil {
		t.Error(err)
	}

	if !isDeleted {
		t.Errorf("Function returned false, should be true")
	}
}

func TestDeleteProductByNameError(t *testing.T) {
	mockDB := &MockDatabase{
		MockDeleteProductByName: func(name string) (bool, error) {
			return false, errors.New("not found any product with the name dfdgfdfdgs to delete")
		},
	}

	isDeleted, err := mockDB.DeleteProductByName("dfdgfdfdgs")

	if err == nil {
		t.Error("An error was expected but got nil")
	}

	if isDeleted {
		t.Errorf("Function returned true, should be false")
	}
}

// UPDATE PRODUCT
func TestEditProductInfo(t *testing.T) {
	productNameToEdit := "testproduct"

	newProductInfo := Product{
		Type: "Series",
	}

	mockDB := &MockDatabase{
		MockUpdateProductInfo: func(name string, info Product) (*Product, error) {
			return &Product{
				ID:           10,
				Name:         name,
				Type:         info.Type,
				AverageGrade: 5,
				Description:  "testdescription",
			}, nil
		},
	}

	updatedProduct, err := mockDB.UpdateProductInfo(productNameToEdit, newProductInfo)

	if err != nil {
		t.Error(err)
	}

	if updatedProduct == nil {
		t.Errorf("Updated product is nil")
		return
	}

	if updatedProduct.Name != productNameToEdit {
		t.Errorf("Updated product name is different")
	}

	if updatedProduct.Type != "Series" {
		t.Errorf("Expected product type 'Series', got '%s'", updatedProduct.Type)
	}
}

func TestEditProductInfoError(t *testing.T) {
	newProductInfo := Product{
		Name: "testproduct2",
	}

	mockDB := &MockDatabase{
		MockUpdateProductInfo: func(name string, info Product) (*Product, error) {
			return nil, errors.New("not found any product with the Name dhfdskhjdfsj to update")
		},
	}

	updatedProduct, err := mockDB.UpdateProductInfo("dhfdskhjdfsj", newProductInfo)

	if err == nil {
		t.Error("An error was expected but got nil")
	}

	if updatedProduct != nil {
		t.Errorf("Updated product should be nil")
	}
}

func TestGetFriendsByUserID(t *testing.T) {
	idToSearch := 1

	mockDB := &MockDatabase{
		MockGetFriendsByUserID: func(id int) ([]User, error) {
			return []User{
				{ID: 2, UserName: "friend1", Email: "friend1@test.com"},
				{ID: 3, UserName: "friend2", Email: "friend2@test.com"},
			}, nil
		},
	}

	friends, err := mockDB.GetFriendsByUserID(idToSearch)

	if err != nil {
		t.Error(err)
	}

	if len(friends) != 2 {
		t.Errorf("Expected 2 friends, got %d", len(friends))
	} else if friends[0].ID != 2 {
		t.Errorf("Expected first friend ID 2, got %d", friends[0].ID)
	} else if friends[1].ID != 3 {
		t.Errorf("Expected second friend ID 3, got %d", friends[1].ID)
	}
}

func TestGetFriendsByUserIDNotFound(t *testing.T) {
	mockDB := &MockDatabase{
		MockGetFriendsByUserID: func(id int) ([]User, error) {
			return nil, errors.New("not found any relation with user id -1")
		},
	}

	friends, err := mockDB.GetFriendsByUserID(-1)

	if err == nil {
		t.Error("An error was expected but got nil")
	}

	if len(friends) != 0 {
		t.Errorf("Expected 0 friends, got %d", len(friends))
	}
}

/*
 =========================================================
 Review functions
 =========================================================
*/

// GET REVIEW
func TestGetReviewByID(t *testing.T) {
	reviewID := -1

	mockDB := &MockDatabase{
		MockGetReviewByID: func(id int) (*Review, error) {
			return &Review{
				ID:          -1,
				Recommended: true,
				Description: "testdescription",
				UserID:      99,
				ProductID:   55,
			}, nil
		},
	}

	review, err := mockDB.GetReviewByID(-1)

	if err != nil {
		t.Error(err)
	}

	if review == nil {
		t.Errorf("Review is nil")
	} else if review.ID != reviewID {
		t.Errorf("Expected review id '%d', got '%d'", reviewID, review.ID)
	}
}

func TestGetReviewByNameNotFound(t *testing.T) {
	mockDB := &MockDatabase{
		MockGetReviewByID: func(id int) (*Review, error) {
			return nil, errors.New("not found review with id -1")
		},
	}

	review, err := mockDB.GetReviewByID(-1)

	if err == nil {
		t.Errorf("Expected error")
	}

	if review != nil {
		t.Errorf("Review should be nil")
	}
}

// ADD REVIEW
func TestAddReview(t *testing.T) {
	testReviewToAdd := Review{
		Recommended: true,
		Description: "testdescription",
		UserID:      99,
		ProductID:   55,
	}

	mockDB := &MockDatabase{
		MockAddReview: func(newReview Review) (*Review, error) {
			newReview.ID = 1
			return &newReview, nil
		},
	}

	addedReview, err := mockDB.AddReview(testReviewToAdd)

	if err != nil {
		t.Error(err)
	}

	if addedReview == nil {
		t.Errorf("Added review is nil")
	} else if addedReview.ID != 1 {
		t.Errorf("Expected review ID 1, got %d", addedReview.ID)
	}
}

func TestAddReviewMissingData(t *testing.T) {
	testReviewToAdd := Review{
		Recommended: true,
		Description: "Good film",
	}

	mockDB := &MockDatabase{
		MockAddReview: func(newReview Review) (*Review, error) {
			return nil, errors.New("error inserting review: null value violates not-null constraint")
		},
	}

	addedReview, err := mockDB.AddReview(testReviewToAdd)

	if err == nil {
		t.Error("Should have returned an error")
	}

	if addedReview != nil {
		t.Errorf("Added review should be nil, but its not")
	}
}

func TestAddReviewNotUserInBD(t *testing.T) {
	testReviewToAdd := Review{
		Recommended: true,
		Description: "testdescription",
		UserID:      -1,
		ProductID:   -1,
	}

	mockDB := &MockDatabase{
		MockAddReview: func(newReview Review) (*Review, error) {
			return nil, errors.New("error inserting review: insert or update on table violates foreign key constraint")
		},
	}

	addedReview, err := mockDB.AddReview(testReviewToAdd)

	if err == nil {
		t.Error("Should have returned an error")
	}

	if addedReview != nil {
		t.Errorf("Added review should be nil, but its not")
	}
}

// DELETE REVIEW
func TestDeleteReviewByName(t *testing.T) {
	reviewNameToDelete := "testreview"

	mockDB := &MockDatabase{
		MockDeleteReviewByName: func(name string) (bool, error) {
			if name != reviewNameToDelete {
				return false, errors.New("wrong review name passed to mock")
			}
			return true, nil
		},
	}

	isDeleted, err := mockDB.DeleteReviewByName(reviewNameToDelete)

	if err != nil {
		t.Error(err)
	}

	if !isDeleted {
		t.Errorf("Function returned false, should be true")
	}
}

func TestDeleteReviewByNameError(t *testing.T) {
	mockDB := &MockDatabase{
		MockDeleteReviewByName: func(name string) (bool, error) {
			return false, errors.New("not found any review with the name sdjhbkdsbf to delete")
		},
	}

	isDeleted, err := mockDB.DeleteReviewByName("sdjhbkdsbf")

	if err == nil {
		t.Error("An error was expected but got nil")
	}

	if isDeleted {
		t.Errorf("Function returned true, should be false")
	}
}

func TestGetReviewsByUserID(t *testing.T) {
	idToSearch := 1

	mockDB := &MockDatabase{
		MockGetUserByEmail: func(email string) (*User, error) {
			return &User{
				ID:    99,
				Email: email,
			}, nil
		},
		MockGetReviewsByUserID: func(id int) ([]Review, error) {
			return []Review{
				{
					ID:          1,
					Recommended: true,
					Description: "testdescription",
					UserID:      99,
					ProductID:   55,
				},
			}, nil
		},
	}

	reviews, err := mockDB.GetReviewsByUserID(idToSearch)

	if err != nil {
		t.Error(err)
	}

	if len(reviews) != 1 {
		t.Errorf("Function returned wrong number of reviews: got %d, want 1", len(reviews))
	} else if reviews[0].UserID != 99 {
		t.Errorf("Expected review belonging to UserID 99, got %d", reviews[0].UserID)
	}
}

func TestGetReviewsByUserIDInvalidUser(t *testing.T) {
	mockDB := &MockDatabase{
		MockGetReviewsByUserID: func(id int) ([]Review, error) {
			return nil, errors.New("not found user with email -1")
		},
	}

	reviews, err := mockDB.GetReviewsByUserID(-1)

	if err == nil {
		t.Error("An error was expected but got nil")
	}

	if len(reviews) != 0 {
		t.Errorf("Function returned %d reviews, should be 0", len(reviews))
	}
}

func TestGetReviewsByProductID(t *testing.T) {
	productNameToSearch := 1

	mockDB := &MockDatabase{
		MockGetProductsByName: func(name string) ([]Product, error) {
			return []Product{
				{
					ID:   55,
					Name: name,
				},
			}, nil
		},
		MockGetReviewsByProductID: func(id int) ([]Review, error) {
			return []Review{
				{
					ID:          1,
					Recommended: true,
					Description: "testdescription",
					UserID:      99,
					ProductID:   55,
				},
			}, nil
		},
	}

	reviews, err := mockDB.GetReviewsByProductID(productNameToSearch)

	if err != nil {
		t.Error(err)
	}

	if len(reviews) != 1 {
		t.Errorf("Function returned wrong number of reviews: got %d, want 1", len(reviews))
	} else if reviews[0].ProductID != 55 {
		t.Errorf("Expected review belonging to ProductID 55, got %d", reviews[0].ProductID)
	}
}

func TestGetReviewsByProductIDInvalidProduct(t *testing.T) {
	mockDB := &MockDatabase{
		MockGetReviewsByProductID: func(id int) ([]Review, error) {
			return nil, errors.New("not found product with id = -1")
		},
	}

	reviews, err := mockDB.GetReviewsByProductID(-1)

	if err == nil {
		t.Error("An error was expected but got nil")
	}

	if len(reviews) != 0 {
		t.Errorf("Function returned %d reviews, should be 0", len(reviews))
	}
}

/*
 =========================================================
 Relation functions
 =========================================================
*/

func TestGetRelationByUserID(t *testing.T) {
	idToSearch := 1

	mockDB := &MockDatabase{
		MockGetRelationByUserID: func(id int) (*FriendRelation, error) {
			return &FriendRelation{
				ID:      1,
				Friend1: id,
				Friend2: 2,
			}, nil
		},
	}

	relation, err := mockDB.GetRelationByUserID(idToSearch)

	if err != nil {
		t.Error(err)
	}

	if relation == nil {
		t.Errorf("Relation is nil")
	} else if relation.Friend1 != idToSearch {
		t.Errorf("Expected Friend1 %d, got %d", idToSearch, relation.Friend1)
	}
}

func TestGetRelationByUserIDNotFound(t *testing.T) {
	mockDB := &MockDatabase{
		MockGetRelationByUserID: func(id int) (*FriendRelation, error) {
			return nil, errors.New("not found relation with user id -1")
		},
	}

	relation, err := mockDB.GetRelationByUserID(-1)

	if err == nil {
		t.Errorf("Expected error")
	}

	if relation != nil {
		t.Errorf("Relation should be nil")
	}
}

// ADD RELATION
func TestAddRelation(t *testing.T) {
	testRelationToAdd := FriendRelation{
		Friend1: 1,
		Friend2: 2,
	}

	mockDB := &MockDatabase{
		MockAddRelation: func(newRelation FriendRelation) (*FriendRelation, error) {
			newRelation.ID = 1
			return &newRelation, nil
		},
	}

	addedRelation, err := mockDB.AddRelation(testRelationToAdd)

	if err != nil {
		t.Error(err)
	}

	if addedRelation == nil {
		t.Errorf("Added relation is nil")
	} else if addedRelation.ID != 1 {
		t.Errorf("Expected relation ID 1, got %d", addedRelation.ID)
	}
}

func TestAddRelationMissingData(t *testing.T) {
	testRelationToAdd := FriendRelation{}

	mockDB := &MockDatabase{
		MockAddRelation: func(newRelation FriendRelation) (*FriendRelation, error) {
			return nil, errors.New("error inserting relation: null value violates not-null constraint")
		},
	}

	addedRelation, err := mockDB.AddRelation(testRelationToAdd)

	if err == nil {
		t.Error("Should have returned an error")
	}

	if addedRelation != nil {
		t.Errorf("Added relation should be nil, but its not")
	}
}

// DELETE RELATION
func TestDeleteRelationByUserID(t *testing.T) {
	userIDToDelete := 1

	mockDB := &MockDatabase{
		MockDeleteRelationByUserID: func(id int) (bool, error) {
			if id != userIDToDelete {
				return false, errors.New("wrong user id passed to mock")
			}
			return true, nil
		},
	}

	isDeleted, err := mockDB.DeleteRelationByUserID(userIDToDelete)

	if err != nil {
		t.Error(err)
	}

	if !isDeleted {
		t.Errorf("Function returned false, should be true")
	}
}

func TestDeleteRelationByUserIDError(t *testing.T) {
	mockDB := &MockDatabase{
		MockDeleteRelationByUserID: func(id int) (bool, error) {
			return false, errors.New("not found any relation with the user id -1 to delete")
		},
	}

	isDeleted, err := mockDB.DeleteRelationByUserID(-1)

	if err == nil {
		t.Error("An error was expected but got nil")
	}

	if isDeleted {
		t.Errorf("Function returned true, should be false")
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
