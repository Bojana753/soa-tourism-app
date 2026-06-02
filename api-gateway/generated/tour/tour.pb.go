// Code generated manually based on tour.proto
package tour

import (
	"google.golang.org/protobuf/runtime/protoimpl"
)

type Empty struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
}

func (e *Empty) Reset()         { *e = Empty{} }
func (e *Empty) String() string { return "" }
func (e *Empty) ProtoMessage()  {}

type TourListResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Tours []*TourMessage `protobuf:"bytes,1,rep,name=tours,proto3" json:"tours,omitempty"`
}

func (t *TourListResponse) Reset()         { *t = TourListResponse{} }
func (t *TourListResponse) String() string { return "" }
func (t *TourListResponse) ProtoMessage()  {}

type TourMessage struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Id            int64              `protobuf:"varint,1,opt,name=id,proto3" json:"id,omitempty"`
	Name          string             `protobuf:"bytes,2,opt,name=name,proto3" json:"name,omitempty"`
	Description   string             `protobuf:"bytes,3,opt,name=description,proto3" json:"description,omitempty"`
	Difficulty    string             `protobuf:"bytes,4,opt,name=difficulty,proto3" json:"difficulty,omitempty"`
	Tags          []string           `protobuf:"bytes,5,rep,name=tags,proto3" json:"tags,omitempty"`
	Status        string             `protobuf:"bytes,6,opt,name=status,proto3" json:"status,omitempty"`
	Price         float64            `protobuf:"fixed64,7,opt,name=price,proto3" json:"price,omitempty"`
	AuthorId      int64              `protobuf:"varint,8,opt,name=author_id,json=authorId,proto3" json:"authorId,omitempty"`
	LengthKm      float64            `protobuf:"fixed64,9,opt,name=length_km,json=lengthKm,proto3" json:"lengthKm,omitempty"`
	PublishedAt   string             `protobuf:"bytes,10,opt,name=published_at,json=publishedAt,proto3" json:"publishedAt,omitempty"`
	FirstKeyPoint *KeyPointMessage   `protobuf:"bytes,11,opt,name=first_key_point,json=firstKeyPoint,proto3" json:"firstKeyPoint,omitempty"`
	Durations     []*DurationMessage `protobuf:"bytes,12,rep,name=durations,proto3" json:"durations,omitempty"`
}

func (t *TourMessage) Reset()         { *t = TourMessage{} }
func (t *TourMessage) String() string { return "" }
func (t *TourMessage) ProtoMessage()  {}

type KeyPointMessage struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Id          int64   `protobuf:"varint,1,opt,name=id,proto3" json:"id,omitempty"`
	Name        string  `protobuf:"bytes,2,opt,name=name,proto3" json:"name,omitempty"`
	Description string  `protobuf:"bytes,3,opt,name=description,proto3" json:"description,omitempty"`
	Latitude    float64 `protobuf:"fixed64,4,opt,name=latitude,proto3" json:"latitude,omitempty"`
	Longitude   float64 `protobuf:"fixed64,5,opt,name=longitude,proto3" json:"longitude,omitempty"`
	ImageUrl    string  `protobuf:"bytes,6,opt,name=image_url,json=imageUrl,proto3" json:"imageUrl,omitempty"`
	OrderIndex  int32   `protobuf:"varint,7,opt,name=order_index,json=orderIndex,proto3" json:"orderIndex,omitempty"`
}

func (k *KeyPointMessage) Reset()         { *k = KeyPointMessage{} }
func (k *KeyPointMessage) String() string { return "" }
func (k *KeyPointMessage) ProtoMessage()  {}

type DurationMessage struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Id            int64  `protobuf:"varint,1,opt,name=id,proto3" json:"id,omitempty"`
	TransportType string `protobuf:"bytes,2,opt,name=transport_type,json=transportType,proto3" json:"transportType,omitempty"`
	Minutes       int32  `protobuf:"varint,3,opt,name=minutes,proto3" json:"minutes,omitempty"`
}

func (d *DurationMessage) Reset()         { *d = DurationMessage{} }
func (d *DurationMessage) String() string { return "" }
func (d *DurationMessage) ProtoMessage()  {}