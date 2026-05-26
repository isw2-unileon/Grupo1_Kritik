package bd

type MockDatabase struct {
	MockGetUserByEmail    func(userEmail string) (*User, error)
	MockGetUserByUserName func(userName string) (*User, error)
	MockGetUserByID       func(userID int) (*User, error)
	MockAddUser           func(newUser User) (*User, error)
	MockDeleteUserByEmail func(userEmail string) (bool, error)
	MockUpdateUserInfo    func(userEmail string, newUserInfo User) (*User, error)

	MockGetProductByName    func(productName string) (*Product, error)
	MockAddProduct          func(newProduct Product) (*Product, error)
	MockDeleteProductByName func(productName string) (bool, error)
	MockUpdateProductInfo   func(productName string, newProductInfo Product) (*Product, error)

	MockGetReviewByName         func(reviewName string) (*Review, error)
	MockAddReview               func(newReview Review) (*Review, error)
	MockDeleteReviewByName      func(reviewName string) (bool, error)
	MockGetReviewsByUserEmail   func(userEmail string) ([]Review, error)
	MockGetReviewsByProductName func(productName string) ([]Review, error)
}

func (m *MockDatabase) GetUserByEmail(userEmail string) (*User, error) {
	return m.MockGetUserByEmail(userEmail)
}

func (m *MockDatabase) AddUser(newUser User) (*User, error) {
	return m.MockAddUser(newUser)
}

func (m *MockDatabase) GetUserByUserName(n string) (*User, error) { return m.MockGetUserByUserName(n) }
func (m *MockDatabase) GetUserByID(id int) (*User, error)         { return m.MockGetUserByID(id) }
func (m *MockDatabase) DeleteUserByEmail(e string) (bool, error)  { return m.MockDeleteUserByEmail(e) }
func (m *MockDatabase) UpdateUserInfo(e string, u User) (*User, error) {
	return m.MockUpdateUserInfo(e, u)
}
func (m *MockDatabase) GetProductByName(n string) (*Product, error) { return m.MockGetProductByName(n) }
func (m *MockDatabase) AddProduct(p Product) (*Product, error)      { return m.MockAddProduct(p) }
func (m *MockDatabase) DeleteProductByName(n string) (bool, error) {
	return m.MockDeleteProductByName(n)
}
func (m *MockDatabase) UpdateProductInfo(n string, p Product) (*Product, error) {
	return m.MockUpdateProductInfo(n, p)
}
func (m *MockDatabase) GetReviewByName(n string) (*Review, error) { return m.MockGetReviewByName(n) }
func (m *MockDatabase) AddReview(r Review) (*Review, error)       { return m.MockAddReview(r) }
func (m *MockDatabase) DeleteReviewByName(n string) (bool, error) { return m.MockDeleteReviewByName(n) }
func (m *MockDatabase) GetReviewsByUserEmail(e string) ([]Review, error) {
	return m.MockGetReviewsByUserEmail(e)
}
func (m *MockDatabase) GetReviewsByProductName(n string) ([]Review, error) {
	return m.MockGetReviewsByProductName(n)
}
