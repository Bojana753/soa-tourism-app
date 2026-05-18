FROM golang:1.26-alpine AS build
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o stakeholders-service .

FROM alpine:latest
WORKDIR /app
COPY --from=build /app/stakeholders-service .
EXPOSE 8081
CMD ["./stakeholders-service"]