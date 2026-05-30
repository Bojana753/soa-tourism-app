package tour

type Empty struct{}

func (e *Empty) Reset()         {}
func (e *Empty) String() string { return "" }
func (e *Empty) ProtoMessage()  {}

type TourListResponse struct {
	Tours []*TourMessage `json:"tours"`
}

func (t *TourListResponse) Reset()         {}
func (t *TourListResponse) String() string { return "" }
func (t *TourListResponse) ProtoMessage()  {}

type TourMessage struct {
	Id            int64              `json:"id"`
	Name          string             `json:"name"`
	Description   string             `json:"description"`
	Difficulty    string             `json:"difficulty"`
	Tags          []string           `json:"tags"`
	Status        string             `json:"status"`
	Price         float64            `json:"price"`
	AuthorId      int64              `json:"authorId"`
	LengthKm      float64            `json:"lengthKm"`
	PublishedAt   string             `json:"publishedAt"`
	FirstKeyPoint *KeyPointMessage   `json:"firstKeyPoint"`
	Durations     []*DurationMessage `json:"durations"`
}

func (t *TourMessage) Reset()         {}
func (t *TourMessage) String() string { return "" }
func (t *TourMessage) ProtoMessage()  {}

type KeyPointMessage struct {
	Id          int64   `json:"id"`
	Name        string  `json:"name"`
	Description string  `json:"description"`
	Latitude    float64 `json:"latitude"`
	Longitude   float64 `json:"longitude"`
	ImageUrl    string  `json:"imageUrl"`
	OrderIndex  int32   `json:"orderIndex"`
}

func (k *KeyPointMessage) Reset()         {}
func (k *KeyPointMessage) String() string { return "" }
func (k *KeyPointMessage) ProtoMessage()  {}

type DurationMessage struct {
	Id            int64  `json:"id"`
	TransportType string `json:"transportType"`
	Minutes       int32  `json:"minutes"`
}

func (d *DurationMessage) Reset()         {}
func (d *DurationMessage) String() string { return "" }
func (d *DurationMessage) ProtoMessage()  {}
