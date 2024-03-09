variable "region" {
  type    = string
  default = "ap-northeast-2"
}

variable "container_port" {
  type    = number
}

variable "host_port" {
  type    = number
}

variable "alb_port" {
  type    = number
}

variable "elb_account_id" {
  type    = string
}

variable "az_count" {
  type    = number
}

variable "DB_USER" {
  type    = string
}

variable "DB_NAME" {
  type    = string
}

variable "DB_PASSWORD" {
  type    = string
}

variable "DB_HOST" {
  type = string
}

variable "DB_PORT" {
  type = string
}

variable "DB_DIALECT" {
  type = string
}

variable "REDIS_PORT" {
  type = string
}

variable "REDIS_HOST" {
  type = string
}

