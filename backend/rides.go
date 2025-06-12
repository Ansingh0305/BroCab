package main

import (
	"fmt"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type Ride struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	LeaderID    uint      `json:"leader_id"`
	Origin      string    `json:"origin"`
	Destination string    `json:"destination"`
	Date        string    `json:"date"` // e.g. "2025-05-20"
	Time        string    `json:"time"` // e.g. "15:30"
	Seats       int       `json:"seats"`
	SeatsFilled int       `json:"seats_filled"`
	Price       float64   `json:"price"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// POST /ride
func AddRide(c *gin.Context) {
	var ride Ride

	if err := c.ShouldBindJSON(&ride); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input: " + err.Error()})
		return
	}

	userID, exists := c.Get("uid")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Convert Firebase UID (string) to find the user's ID
	user, err := getUser(userID.(string))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	ride.LeaderID = user.ID

	if _, err := time.Parse("15:04", ride.Time); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid time format, expected HH:mm"})
		return
	}

	if _, err := time.Parse("2006-01-02", ride.Date); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format, expected YYYY-MM-DD"})
		return
	}

	// Check for any existing involvement on this date
	hasInvolvement, involvementDetails := checkUserInvolvementForDate(userID.(string), user.ID, ride.Date)

	if hasInvolvement {
		c.JSON(http.StatusConflict, gin.H{
			"error":               "You are already involved in rides for this date. Please clear your involvement first.",
			"involvement_details": involvementDetails,
			"action_required":     "clear_involvement",
			"date":                ride.Date,
		})
		return
	}

	ride.SeatsFilled = 0

	if err := DB.Create(&ride).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not save ride: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Ride added successfully", "ride": ride})
}

// GET /user/rides/posted
func GetRidesPostedByUser(c *gin.Context) {
	userID := c.MustGet("uid").(string)

	user, err := getUser(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	var rides []Ride
	if err := DB.Where("leader_id = ?", user.ID).Find(&rides).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch rides"})
		return
	}

	c.JSON(http.StatusOK, rides)
}

// GET /user/rides/joined
func GetRidesJoinedByUser(c *gin.Context) {
	userID := c.MustGet("uid").(string)

	// Find all rides where user is actually a participant (not just approved)
	var participants []Participant
	if err := DB.Where("user_id = ?", userID).Find(&participants).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch participant data"})
		return
	}

	rideIDs := make([]uint, 0, len(participants))
	for _, p := range participants {
		rideIDs = append(rideIDs, p.RideID)
	}

	var rides []Ride
	if len(rideIDs) > 0 {
		if err := DB.Where("id IN ?", rideIDs).Find(&rides).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch rides"})
			return
		}
	}

	c.JSON(http.StatusOK, rides)
}

// GET /rides/filter?origin=College Campus&destination=City Airport&date=2025-06-10
func FilterRides(c *gin.Context) {
	origin := c.Query("origin")
	destination := c.Query("destination")
	date := c.Query("date")

	var rides []Ride

	// Use SafeQuery to handle potential prepared statement conflicts9AM
	err := SafeQuery(func() error {
		return DB.Where("origin = ? AND destination = ? AND date = ?", origin, destination, date).Find(&rides).Error
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch rides"})
		return
	}

	c.JSON(http.StatusOK, rides)
}

// GET /rides/:rideID/requests
func GetJoinRequestsForRide(c *gin.Context) {
	rideIDParam := c.Param("rideID")
	rideID, err := strconv.Atoi(rideIDParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ride ID"})
		return
	}

	userID := c.MustGet("uid").(string)

	var ride Ride
	if err := DB.First(&ride, "id = ?", rideID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Ride not found"})
		return
	}

	user, err := getUser(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	if ride.LeaderID != user.ID {
		c.JSON(http.StatusForbidden, gin.H{"error": "You are not the leader of this ride"})
		return
	}

	var requests []Request
	if err := DB.Where("ride_id = ? AND status = ?", rideID, "pending").Find(&requests).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch join requests"})
		return
	}

	// Build response with request details
	var response []map[string]interface{}
	for _, r := range requests {
		user, err := getUser(r.UserID)
		if err != nil {
			continue // skip if user doesn't exist
		}

		entry := map[string]interface{}{
			"request_id": r.ID,
			"name":       user.Name,
			"gender":     user.Gender,
			"status":     r.Status,
		}
		response = append(response, entry)
	}

	c.JSON(http.StatusOK, response)
}

// DELETE /ride/:rideID - Leader deletes their own ride
func DeleteRide(c *gin.Context) {
	rideIDParam := c.Param("rideID")
	rideID, err := strconv.Atoi(rideIDParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ride ID"})
		return
	}

	userID := c.MustGet("uid").(string)

	// Get the ride to be deleted
	var ride Ride
	if err := DB.First(&ride, "id = ?", rideID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Ride not found"})
		return
	}

	// Get current user to verify they are the leader
	user, err := getUser(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Check if the current user is the leader of this ride
	if ride.LeaderID != user.ID {
		c.JSON(http.StatusForbidden, gin.H{"error": "You are not the leader of this ride"})
		return
	}

	// Get all participants to notify them
	var participants []Participant
	if err := DB.Where("ride_id = ?", rideID).Find(&participants).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch participants"})
		return
	}

	// Start a transaction to ensure data consistency
	tx := DB.Begin()
	if tx.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start transaction"})
		return
	}

	// Delete all related data in the correct order to avoid foreign key constraints

	// 1. Delete all notifications related to this ride
	if err := tx.Where("ride_id = ?", rideID).Delete(&Notification{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete ride notifications"})
		return
	}

	// 2. Delete all participants
	if err := tx.Where("ride_id = ?", rideID).Delete(&Participant{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete participants"})
		return
	}

	// 3. Delete all join requests
	if err := tx.Where("ride_id = ?", rideID).Delete(&Request{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete join requests"})
		return
	}

	// 4. Finally delete the ride itself
	if err := tx.Delete(&ride).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete ride"})
		return
	}

	// Commit the transaction
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	// Send notifications to all participants about the ride cancellation
	title := "Ride Cancelled by Leader"
	message := fmt.Sprintf("The ride from %s to %s on %s at %s has been cancelled by the leader %s",
		ride.Origin, ride.Destination, ride.Date, ride.Time, user.Name)

	notificationCount := 0
	for _, participant := range participants {
		if err := createNotification(participant.UserID, title, message, "ride_cancelled", uint(rideID)); err != nil {
			// Log error but don't fail the request
			fmt.Printf("Failed to create notification for participant %s: %v\n", participant.UserID, err)
		} else {
			notificationCount++
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message":               fmt.Sprintf("Ride deleted successfully. %d participants have been notified.", notificationCount),
		"participants_notified": notificationCount,
		"ride_id":               rideID,
	})
}

// cleanupExpiredRides removes all rides with dates that have already passed
func cleanupExpiredRides() {
	currentDate := time.Now().Format("2006-01-02")

	// Find all rides with dates before today
	var expiredRides []Ride
	if err := DB.Where("date < ?", currentDate).Find(&expiredRides).Error; err != nil {
		log.Printf("Failed to find expired rides: %v", err)
		return
	}

	if len(expiredRides) == 0 {
		log.Println("No expired rides found")
		return
	}

	// Start a transaction to ensure data consistency
	tx := DB.Begin()
	if tx.Error != nil {
		log.Printf("Failed to start transaction for cleanup: %v", tx.Error)
		return
	}

	deletedCount := 0
	for _, ride := range expiredRides {
		// Get all participants for this ride to send completion notifications
		var participants []Participant
		if err := tx.Where("ride_id = ?", ride.ID).Find(&participants).Error; err != nil {
			log.Printf("Failed to fetch participants for ride %d: %v", ride.ID, err)
			continue
		}

		// Get ride leader details for the completion notification
		var leader User
		if err := tx.First(&leader, "id = ?", ride.LeaderID).Error; err != nil {
			log.Printf("Failed to fetch leader for ride %d: %v", ride.ID, err)
			continue
		}

		// Send "Ride Completed" notifications to all participants BEFORE deleting
		participantCount := len(participants)
		title := "Ride Completed"
		message := fmt.Sprintf("Your ride from %s to %s on %s at %s with leader %s has been completed. Total participants: %d",
			ride.Origin, ride.Destination, ride.Date, ride.Time, leader.Name, participantCount)

		// Send completion notification to all participants
		for _, participant := range participants {
			if err := createNotification(participant.UserID, title, message, "ride_completed", ride.ID); err != nil {
				log.Printf("Failed to create completion notification for participant %s: %v", participant.UserID, err)
			}
		}

		// Also send completion notification to the leader
		leaderMessage := fmt.Sprintf("Your ride from %s to %s on %s at %s has been completed. Total participants: %d",
			ride.Origin, ride.Destination, ride.Date, ride.Time, participantCount)
		if err := createNotification(leader.FirebaseUID, title, leaderMessage, "ride_completed", ride.ID); err != nil {
			log.Printf("Failed to create completion notification for leader %s: %v", leader.FirebaseUID, err)
		}

		// Delete ride-related data (but keep notifications for history)
		// 1. Delete all participants
		if err := tx.Where("ride_id = ?", ride.ID).Delete(&Participant{}).Error; err != nil {
			log.Printf("Failed to delete participants for ride %d: %v", ride.ID, err)
			continue
		}

		// 2. Delete all join requests
		if err := tx.Where("ride_id = ?", ride.ID).Delete(&Request{}).Error; err != nil {
			log.Printf("Failed to delete requests for ride %d: %v", ride.ID, err)
			continue
		}

		// 3. Finally delete the ride itself
		if err := tx.Delete(&ride).Error; err != nil {
			log.Printf("Failed to delete expired ride %d: %v", ride.ID, err)
			continue
		}

		// NOTE: We intentionally DO NOT delete notifications - they serve as ride history
		deletedCount++
	}

	// Commit the transaction
	if err := tx.Commit().Error; err != nil {
		log.Printf("Failed to commit cleanup transaction: %v", err)
		return
	}

	log.Printf("✅ Cleanup completed: %d expired rides deleted (out of %d found). Completion notifications sent to all participants.", deletedCount, len(expiredRides))
}
