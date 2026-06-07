package executiongrpc

import (
	"testing"

	"google.golang.org/grpc/encoding"
	_ "google.golang.org/grpc/encoding/proto"
)

func TestProximityRequestCanBeMarshaledByGrpcCodec(t *testing.T) {
	codec := encoding.GetCodec("proto")
	request := &ProximityRequest{
		SessionId: 12,
		TouristId: 34,
		Latitude:  44.8176,
		Longitude: 20.4633,
	}

	payload, err := codec.Marshal(request)
	if err != nil {
		t.Fatalf("marshal proximity request: %v", err)
	}

	var decoded ProximityRequest
	if err := codec.Unmarshal(payload, &decoded); err != nil {
		t.Fatalf("unmarshal proximity request: %v", err)
	}

	if decoded != *request {
		t.Fatalf("decoded proximity request = %+v, want %+v", decoded, *request)
	}
}
