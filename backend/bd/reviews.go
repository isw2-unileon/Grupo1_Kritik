package bd

import "fmt"

// Review mirrors the "Review" table: a review written by a user about a Product.
// Name is the (unique) review title, Rating is 0-10 with one decimal, and
// Recommended is derived from the rating by the handler.
type Review struct {
	ID          int    `json:"id,omitempty"`
	Name        string `json:"Name,omitempty"`
	Description string `json:"Description,omitempty"`
	Recommended bool   `json:"Recommended"`
	ProductName string `json:"ProductName,omitempty"`
	UserName    string `json:"UserName,omitempty"`
}

// Product is the item a review points to. Only the fields we use are mapped;
// any extra columns in the table are ignored when decoding.
type Product struct {
	Name string `json:"Name,omitempty"`
}

// AddReview inserts a new Review and returns the created row.
func AddReview(newReview Review) (*Review, error) {
	if client == nil {
		InitialiseBD()
	}

	var inserted []Review
	_, err := client.From("Review").Insert(newReview, false, "", "", "").ExecuteTo(&inserted)
	if err != nil {
		return nil, fmt.Errorf("error inserting review:\n%w", err)
	}
	if len(inserted) == 0 {
		return nil, fmt.Errorf("review was not inserted")
	}
	return &inserted[0], nil
}

// SearchProductByName returns Products whose name partially matches the query.
func SearchProductByName(query string) ([]Product, error) {
	if client == nil {
		InitialiseBD()
	}

	var products []Product
	_, err := client.From("Product").
		Select("*", "exact", false).
		Ilike("Name", "%"+query+"%").
		ExecuteTo(&products)
	if err != nil {
		return nil, err
	}
	return products, nil
}

// GetReviewsByUser returns all reviews written by the given username.
func GetReviewsByUser(username string) ([]Review, error) {
	if client == nil {
		InitialiseBD()
	}

	var reviews []Review
	_, err := client.From("Review").Select("*", "exact", false).Eq("UserName", username).ExecuteTo(&reviews)
	if err != nil {
		return nil, err
	}
	return reviews, nil
}
