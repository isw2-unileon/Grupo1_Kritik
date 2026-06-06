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

func TestAddUserError(t *testing.T) {
	mockDB := &MockDatabase{
		MockAddUser: func(newUser User) (*User, error) {
			return nil, errors.New("error adding user to the database")
		},
	}

	addedUser, err := mockDB.AddUser(User{
		Email:    "failemail@gmail.com",
		Name:     "failuser",
		Password: "testpassword",
	})

	if err == nil {
		t.Error("An error was expected but got nil")
	}

	if addedUser != nil {
		t.Errorf("Added user should be nil, got %+v", addedUser)
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

func TestGetRandomProducts(t *testing.T) {
	mockDB := &MockDatabase{
		MockGetRandomProducts: func(limit int) ([]Product, error) {
			return []Product{
				{ID: 1, Name: "Random A", Type: "Videojuego"},
				{ID: 2, Name: "Random B", Type: "Videojuego"},
				{ID: 3, Name: "Random C", Type: "Videojuego"},
			}, nil
		},
	}

	products, err := mockDB.GetRandomProducts(3)

	if err != nil {
		t.Error(err)
	}

	if len(products) != 3 {
		t.Errorf("Function returned wrong number of products: got %d, want 3", len(products))
	}
}

func TestGetRandomProductsError(t *testing.T) {
	mockDB := &MockDatabase{
		MockGetRandomProducts: func(limit int) ([]Product, error) {
			return nil, errors.New("db error")
		},
	}

	products, err := mockDB.GetRandomProducts(-1)

	if err == nil {
		t.Error("An error was expected but got nil")
	}

	if len(products) != 0 {
		t.Errorf("Function returned %d products, should be 0", len(products))
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

func TestGetReviewByIDNotFound(t *testing.T) {
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
func TestDeleteReviewByID(t *testing.T) {
	reviewIDToDelete := -1

	mockDB := &MockDatabase{
		MockDeleteReviewByID: func(id int) (bool, error) {
			if id != reviewIDToDelete {
				return false, errors.New("wrong review id passed to mock")
			}
			return true, nil
		},
	}

	isDeleted, err := mockDB.DeleteReviewByID(reviewIDToDelete)

	if err != nil {
		t.Error(err)
	}

	if !isDeleted {
		t.Errorf("Function returned false, should be true")
	}
}

func TestDeleteReviewByIDError(t *testing.T) {
	mockDB := &MockDatabase{
		MockDeleteReviewByID: func(id int) (bool, error) {
			return false, errors.New("not found any review with the id -20 to delete")
		},
	}

	isDeleted, err := mockDB.DeleteReviewByID(-20)

	if err == nil {
		t.Error("An error was expected but got nil")
	}

	if isDeleted {
		t.Errorf("Function returned true, should be false")
	}
}

func TestGetReviewsByUserID(t *testing.T) {
	userID := 3

	mockDB := &MockDatabase{
		MockGetReviewsByUserID: func(id int) ([]Review, error) {
			return []Review{
				{
					ID:          1,
					Recommended: true,
					Description: "Great product!",
					UserID:      id,
					ProductID:   10,
				},
				{
					ID:          2,
					Recommended: false,
					Description: "Not bad",
					UserID:      id,
					ProductID:   20,
				},
			}, nil
		},
	}

	reviews, err := mockDB.GetReviewsByUserID(userID)

	if err != nil {
		t.Error(err)
	}

	if len(reviews) != 2 {
		t.Errorf("Function returned wrong number of reviews: got %d, want 2", len(reviews))
	} else if reviews[0].UserID != userID {
		t.Errorf("Expected reviews belonging to UserID %d, got %d", userID, reviews[0].UserID)
	}
}

func TestGetReviewsByUserIDNotFound(t *testing.T) {
	mockDB := &MockDatabase{
		MockGetReviewsByUserID: func(id int) ([]Review, error) {
			return nil, errors.New("user with id 0 has no reviews")
		},
	}

	reviews, err := mockDB.GetReviewsByUserID(0)

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

func TestEditReview(t *testing.T) {
	reviewIDToEdit := 1
	newReviewInfo := Review{
		Recommended: false,
		Description: "updated description",
	}

	mockDB := &MockDatabase{
		MockUpdateReviewInfo: func(id int, info Review) (*Review, error) {
			return &Review{
				ID:          id,
				Recommended: info.Recommended,
				Description: info.Description,
				UserID:      99,
				ProductID:   55,
			}, nil
		},
	}

	updatedReview, err := mockDB.UpdateReviewInfo(reviewIDToEdit, newReviewInfo)

	if err != nil {
		t.Error(err)
	}

	if updatedReview == nil {
		t.Errorf("Updated review is nil")
		return
	}

	if updatedReview.Description != newReviewInfo.Description {
		t.Errorf("Updated description is '%s', but expected '%s'", updatedReview.Description, newReviewInfo.Description)
	}

	if updatedReview.Recommended != newReviewInfo.Recommended {
		t.Errorf("Updated recommended is %v, but expected %v", updatedReview.Recommended, newReviewInfo.Recommended)
	}
}

func TestEditReviewFailed(t *testing.T) {
	newReviewInfo := Review{
		Description: "should fail",
	}

	mockDB := &MockDatabase{
		MockUpdateReviewInfo: func(id int, info Review) (*Review, error) {
			return nil, errors.New("not found any review with the id -1 to update")
		},
	}

	updatedReview, err := mockDB.UpdateReviewInfo(-1, newReviewInfo)

	if err == nil {
		t.Error("An error was expected but got nil")
	}

	if updatedReview != nil {
		t.Errorf("Updated review should be nil")
	}
}

/*
 =========================================================
 Relation functions
 =========================================================
*/

func TestGetAllFans(t *testing.T) {
	mockDB := &MockDatabase{
		MockGetAllFans: func(influencerID int) ([]User, error) {
			return []User{
				{ID: 2, Name: "fan1", Email: "fan1@test.com"},
				{ID: 3, Name: "fan2", Email: "fan2@test.com"},
			}, nil
		},
	}

	fans, err := mockDB.GetAllFans(1)

	if err != nil {
		t.Error(err)
	}

	if len(fans) != 2 {
		t.Errorf("Expected 2 fans, got %d", len(fans))
	}

	if fans[0].Name != "fan1" {
		t.Errorf("Expected fan name 'fan1', got '%s'", fans[0].Name)
	}
}

func TestGetAllFansError(t *testing.T) {
	mockDB := &MockDatabase{
		MockGetAllFans: func(influencerID int) ([]User, error) {
			return nil, errors.New("not found fans for influencer 0")
		},
	}

	fans, err := mockDB.GetAllFans(0)

	if err == nil {
		t.Error("Expected error")
	}

	if fans != nil {
		t.Errorf("Fans should be nil")
	}
}

func TestGetAllInfluencers(t *testing.T) {
	mockDB := &MockDatabase{
		MockGetAllInfluencers: func(fanID int) ([]User, error) {
			return []User{
				{ID: 5, Name: "inf1", Email: "inf1@test.com"},
			}, nil
		},
	}

	influencers, err := mockDB.GetAllInfluencers(1)

	if err != nil {
		t.Error(err)
	}

	if len(influencers) != 1 {
		t.Errorf("Expected 1 influencer, got %d", len(influencers))
	}

	if influencers[0].Name != "inf1" {
		t.Errorf("Expected influencer name 'inf1', got '%s'", influencers[0].Name)
	}
}

func TestGetAllInfluencersError(t *testing.T) {
	mockDB := &MockDatabase{
		MockGetAllInfluencers: func(fanID int) ([]User, error) {
			return nil, errors.New("not found influencers for fan 0")
		},
	}

	influencers, err := mockDB.GetAllInfluencers(0)

	if err == nil {
		t.Error("Expected error")
	}

	if influencers != nil {
		t.Errorf("Influencers should be nil")
	}
}

func TestFollowSomeone(t *testing.T) {
	mockDB := &MockDatabase{
		MockFollowSomeone: func(newRelation FollowerRelation) (*FollowerRelation, error) {
			return &FollowerRelation{
				ID:         1,
				Fan:        newRelation.Fan,
				Influencer: newRelation.Influencer,
			}, nil
		},
	}

	relation, err := mockDB.FollowSomeone(FollowerRelation{Fan: 1, Influencer: 2})

	if err != nil {
		t.Error(err)
	}

	if relation == nil {
		t.Errorf("Relation is nil")
		return
	}

	if relation.ID != 1 {
		t.Errorf("Expected relation ID 1, got %d", relation.ID)
	}

	if relation.Fan != 1 {
		t.Errorf("Expected Fan 1, got %d", relation.Fan)
	}

	if relation.Influencer != 2 {
		t.Errorf("Expected Influencer 2, got %d", relation.Influencer)
	}
}

func TestFollowSomeoneError(t *testing.T) {
	mockDB := &MockDatabase{
		MockFollowSomeone: func(newRelation FollowerRelation) (*FollowerRelation, error) {
			return nil, errors.New("error inserting relation: duplicate key violates unique constraint")
		},
	}

	relation, err := mockDB.FollowSomeone(FollowerRelation{Fan: 1, Influencer: 2})

	if err == nil {
		t.Error("Expected error")
	}

	if relation != nil {
		t.Errorf("Relation should be nil")
	}
}

func TestUnfollowSomeone(t *testing.T) {
	mockDB := &MockDatabase{
		MockUnfollowSomeone: func(fanID int, influencerID int) (bool, error) {
			if fanID != 1 || influencerID != 2 {
				return false, errors.New("wrong params passed to mock")
			}
			return true, nil
		},
	}

	isDeleted, err := mockDB.UnfollowSomeone(1, 2)

	if err != nil {
		t.Error(err)
	}

	if !isDeleted {
		t.Errorf("Function returned false, should be true")
	}
}

func TestUnfollowSomeoneError(t *testing.T) {
	mockDB := &MockDatabase{
		MockUnfollowSomeone: func(fanID int, influencerID int) (bool, error) {
			return false, errors.New("error deleting relation: not found")
		},
	}

	isDeleted, err := mockDB.UnfollowSomeone(-1, -2)

	if err == nil {
		t.Error("An error was expected but got nil")
	}

	if isDeleted {
		t.Errorf("Function returned true, should be false")
	}
}

/*
 =========================================================
 Recommender functions
 =========================================================
*/

func TestGetRecommendations(t *testing.T) {
	mockDB := &MockDatabase{
		MockGetRecommendations: func(userID int, limit int) ([]Product, error) {
			return []Product{
				{
					ID:           1,
					Name:         "Game A",
					Type:         "Videojuego",
					AverageGrade: 4,
					Description:  "Great game",
					Genre:        []string{"Acción", "Aventura"},
				},
				{
					ID:           2,
					Name:         "Game B",
					Type:         "Videojuego",
					AverageGrade: 3,
					Description:  "Fun game",
					Genre:        []string{"Estrategia"},
				},
			}, nil
		},
	}

	products, err := mockDB.GetRecommendations(1, 10)

	if err != nil {
		t.Error(err)
	}

	if len(products) != 2 {
		t.Errorf("Function returned wrong number of products: got %d, want 2", len(products))
	} else if products[0].ID != 1 {
		t.Errorf("Expected product ID 1, got %d", products[0].ID)
	}
}

func TestGetRecommendationsError(t *testing.T) {
	mockDB := &MockDatabase{
		MockGetRecommendations: func(userID int, limit int) ([]Product, error) {
			return nil, errors.New("user with id -1 not found")
		},
	}

	products, err := mockDB.GetRecommendations(-1, 10)

	if err == nil {
		t.Error("An error was expected but got nil")
	}

	if len(products) != 0 {
		t.Errorf("Function returned %d products, should be 0", len(products))
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

func TestGetInfluencerRecommendation(t *testing.T) {
	mockDB := &MockDatabase{
		MockGetInfluencerRecommendation: func(userID int, limit int) ([]Product, error) {
			return []Product{
				{
					ID:           1,
					Name:         "Game A",
					Type:         "Videojuego",
					AverageGrade: 4,
					Description:  "Great game",
					Genre:        []string{"Acción", "Aventura"},
				},
				{
					ID:           2,
					Name:         "Game B",
					Type:         "Videojuego",
					AverageGrade: 3,
					Description:  "Fun game",
					Genre:        []string{"Estrategia"},
				},
			}, nil
		},
	}

	products, err := mockDB.GetInfluencerRecommendation(1, 10)

	if err != nil {
		t.Error(err)
	}

	if len(products) != 2 {
		t.Errorf("Function returned wrong number of products: got %d, want 2", len(products))
	} else if products[0].ID != 1 {
		t.Errorf("Expected product ID 1, got %d", products[0].ID)
	}
}

func TestGetInfluencerRecommendationError(t *testing.T) {
	mockDB := &MockDatabase{
		MockGetInfluencerRecommendation: func(userID int, limit int) ([]Product, error) {
			return nil, errors.New("user with id -1 not found")
		},
	}

	products, err := mockDB.GetInfluencerRecommendation(-1, 10)

	if err == nil {
		t.Error("An error was expected but got nil")
	}

	if len(products) != 0 {
		t.Errorf("Function returned %d products, should be 0", len(products))
	}
}

func TestGetInfluencerNotRecommendation(t *testing.T) {
	mockDB := &MockDatabase{
		MockGetInfluencerNotRecommendation: func(userID int, limit int) ([]Product, error) {
			return []Product{
				{
					ID:           3,
					Name:         "Game C",
					Type:         "Libro",
					AverageGrade: 5,
					Description:  "Not recommended",
					Genre:        []string{"Terror"},
				},
				{
					ID:           4,
					Name:         "Game D",
					Type:         "Libro",
					AverageGrade: 2,
					Description:  "Boring",
					Genre:        []string{"Drama"},
				},
			}, nil
		},
	}

	products, err := mockDB.GetInfluencerNotRecommendation(2, 5)

	if err != nil {
		t.Error(err)
	}

	if len(products) != 2 {
		t.Errorf("Function returned wrong number of products: got %d, want 2", len(products))
	} else if products[0].ID != 3 {
		t.Errorf("Expected product ID 3, got %d", products[0].ID)
	}
}

func TestGetInfluencerNotRecommendationError(t *testing.T) {
	mockDB := &MockDatabase{
		MockGetInfluencerNotRecommendation: func(userID int, limit int) ([]Product, error) {
			return nil, errors.New("user with id -1 not found")
		},
	}

	products, err := mockDB.GetInfluencerNotRecommendation(-1, 10)

	if err == nil {
		t.Error("An error was expected but got nil")
	}

	if len(products) != 0 {
		t.Errorf("Function returned %d products, should be 0", len(products))
	}
}
