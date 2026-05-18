FROM golang:1.22-alpine AS build
WORKDIR /app
COPY go.mod ./
COPY *.go ./
RUN go build -o follower-service .

FROM alpine:3.20
WORKDIR /app
COPY --from=build /app/follower-service /app/follower-service
EXPOSE 8083
CMD ["/app/follower-service"]
