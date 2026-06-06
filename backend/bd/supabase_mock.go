package bd

// MockDatabase struct
//
//nolint:dupl // DO NOT remove this
type MockDatabase struct {
	MockGetUserByEmail    func(userEmail string) (*User, error)
	MockGetUserByUserName func(userName string) (*User, error)
	MockGetUserByID       func(userID int) (*User, error)
	MockGetUsersByUserName func(userName string) ([]User, error)
	MockAddUser           func(newUser User) (*User, error)
	MockDeleteUserByEmail func(userEmail string) (bool, error)
	MockUpdateUserInfo    func(userEmail string, newUserInfo User) (*User, error)
	MockUpdateUserImage   func(userID int, imageURL string) (*User, error)
	MockUploadAvatar      func(userID int, fileBytes []byte, ext string, contentType string) (string, error)
	MockDeleteAvatar      func(userID int) error

	MockGetProductsByName   func(productName string) ([]Product, error)
	MockGetProductByID      func(productID int) (*Product, error)
	MockGetRandomProducts   func(limit int) ([]Product, error)
	MockAddProduct          func(newProduct Product) (*Product, error)
	MockDeleteProductByName func(productName string) (bool, error)
	MockUpdateProductInfo   func(productName string, newProductInfo Product) (*Product, error)

	MockGetReviewByID         func(reviewID int) (*Review, error)
	MockGetReviewsByUserID    func(userID int) ([]Review, error)
	MockGetReviewsByProductID func(productID int) ([]Review, error)
	MockAddReview             func(newReview Review) (*Review, error)
	MockDeleteReviewByID      func(reviewID int) (bool, error)
	MockUpdateReviewInfo      func(reviewID int, newReview Review) (*Review, error)

	MockGetAllFans        func(influencerID int) ([]User, error)
	MockGetAllInfluencers func(fanID int) ([]User, error)
	MockFollowSomeone     func(newRelation FollowerRelation) (*FollowerRelation, error)
	MockUnfollowSomeone   func(fanID int, influencerID int) (bool, error)

	MockGetRecommendations func(userID int, limit int) ([]Product, error)
}

// GetUserByEmail mock
func (m *MockDatabase) GetUserByEmail(userEmail string) (*User, error) {
	return m.MockGetUserByEmail(userEmail)
}

// GetUserByUserName mock
func (m *MockDatabase) GetUserByUserName(userName string) (*User, error) {
	return m.MockGetUserByUserName(userName)
}

// GetUserByID mock
func (m *MockDatabase) GetUserByID(userID int) (*User, error) {
	return m.MockGetUserByID(userID)
}

// GetUsersByUserName mock
func (m *MockDatabase) GetUsersByUserName(userName string) ([]User, error) {
	return m.MockGetUsersByUserName(userName)
}

// AddUser mock
func (m *MockDatabase) AddUser(newUser User) (*User, error) {
	return m.MockAddUser(newUser)
}

// DeleteUserByEmail mock
func (m *MockDatabase) DeleteUserByEmail(userEmail string) (bool, error) {
	return m.MockDeleteUserByEmail(userEmail)
}

// UpdateUserInfo mock
func (m *MockDatabase) UpdateUserInfo(userEmail string, newUserInfo User) (*User, error) {
	return m.MockUpdateUserInfo(userEmail, newUserInfo)
}

// UpdateUserImage mock
func (m *MockDatabase) UpdateUserImage(userID int, imageURL string) (*User, error) {
	return m.MockUpdateUserImage(userID, imageURL)
}

// UploadAvatar mock
func (m *MockDatabase) UploadAvatar(userID int, fileBytes []byte, ext string, contentType string) (string, error) {
	return m.MockUploadAvatar(userID, fileBytes, ext, contentType)
}

// DeleteAvatar mock
func (m *MockDatabase) DeleteAvatar(userID int) error {
	return m.MockDeleteAvatar(userID)
}

// GetProductsByName mock
func (m *MockDatabase) GetProductsByName(productName string) ([]Product, error) {
	return m.MockGetProductsByName(productName)
}

// GetProductByID mock
func (m *MockDatabase) GetProductByID(productID int) (*Product, error) {
	return m.MockGetProductByID(productID)
}

// GetRandomProducts mock
func (m *MockDatabase) GetRandomProducts(limit int) ([]Product, error) {
	return m.MockGetRandomProducts(limit)
}

// AddProduct mock
func (m *MockDatabase) AddProduct(newProduct Product) (*Product, error) {
	return m.MockAddProduct(newProduct)
}

// DeleteProductByName mock
func (m *MockDatabase) DeleteProductByName(productName string) (bool, error) {
	return m.MockDeleteProductByName(productName)
}

// UpdateProductInfo mock
func (m *MockDatabase) UpdateProductInfo(productName string, newProductInfo Product) (*Product, error) {
	return m.MockUpdateProductInfo(productName, newProductInfo)
}

// GetReviewByID mock
func (m *MockDatabase) GetReviewByID(reviewID int) (*Review, error) {
	return m.MockGetReviewByID(reviewID)
}

// GetReviewsByUserID mock
func (m *MockDatabase) GetReviewsByUserID(userID int) ([]Review, error) {
	return m.MockGetReviewsByUserID(userID)
}

// GetReviewsByProductID mock
func (m *MockDatabase) GetReviewsByProductID(productID int) ([]Review, error) {
	return m.MockGetReviewsByProductID(productID)
}

// AddReview mock
func (m *MockDatabase) AddReview(newReview Review) (*Review, error) {
	return m.MockAddReview(newReview)
}

// DeleteReviewByID mock
func (m *MockDatabase) DeleteReviewByID(reviewID int) (bool, error) {
	return m.MockDeleteReviewByID(reviewID)
}

// UpdateReviewInfo mock
func (m *MockDatabase) UpdateReviewInfo(reviewID int, newReviewInfo Review) (*Review, error) {
	return m.MockUpdateReviewInfo(reviewID, newReviewInfo)
}

// GetAllFans mock
func (m *MockDatabase) GetAllFans(influencerID int) ([]User, error) {
	return m.MockGetAllFans(influencerID)
}

// GetAllInfluencers mock
func (m *MockDatabase) GetAllInfluencers(fanID int) ([]User, error) {
	return m.MockGetAllInfluencers(fanID)
}

// FollowSomeone mock
func (m *MockDatabase) FollowSomeone(newRelation FollowerRelation) (*FollowerRelation, error) {
	return m.MockFollowSomeone(newRelation)
}

// UnfollowSomeone mock
func (m *MockDatabase) UnfollowSomeone(fanID int, influencerID int) (bool, error) {
	return m.MockUnfollowSomeone(fanID, influencerID)
}

// GetRecommendations mock
func (m *MockDatabase) GetRecommendations(userID int, limit int) ([]Product, error) {
	return m.MockGetRecommendations(userID, limit)
}
