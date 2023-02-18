package auth

import (
	"crypto/rand"
	"encoding/hex"

	"github.com/pkg/errors"
	"go.signoz.io/signoz/pkg/query-service/constants"
	"go.signoz.io/signoz/pkg/query-service/model"
)

var (
	ErrorEmptyRequest = errors.New("Empty request")
	ErrorInvalidEmail = errors.New("Invalid email")
	ErrorInvalidRole  = errors.New("Invalid role")

	ErrorInvalidInviteToken = errors.New("Invalid invite token")
	ErrorAskAdmin           = errors.New("You are not allowed to create an account. Please ask your admin to send an invite link")
)

func randomHex(sz int) (string, error) {
	bytes := make([]byte, sz)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

func isValidRole(role string) bool {
	switch role {
	case constants.AdminGroup, constants.EditorGroup, constants.ViewerGroup:
		return true
	default:
		return false
	}
	return false
}

func validateInviteRequest(req *model.InviteRequest) error {
	if req == nil {
		return ErrorEmptyRequest
	}
	if !isValidEmail(req.Email) {
		return ErrorInvalidEmail
	}

	if !isValidRole(req.Role) {
		return ErrorInvalidRole
	}
	return nil
}

// TODO(Ahsan): Implement check on email semantic.
func isValidEmail(email string) bool {
	return true
}
