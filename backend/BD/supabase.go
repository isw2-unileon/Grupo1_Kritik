package BD

import (
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	"github.com/supabase-community/supabase-go"
)

type Users struct {
	ID       string `json:"id"`
	Email    string `json:"Correo"`
	Name     string `json:"Nombre"`
	Password string `json:"Password"`
}

var client *supabase.Client

func InitialiseBD() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error al cargar el archivo .env")
	}

	url := os.Getenv("SUPABASE_URL")
	key := os.Getenv("SUPABASE_KEY")

	var errClient error
	client, errClient = supabase.NewClient(url, key, &supabase.ClientOptions{})

	if errClient != nil {
		log.Fatalf("Error al crear cliente: %v", errClient)
	}
}

func GetUserByID(userID string) (*Users, error) {
	if client == nil {
		return nil, fmt.Errorf("el cliente de base de datos no está inicializado")
	}

	var users []Users
	_, err := client.From("users").Select("*", "exact", false).Eq("id", userID).ExecuteTo(&users)

	if err != nil {
		return nil, err
	}

	if len(users) == 0 {
		return nil, fmt.Errorf("usuario con ID %s no encontrado", userID)
	}

	return &users[0], nil
}
