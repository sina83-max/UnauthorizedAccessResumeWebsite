package email

import (
	"log"

	"portfolio-api/internal/models"
)

// ContactChan is a buffered channel for contact form messages.
// Buffer size 50 means the producer (HTTP handler) can send 50
// messages without blocking, even if the consumer (goroutine) is slow.
var ContactChan chan models.ContactMessage

// Init creates the channel and starts the consumer goroutine.
// Call this once at application startup in main.go.
func Init() {
	// make() creates a channel with a buffer of 50.
	ContactChan = make(chan models.ContactMessage, 50)

	// Start the consumer goroutine.
	// go func() { ... }() launches a new goroutine (lightweight thread).
	// This goroutine runs forever, reading from the channel.
	go consumeContacts()

	log.Println("✓ Email notifier initialized (stub mode — logging only)")
}

// Enqueue is called by the HTTP handler to send a message to the channel.
// It uses a select statement for non-blocking send:
//   - If the channel has space, send the message (case ContactChan <- msg)
//   - If the channel is full, log a warning instead of blocking (default case)
//
// This prevents the HTTP handler from hanging if the consumer is slow.
func Enqueue(msg models.ContactMessage) {
	select {
	case ContactChan <- msg:
		log.Printf("[contact] Queued message from %s <%s>", msg.Name, msg.Email)
	default:
		// Channel is full (50 pending messages). Drop the message
		// rather than blocking the HTTP response.
		log.Println("[contact] ⚠ Channel full, message dropped")
	}
}

// consumeContacts runs in its own goroutine, reading from the channel.
// for msg := range channel reads until the channel is closed.
// In production, this is where we call an email API (SendGrid, SMTP, etc.)
func consumeContacts() {
	for msg := range ContactChan {
		// V1 stub: Just log the message.
		// In future, will replace by real email API
		log.Printf("[contact] ← New message from %s <%s>", msg.Name, msg.Email)
		log.Printf("[contact]   Message: %s", msg.Message)
	}
}
