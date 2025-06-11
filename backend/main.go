package main

import (
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables from .env file
	err := godotenv.Load()
	if err != nil {
		log.Fatalf("Error loading .env file: %v", err)
	}

	// Initialize Database
	InitDatabase()

	// Initialize Firebase Admin SDK (for token verification)
	err = InitFirebase()
	if err != nil {
		log.Fatalf("Failed to initialize Firebase: %v", err)
	}

	r := gin.Default()

	// Configure trusted proxies for security
	r.SetTrustedProxies([]string{"127.0.0.1", "::1"}) // Only trust localhost

	// Configure CORS to allow frontend communication
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"}, // Allow all origins for production deployment
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Length", "Content-Type", "Authorization", "Accept", "X-Requested-With"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: false, // Must be false when AllowOrigins is "*"
		MaxAge:           12 * time.Hour,
	}))

	// Public route example
	r.GET("/public", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "This is a public endpoint"})
	})

	// Ping endpoint for testing connectivity
	r.GET("/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "pong",
		})
	})

	// Protected routes (require authentication)
	protected := r.Group("/")
	protected.Use(FirebaseAuthMiddleware())

	// User APIs
	protected.GET("/user", GetCurrentUser)                                        // GET /user - Get current user profile
	protected.PUT("/user", UpdateCurrentUser)                                     // PUT /user - Update current user profile
	protected.POST("/user", CreateUser)                                           // POST /user
	protected.GET("/user/:userID", GetUserBasic)                                  // GET /user/:userID
	protected.GET("/user/rides/posted", GetRidesPostedByUser)                     // GET /user/rides/posted
	protected.GET("/user/rides/joined", GetRidesJoinedByUser)                     // GET /user/rides/joined
	protected.GET("/user/privileges", GetUserPrivileges)                          // GET /user/privileges
	protected.GET("/user/requests", GetUserSentRequests)                          // GET /user/requests
	protected.DELETE("/user/clear-involvement/:date", ClearInvolvementForDate)    // DELETE /user/clear-involvement/:date
	protected.GET("/user/notifications", GetUserNotifications)                    // GET /user/notifications
	protected.GET("/user/notifications/unread-count", GetUnreadNotificationCount) // GET /user/notifications/unread-count
	protected.PUT("/user/notifications/mark-all-read", MarkAllNotificationsAsRead) // PUT /user/notifications/mark-all-read
	protected.DELETE("/user/cancel-ride/:rideID", CancelRideParticipation)        // DELETE /user/cancel-ride/:rideID (unified)

	// Ride APIs
	protected.POST("/ride", AddRide)                                    // POST /ride
	protected.DELETE("/ride/:rideID", DeleteRide)                       // DELETE /ride/:rideID - Leader deletes their ride
	protected.GET("/ride/:rideID/leader", GetRideLeader)                // GET /ride/:rideID/leader
	r.GET("/ride/filter", FilterRides)                                  // GET /rides/filter?origin=College Campus&destination=City Airport&date=2025-06-10
	protected.GET("/ride/:rideID/requests", GetJoinRequestsForRide)     // GET /ride/:rideID/requests
	protected.POST("/ride/:rideID/join", SendJoinRequest)               // POST /ride/:rideID/join
	protected.DELETE("/ride/:rideID/cancel-request", CancelJoinRequest) // DELETE /ride/:rideID/cancel-request
	protected.POST("/ride/:rideID/join-ride", JoinRideWithPrivilege)    // POST /ride/:rideID/join-ride

	// Participant Management APIs (Leaders only)
	protected.GET("/ride/:rideID/participants", GetRideParticipants)                // GET /ride/:rideID/participants
	protected.DELETE("/ride/:rideID/participant/:participantID", RemoveParticipant) // DELETE /ride/:rideID/participant/:participantID
	protected.POST("/ride/:rideID/approve/:requestID", ApproveJoinRequest)          // POST /ride/:rideID/approve/:requestID
	protected.POST("/ride/:rideID/reject/:requestID", RejectJoinRequest)            // POST /ride/:rideID/reject/:requestID

	// Notification APIs
	protected.POST("/notification/:notificationID/read", MarkNotificationAsRead) // POST /notification/:notificationID/read

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("🚀 Brocab server running on port %s", port)
	r.Run(":" + port)
}
