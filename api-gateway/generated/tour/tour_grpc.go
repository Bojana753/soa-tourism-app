package tour

import (
	"context"

	"google.golang.org/grpc"
)

type TourServiceClient interface {
	GetPublishedTours(ctx context.Context, in *Empty, opts ...grpc.CallOption) (*TourListResponse, error)
}

type tourServiceClient struct {
	cc grpc.ClientConnInterface
}

func NewTourServiceClient(cc grpc.ClientConnInterface) TourServiceClient {
	return &tourServiceClient{cc}
}

func (c *tourServiceClient) GetPublishedTours(ctx context.Context, in *Empty, opts ...grpc.CallOption) (*TourListResponse, error) {
	out := new(TourListResponse)
	err := c.cc.Invoke(ctx, "/tour.TourService/GetPublishedTours", in, out, opts...)
	if err != nil {
		return nil, err
	}
	return out, nil
}

type TourServiceServer interface {
	GetPublishedTours(context.Context, *Empty) (*TourListResponse, error)
}

type UnimplementedTourServiceServer struct{}

func (UnimplementedTourServiceServer) GetPublishedTours(context.Context, *Empty) (*TourListResponse, error) {
	return nil, nil
}

func RegisterTourServiceServer(s *grpc.Server, srv TourServiceServer) {
	s.RegisterService(&_TourService_serviceDesc, srv)
}

var _TourService_serviceDesc = grpc.ServiceDesc{
	ServiceName: "tour.TourService",
	HandlerType: (*TourServiceServer)(nil),
	Methods: []grpc.MethodDesc{
		{
			MethodName: "GetPublishedTours",
			Handler:    _TourService_GetPublishedTours_Handler,
		},
	},
	Streams:  []grpc.StreamDesc{},
	Metadata: "tour.proto",
}

func _TourService_GetPublishedTours_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(Empty)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(TourServiceServer).GetPublishedTours(ctx, in)
	}
	info := &grpc.UnaryServerInfo{
		Server:     srv,
		FullMethod: "/tour.TourService/GetPublishedTours",
	}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(TourServiceServer).GetPublishedTours(ctx, req.(*Empty))
	}
	return interceptor(ctx, in, info, handler)
}
