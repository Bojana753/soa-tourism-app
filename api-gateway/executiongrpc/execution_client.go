package executiongrpc

import (
	"context"
	"fmt"

	"google.golang.org/grpc"
)

// These message structs mirror proto/execution.proto. Keeping the gateway
// client small avoids requiring protoc in the lightweight Go gateway image.
type ProximityRequest struct {
	SessionId int64   `protobuf:"varint,1,opt,name=session_id,json=sessionId,proto3" json:"sessionId,omitempty"`
	TouristId int64   `protobuf:"varint,2,opt,name=tourist_id,json=touristId,proto3" json:"touristId,omitempty"`
	Latitude  float64 `protobuf:"fixed64,3,opt,name=latitude,proto3" json:"latitude,omitempty"`
	Longitude float64 `protobuf:"fixed64,4,opt,name=longitude,proto3" json:"longitude,omitempty"`
}

func (message *ProximityRequest) Reset()         { *message = ProximityRequest{} }
func (message *ProximityRequest) String() string { return fmt.Sprintf("%+v", *message) }
func (*ProximityRequest) ProtoMessage()          {}

type ProximityResponse struct {
	WithinRange        bool    `protobuf:"varint,1,opt,name=within_range,json=withinRange,proto3" json:"withinRange"`
	DistanceMeters     float64 `protobuf:"fixed64,2,opt,name=distance_meters,json=distanceMeters,proto3" json:"distanceMeters"`
	KeyPointId         int64   `protobuf:"varint,3,opt,name=key_point_id,json=keyPointId,proto3" json:"keyPointId"`
	KeyPointName       string  `protobuf:"bytes,4,opt,name=key_point_name,json=keyPointName,proto3" json:"keyPointName"`
	KeyPointCompleted  bool    `protobuf:"varint,5,opt,name=key_point_completed,json=keyPointCompleted,proto3" json:"keyPointCompleted"`
	CompletedKeyPoints int32   `protobuf:"varint,6,opt,name=completed_key_points,json=completedKeyPoints,proto3" json:"completedKeyPoints"`
	TotalKeyPoints     int32   `protobuf:"varint,7,opt,name=total_key_points,json=totalKeyPoints,proto3" json:"totalKeyPoints"`
	TourCompleted      bool    `protobuf:"varint,8,opt,name=tour_completed,json=tourCompleted,proto3" json:"tourCompleted"`
}

func (message *ProximityResponse) Reset()         { *message = ProximityResponse{} }
func (message *ProximityResponse) String() string { return fmt.Sprintf("%+v", *message) }
func (*ProximityResponse) ProtoMessage()          {}

type ExecutionServiceClient interface {
	CheckProximity(ctx context.Context, request *ProximityRequest, opts ...grpc.CallOption) (*ProximityResponse, error)
}

type executionServiceClient struct {
	connection grpc.ClientConnInterface
}

func NewExecutionServiceClient(connection grpc.ClientConnInterface) ExecutionServiceClient {
	return &executionServiceClient{connection: connection}
}

func (client *executionServiceClient) CheckProximity(
	ctx context.Context,
	request *ProximityRequest,
	opts ...grpc.CallOption,
) (*ProximityResponse, error) {
	response := new(ProximityResponse)
	err := client.connection.Invoke(ctx, "/execution.ExecutionService/CheckProximity", request, response, opts...)
	if err != nil {
		return nil, err
	}
	return response, nil
}
