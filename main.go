package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/static/v3"
	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type Todo struct {
ID primitive.ObjectID `json:"_id,omitempty" bson:"_id,omitempty"`
Completed bool `json:"completed"`
Body string `json:"body"`
}

var collection *mongo.Collection

func main()  {
	fmt.Println("I am Hanif")

	if os.Getenv("ENV") != "production" {
		// load the .env file if not in production
		err := godotenv.Load(".env")
		if err != nil{
			log.Fatal("Error loading .env file", err)
		}
	}



	MONGODB_URI := os.Getenv("MONGODB_URI")
	clientOptions := options.Client().ApplyURI(MONGODB_URI)
	client,err := mongo.Connect(context.Background(),clientOptions)

	if err != nil {
		log.Fatal(err)
	}

	defer client.Disconnect(context.Background())

	err = client.Ping(context.Background(), nil)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println("connected to Mongodb Atlas")

	collection = client.Database("golang_db").Collection("todos")

	app := fiber.New()

	// app.Use(cors.New(cors.Config{
	// 	AllowOrigins: []string{"http://localhost:5173"},
	// 	AllowHeaders: []string{"Origin", "Content-Type", "Accept"},
	// }))

	app.Get("/api/todos", getTodos)
	app.Post("/api/todos", createTodo)
	app.Patch("/api/todos/:id", updateTodo)
	app.Delete("/api/todos/:id", deleteTodo)

	port := os.Getenv("PORT")

	if port == "" {
		port = "5000"
	}

	if os.Getenv("ENV") == "production" {
		app.Use(static.New(static.Config{
			Root:   "./client/dist",
			Browse: true,
		}))
	}

	log.Fatal(app.Listen("0.0.0.0:"+port))

}

// get all todo
func getTodos(c fiber.Ctx) error {
	var todos []Todo

	cursor, err :=collection.Find(context.Background(),bson.M{})

	if err != nil{
		return err
	}

	defer cursor.Close(context.Background())

	for cursor.Next(context.Background()){
		var todo Todo

		if err:= cursor.Decode(&todo); err != nil {
			return err
		}

		todos = append(todos, todo)
	}
	return c.JSON(todos) 
}

// create a todo

func createTodo(c fiber.Ctx) error {
	todo := new(Todo)

	if err := c.Bind().Body(todo); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	if todo.Body == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Todo body can't be empty"})
	}

	insertResult, err := collection.InsertOne(context.Background(), todo)

	if err != nil {
		return err
	}

	todo.ID, _ = insertResult.InsertedID.(primitive.ObjectID)

	return c.Status(200).JSON(todo)
}

// update a todo 

func updateTodo(c fiber.Ctx) error {
	id := c.Params("id")

	objectID, err := primitive.ObjectIDFromHex(id)

	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid todo id"})
	}

	filter := bson.M{"_id":objectID}
	update := bson.M{"$set": bson.M{"completed": true}}

	_,err = collection.UpdateOne(context.Background(), filter, update)

	if err != nil {
		return err
	}

	return c.Status(200).JSON(fiber.Map{"success": true})
}

// delete a todo

func deleteTodo(c fiber.Ctx) error {
	id := c.Params("id")
	objectID, err := primitive.ObjectIDFromHex(id)

	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid todo id"})
	}

	filter := bson.M{"_id":objectID}

	_, err = collection.DeleteOne(context.Background(), filter)

	if err != nil {
		return err
	}

	return c.Status(200).JSON(fiber.Map{"success": true})
}