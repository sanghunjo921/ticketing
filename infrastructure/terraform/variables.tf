variable "vpc_id" {
  description = "Value of the ticketing VPC id"
  type        = string
  default     = "vpc-07bb2767473b86f87"
}

variable "sg_id" {
  description = "Value of the security group id"
  default     = "sg-07afbbcbd170261b4"
}

variable "alb_sg_id" {
  description = "Value of the security group id for the load balancer"
  default     = "sg-0206a5e3caa259874"
}

variable "private_subnet_ids" {
  default = ["subnet-0c9b379b11c323ff5", "subnet-00df1c515576c9b0b"]
}

variable "public_subnet_ids" {
  default = ["subnet-0b6935d50d46c9cef", "subnet-0325d6cd5c2ff6d53"]
}

variable "subnet_ids" {
  default = ["subnet-0b6935d50d46c9cef", "subnet-0325d6cd5c2ff6d53", "subnet-0b6935d50d46c9cef", "subnet-0325d6cd5c2ff6d53"]
}



