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

