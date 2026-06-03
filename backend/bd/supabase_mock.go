package bd

// MockDatabase struct
//
//nolint:dupl // DO NOT remove this
type MockDatabase struct {
	MockGetUserByEmail    func(userEmail string) (*User, error)
	MockGetUserByUserName func(userName string) (*User, error)
	MockGetUserByID       func(userID int) (*User, error)
	MockAddUser           func(newUser User) (*User, error)
	MockDeleteUserByEmail func(userEmail string) (bool, error)
	MockUpdateUserInfo    func(userEmail string, newUserInfo User) (*User, error)

	MockGetProductsByName   func(productName string) ([]Product, error)
	MockGetProductByID      func(productID int) (*Product, error)
	MockAddProduct          func(newProduct Product) (*Product, error)
	MockDeleteProductByName func(productName string) (bool, error)
	MockUpdateProductInfo   func(productName string, newProductInfo Product) (*Product, error)

	MockGetReviewByID         func(reviewID int) (*Review, error)
	MockAddReview             func(newReview Review) (*Review, error)
	MockDeleteReviewByName    func(reviewName string) (bool, error)
	MockGetReviewsByUserID    func(userID int) ([]Review, error)
	MockGetReviewsByProductID func(productID int) ([]Review, error)

	MockGetRelationByUserID    func(userID int) (*FriendRelation, error)
	MockAddRelation            func(newRelation FriendRelation) (*FriendRelation, error)
	MockDeleteRelationByUserID func(userID int) (bool, error)

	MockGetFriendsByUserID func(userID int) ([]User, error)
}

// GetUserByEmail mock
func (m *MockDatabase) GetUserByEmail(userEmail string) (*User, error) {
	return m.MockGetUserByEmail(userEmail)
}

// GetUserByUserName mock
func (m *MockDatabase) GetUserByUserName(n string) (*User, error) {
	return m.MockGetUserByUserName(n)
}

// GetUserByID mock
func (m *MockDatabase) GetUserByID(id int) (*User, error) {
	return m.MockGetUserByID(id)
}

// AddUser mock
func (m *MockDatabase) AddUser(newUser User) (*User, error) {
	return m.MockAddUser(newUser)
}

// DeleteUserByEmail mock
func (m *MockDatabase) DeleteUserByEmail(e string) (bool, error) {
	return m.MockDeleteUserByEmail(e)
}

// UpdateUserInfo mock
func (m *MockDatabase) UpdateUserInfo(e string, u User) (*User, error) {
	return m.MockUpdateUserInfo(e, u)
}

// GetProductsByName mock
func (m *MockDatabase) GetProductsByName(n string) ([]Product, error) {
	return m.MockGetProductsByName(n)
}

// GetProductByID mock
func (m *MockDatabase) GetProductByID(id int) (*Product, error) {
	return m.MockGetProductByID(id)
}

// AddProduct mock
func (m *MockDatabase) AddProduct(p Product) (*Product, error) {
	return m.MockAddProduct(p)
}

// DeleteProductByName mock
func (m *MockDatabase) DeleteProductByName(n string) (bool, error) {
	return m.MockDeleteProductByName(n)
}

// UpdateProductInfo mock
func (m *MockDatabase) UpdateProductInfo(n string, p Product) (*Product, error) {
	return m.MockUpdateProductInfo(n, p)
}

// GetReviewByID mock
func (m *MockDatabase) GetReviewByID(id int) (*Review, error) {
	return m.MockGetReviewByID(id)
}

// AddReview mock
func (m *MockDatabase) AddReview(r Review) (*Review, error) {
	return m.MockAddReview(r)
}

// DeleteReviewByName mock
func (m *MockDatabase) DeleteReviewByName(n string) (bool, error) {
	return m.MockDeleteReviewByName(n)
}

// GetReviewsByUserID mock
func (m *MockDatabase) GetReviewsByUserID(id int) ([]Review, error) {
	return m.MockGetReviewsByUserID(id)
}

// GetReviewsByProductID mock
func (m *MockDatabase) GetReviewsByProductID(id int) ([]Review, error) {
	return m.MockGetReviewsByProductID(id)
}

// GetRelationByUserID mock
func (m *MockDatabase) GetRelationByUserID(id int) (*FriendRelation, error) {
	return m.MockGetRelationByUserID(id)
}

// AddRelation mock
func (m *MockDatabase) AddRelation(f FriendRelation) (*FriendRelation, error) {
	return m.MockAddRelation(f)
}

// DeleteRelationByUserID mock
func (m *MockDatabase) DeleteRelationByUserID(userID int) (bool, error) {
	return m.MockDeleteRelationByUserID(userID)
}

// GetFriendsByUserID mock
func (m *MockDatabase) GetFriendsByUserID(userID int) ([]User, error) {
	return m.MockGetFriendsByUserID(userID)
}
