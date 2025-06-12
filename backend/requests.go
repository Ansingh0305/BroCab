package main

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

type Request struct {
	ID        uint      `gorm:"primaryKey"`
	RideID    uint      `gorm:"not null"`
	UserID    string    `gorm:"not null" json:"-"`
	Status    string    `gorm:"not null"`     // "pending", "approved", or "revoked"
	RevokedAt time.Time `gorm:"default:null"` // Used to check re-join cooldown
	CreatedAt time.Time
	UpdatedAt time.Time
}

// POST /ride/:rideID/join
func SendJoinRequest(c *gin.Context) {
	rideIDStr := c.Param("rideID")
	rideID, err := strconv.Atoi(rideIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ride ID"})
		return
	}

	userID := c.MustGet("uid").(string)

	// Get the ride details to check the date
	var targetRide Ride
	if err := DB.First(&targetRide, "id = ?", rideID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Ride not found"})
		return
	}

	// Get user to find their ID for comparison
	user, err := getUser(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Get ride leader information for notification
	rideLeader, err := getUserByID(targetRide.LeaderID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get ride leader information"})
		return
	}

	// Check if user has already created a ride on the same date
	var existingRideCount int64
	if err := DB.Model(&Ride{}).Where("leader_id = ? AND date = ?", user.ID, targetRide.Date).Count(&existingRideCount).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check existing rides"})
		return
	}

	if existingRideCount > 0 {
		c.JSON(http.StatusConflict, gin.H{
			"error": "You cannot send a join request and create a ride on the same day. You have already created a ride for " + targetRide.Date,
		})
		return
	}

	// Check if a request already exists
	var existing Request
	if err := DB.Where("ride_id = ? AND user_id = ?", rideID, userID).First(&existing).Error; err == nil {
		if strings.Contains(strings.ToLower(existing.Status), "pending") {
			c.JSON(http.StatusConflict, gin.H{"error": "Request already pending"})
			return
		}
		if strings.Contains(strings.ToLower(existing.Status), "approved") {
			c.JSON(http.StatusConflict, gin.H{"error": "Already approved for this ride"})
			return
		}
		if strings.Contains(strings.ToLower(existing.Status), "revoked") {
			// Check if 30 minutes have passed since revocation
			timeSinceRevoked := time.Since(existing.RevokedAt)
			cooldownPeriod := 30 * time.Minute

			if timeSinceRevoked < cooldownPeriod {
				remainingTime := cooldownPeriod - timeSinceRevoked
				remainingMinutes := int(remainingTime.Minutes())
				c.JSON(http.StatusConflict, gin.H{
					"error":                      fmt.Sprintf("Request was revoked. Please wait %d more minutes before resending.", remainingMinutes+1),
					"remaining_cooldown_minutes": remainingMinutes + 1,
				})
				return
			}
			// Cooldown period has passed, allow new request by deleting the old revoked record
			if err := DB.Delete(&existing).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to clear old request"})
				return
			}
		}
	}

	// Create new join request
	request := Request{
		RideID: uint(rideID),
		UserID: userID,
		Status: "pending",
	}

	if err := DB.Create(&request).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create join request"})
		return
	}

	// Send notification to ride leader
	notificationTitle := "New Join Request"
	notificationMessage := fmt.Sprintf("%s has requested to join your ride from %s to %s on %s at %s",
		user.Name, targetRide.Origin, targetRide.Destination, targetRide.Date, targetRide.Time)

	if err := createNotification(rideLeader.FirebaseUID, notificationTitle, notificationMessage, "join_request", uint(rideID)); err != nil {
		// Log error but don't fail the request since the join request was created successfully
		fmt.Printf("Failed to create notification for ride leader %s: %v\n", rideLeader.FirebaseUID, err)
	}

	c.JSON(http.StatusOK, gin.H{"message": "Join request sent"})
}

// DELETE /ride/:rideID/cancel-request - User cancels their pending join request
func CancelJoinRequest(c *gin.Context) {
	rideIDStr := c.Param("rideID")
	rideID, err := strconv.Atoi(rideIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ride ID"})
		return
	}

	userID := c.MustGet("uid").(string)

	// Find the pending request - using ILIKE for case insensitive matching
	var request Request
	if err := DB.Where("ride_id = ? AND user_id = ? AND status ILIKE ?", rideID, userID, "%pending%").First(&request).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "No pending request found for this ride"})
		return
	}

	// Delete the pending request
	if err := DB.Delete(&request).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to cancel request"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Join request cancelled successfully"})
}

// GET /user/requests - Get all join requests sent by the authenticated user
func GetUserSentRequests(c *gin.Context) {
	userID := c.MustGet("uid").(string)

	// Find all requests sent by the user
	var requests []Request
	if err := DB.Where("user_id = ?", userID).Order("created_at DESC").Find(&requests).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch your requests"})
		return
	}

	// Build response with request and ride details
	var response []map[string]interface{}
	for _, req := range requests {
		var ride Ride
		if err := DB.First(&ride, "id = ?", req.RideID).Error; err != nil {
			continue // Skip if ride doesn't exist
		}

		// Get ride leader info
		leader, err := getUser(ride.LeaderID)
		if err != nil {
			continue // Skip if leader doesn't exist
		}

		// Determine if user can take action on this request
		canCancel := strings.Contains(strings.ToLower(req.Status), "pending")
		canJoin := strings.Contains(strings.ToLower(req.Status), "approved") && ride.SeatsFilled < ride.Seats

		// Calculate cooldown for revoked requests
		var cooldownInfo map[string]interface{}
		if strings.Contains(strings.ToLower(req.Status), "revoked") {
			timeSinceRevoked := time.Since(req.RevokedAt)
			cooldownPeriod := 30 * time.Minute
			if timeSinceRevoked < cooldownPeriod {
				remainingTime := cooldownPeriod - timeSinceRevoked
				remainingMinutes := int(remainingTime.Minutes())
				cooldownInfo = map[string]interface{}{
					"can_resend":        false,
					"remaining_minutes": remainingMinutes + 1,
				}
			} else {
				cooldownInfo = map[string]interface{}{
					"can_resend":        true,
					"remaining_minutes": 0,
				}
			}
		}

		entry := map[string]interface{}{
			"request_id":      req.ID,
			"ride_id":         ride.ID,
			"origin":          ride.Origin,
			"destination":     ride.Destination,
			"date":            ride.Date,
			"time":            ride.Time,
			"price":           ride.Price,
			"seats_available": ride.Seats - ride.SeatsFilled,
			"total_seats":     ride.Seats,
			"status":          req.Status,
			"leader_name":     leader.Name,
			"requested_at":    req.CreatedAt,
			"updated_at":      req.UpdatedAt,
			"can_cancel":      canCancel,
			"can_join":        canJoin,
		}

		// Add cooldown info for revoked requests
		if cooldownInfo != nil {
			entry["cooldown"] = cooldownInfo
		}

		response = append(response, entry)
	}

	c.JSON(http.StatusOK, response)
}

// DELETE /user/clear-involvement/:date - Cancel all pending requests and privileges for a specific date
func ClearInvolvementForDate(c *gin.Context) {
	dateParam := c.Param("date")
	userID := c.MustGet("uid").(string)

	// Validate date format
	if _, err := time.Parse("2006-01-02", dateParam); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format, expected YYYY-MM-DD"})
		return
	}

	// Find all pending requests for rides on this date - using ILIKE for case insensitive matching
	var pendingRequestsForDate []Request
	if err := DB.Table("requests").
		Joins("JOIN rides ON requests.ride_id = rides.id").
		Where("requests.user_id = ? AND requests.status ILIKE ? AND rides.date = ?",
			userID, "%pending%", dateParam).
		Find(&pendingRequestsForDate).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch pending requests for date"})
		return
	}

	// Find all approved privileges for rides on this date - using ILIKE for case insensitive matching
	var approvedRequestsForDate []Request
	if err := DB.Table("requests").
		Joins("JOIN rides ON requests.ride_id = rides.id").
		Where("requests.user_id = ? AND requests.status ILIKE ? AND rides.date = ?",
			userID, "%approved%", dateParam).
		Find(&approvedRequestsForDate).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch privileges for date"})
		return
	}

	pendingCount := len(pendingRequestsForDate)
	approvedCount := len(approvedRequestsForDate)
	totalCount := pendingCount + approvedCount

	if totalCount == 0 {
		c.JSON(http.StatusOK, gin.H{
			"message":              fmt.Sprintf("No requests or privileges to cancel for %s", dateParam),
			"cancelled_requests":   0,
			"cancelled_privileges": 0,
			"total_cancelled":      0,
			"date":                 dateParam,
		})
		return
	}

	// Cancel pending requests for this date
	if pendingCount > 0 {
		requestIDs := make([]uint, len(pendingRequestsForDate))
		for i, req := range pendingRequestsForDate {
			requestIDs[i] = req.ID
		}
		if err := DB.Where("id IN ?", requestIDs).Delete(&Request{}).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to cancel pending requests"})
			return
		}
	}

	// Cancel approved privileges for this date
	if approvedCount > 0 {
		requestIDs := make([]uint, len(approvedRequestsForDate))
		for i, req := range approvedRequestsForDate {
			requestIDs[i] = req.ID
		}
		if err := DB.Where("id IN ?", requestIDs).Delete(&Request{}).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to cancel privileges"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message":              fmt.Sprintf("Successfully cleared all ride involvement for %s", dateParam),
		"cancelled_requests":   pendingCount,
		"cancelled_privileges": approvedCount,
		"total_cancelled":      totalCount,
		"date":                 dateParam,
	})
}

// GET /user/check-involvement/:date - Check if user has any involvement for a specific date
func CheckInvolvementForDate(c *gin.Context) {
	dateParam := c.Param("date")
	userID := c.MustGet("uid").(string)

	// Validate date format
	if _, err := time.Parse("2006-01-02", dateParam); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format, expected YYYY-MM-DD"})
		return
	}

	user, err := getUser(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	involvement := map[string]interface{}{
		"has_involvement": false,
		"date":            dateParam,
		"details": map[string]interface{}{
			"posted_rides":        []map[string]interface{}{},
			"joined_rides":        []map[string]interface{}{},
			"pending_requests":    []map[string]interface{}{},
			"approved_privileges": []map[string]interface{}{},
		},
		"summary": map[string]int{
			"posted_count":   0,
			"joined_count":   0,
			"pending_count":  0,
			"approved_count": 0,
			"total_count":    0,
		},
	}

	// 1. Check for posted rides (user is the leader)
	var postedRides []Ride
	if err := DB.Where("leader_id = ? AND date = ?", user.ID, dateParam).Find(&postedRides).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check posted rides"})
		return
	}

	postedRideDetails := []map[string]interface{}{}
	for _, ride := range postedRides {
		postedRideDetails = append(postedRideDetails, map[string]interface{}{
			"ride_id":      ride.ID,
			"origin":       ride.Origin,
			"destination":  ride.Destination,
			"time":         ride.Time,
			"seats":        ride.Seats,
			"seats_filled": ride.SeatsFilled,
			"price":        ride.Price,
		})
	}

	// 2. Check for joined rides (user is a participant)
	var participants []Participant
	if err := DB.Table("participants").
		Joins("JOIN rides ON participants.ride_id = rides.id").
		Where("participants.user_id = ? AND rides.date = ?", userID, dateParam).
		Find(&participants).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check joined rides"})
		return
	}

	joinedRideDetails := []map[string]interface{}{}
	for _, participant := range participants {
		var ride Ride
		if err := DB.First(&ride, "id = ?", participant.RideID).Error; err == nil {
			// Get leader info
			leader, err := getUserByID(ride.LeaderID)
			leaderName := "Unknown"
			if err == nil {
				leaderName = leader.Name
			}

			joinedRideDetails = append(joinedRideDetails, map[string]interface{}{
				"ride_id":     ride.ID,
				"origin":      ride.Origin,
				"destination": ride.Destination,
				"time":        ride.Time,
				"price":       ride.Price,
				"leader_name": leaderName,
				"joined_at":   participant.JoinedAt,
			})
		}
	}

	// 3. Check for pending requests
	var pendingRequests []Request
	if err := DB.Table("requests").
		Joins("JOIN rides ON requests.ride_id = rides.id").
		Where("requests.user_id = ? AND requests.status ILIKE ? AND rides.date = ?",
			userID, "%pending%", dateParam).
		Find(&pendingRequests).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check pending requests"})
		return
	}

	pendingRequestDetails := []map[string]interface{}{}
	for _, request := range pendingRequests {
		var ride Ride
		if err := DB.First(&ride, "id = ?", request.RideID).Error; err == nil {
			// Get leader info
			leader, err := getUserByID(ride.LeaderID)
			leaderName := "Unknown"
			if err == nil {
				leaderName = leader.Name
			}

			pendingRequestDetails = append(pendingRequestDetails, map[string]interface{}{
				"request_id":   request.ID,
				"ride_id":      ride.ID,
				"origin":       ride.Origin,
				"destination":  ride.Destination,
				"time":         ride.Time,
				"price":        ride.Price,
				"leader_name":  leaderName,
				"requested_at": request.CreatedAt,
			})
		}
	}

	// 4. Check for approved privileges
	var approvedRequests []Request
	if err := DB.Table("requests").
		Joins("JOIN rides ON requests.ride_id = rides.id").
		Where("requests.user_id = ? AND requests.status ILIKE ? AND rides.date = ?",
			userID, "%approved%", dateParam).
		Find(&approvedRequests).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check approved privileges"})
		return
	}

	approvedPrivilegeDetails := []map[string]interface{}{}
	for _, request := range approvedRequests {
		var ride Ride
		if err := DB.First(&ride, "id = ?", request.RideID).Error; err == nil {
			// Get leader info
			leader, err := getUserByID(ride.LeaderID)
			leaderName := "Unknown"
			if err == nil {
				leaderName = leader.Name
			}

			approvedPrivilegeDetails = append(approvedPrivilegeDetails, map[string]interface{}{
				"request_id":      request.ID,
				"ride_id":         request.RideID,
				"origin":          ride.Origin,
				"destination":     ride.Destination,
				"time":            ride.Time,
				"price":           ride.Price,
				"leader_name":     leaderName,
				"approved_at":     request.UpdatedAt,
				"seats_available": ride.Seats - ride.SeatsFilled,
				"can_join":        ride.SeatsFilled < ride.Seats,
			})
		}
	}

	// Update involvement details and summary
	postedCount := len(postedRides)
	joinedCount := len(participants)
	pendingCount := len(pendingRequests)
	approvedCount := len(approvedRequests)
	totalCount := postedCount + joinedCount + pendingCount + approvedCount

	involvement["has_involvement"] = totalCount > 0
	involvement["details"].(map[string]interface{})["posted_rides"] = postedRideDetails
	involvement["details"].(map[string]interface{})["joined_rides"] = joinedRideDetails
	involvement["details"].(map[string]interface{})["pending_requests"] = pendingRequestDetails
	involvement["details"].(map[string]interface{})["approved_privileges"] = approvedPrivilegeDetails

	involvement["summary"].(map[string]int)["posted_count"] = postedCount
	involvement["summary"].(map[string]int)["joined_count"] = joinedCount
	involvement["summary"].(map[string]int)["pending_count"] = pendingCount
	involvement["summary"].(map[string]int)["approved_count"] = approvedCount
	involvement["summary"].(map[string]int)["total_count"] = totalCount

	c.JSON(http.StatusOK, involvement)
}
