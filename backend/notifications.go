package main

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// Notification represents a notification sent to a user
type Notification struct {
	ID        uint   `gorm:"primaryKey"`
	UserID    string `gorm:"not null" json:"-"` // Firebase UID of the recipient - hidden from JSON
	Title     string `gorm:"type:varchar(200);not null"`
	Message   string `gorm:"type:text;not null"`
	Type      string `gorm:"type:varchar(50);not null"` // "participant_removed", "ride_cancelled"
	RideID    uint   `gorm:"not null"`
	IsRead    bool   `gorm:"default:false"`
	CreatedAt time.Time
	UpdatedAt time.Time
}

// Create a notification and save it to database
func createNotification(userID string, title, message, notificationType string, rideID uint) error {
	notification := Notification{
		UserID:    userID,
		Title:     title,
		Message:   message,
		Type:      notificationType,
		RideID:    rideID,
		IsRead:    false,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := DB.Create(&notification).Error; err != nil {
		return err
	}

	return nil
}

// GET /user/notifications - Get all notifications for the authenticated user
func GetUserNotifications(c *gin.Context) {
	userID := c.MustGet("uid").(string)

	var notifications []Notification
	if err := DB.Where("user_id = ?", userID).Order("created_at DESC").Find(&notifications).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch notifications"})
		return
	}

	// Build response with ride details
	var response []map[string]interface{}
	for _, n := range notifications {
		entry := map[string]interface{}{
			"id":         n.ID,
			"title":      n.Title,
			"message":    n.Message,
			"type":       n.Type,
			"ride_id":    n.RideID,
			"is_read":    n.IsRead,
			"created_at": n.CreatedAt,
		}

		// Try to get ride details, but don't skip notification if ride doesn't exist
		var ride Ride
		if err := DB.First(&ride, "id = ?", n.RideID).Error; err == nil {
			// Ride exists - include full details
			entry["origin"] = ride.Origin
			entry["destination"] = ride.Destination
			entry["date"] = ride.Date
			entry["time"] = ride.Time
			entry["ride_status"] = "active"
		} else {
			// Ride was deleted - show limited info for historical context
			entry["origin"] = "Unknown"
			entry["destination"] = "Unknown"
			entry["date"] = "Unknown"
			entry["time"] = "Unknown"
			entry["ride_status"] = "deleted"
		}

		response = append(response, entry)
	}

	c.JSON(http.StatusOK, response)
}

// POST /notification/:notificationID/read - Mark notification as read
func MarkNotificationAsRead(c *gin.Context) {
	notificationID := c.Param("notificationID")
	userID := c.MustGet("uid").(string)

	// Update notification as read only if it belongs to the authenticated user
	result := DB.Model(&Notification{}).
		Where("id = ? AND user_id = ?", notificationID, userID).
		Update("is_read", true)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to mark notification as read"})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Notification not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Notification marked as read"})
}

// GET /user/notifications/unread-count - Get count of unread notifications
func GetUnreadNotificationCount(c *gin.Context) {
	userID := c.MustGet("uid").(string)

	var count int64
	if err := DB.Model(&Notification{}).Where("user_id = ? AND is_read = ?", userID, false).Count(&count).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count notifications"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"unread_count": count})
}

// PUT /user/notifications/mark-all-read - Mark all notifications as read for the user
func MarkAllNotificationsAsRead(c *gin.Context) {
	userID := c.MustGet("uid").(string)

	// Update all unread notifications for this user
	result := DB.Model(&Notification{}).
		Where("user_id = ? AND is_read = ?", userID, false).
		Update("is_read", true)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to mark notifications as read"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":       "All notifications marked as read",
		"updated_count": result.RowsAffected,
	})
}
