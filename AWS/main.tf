# terraform 
provider "aws" {
  region = var.aws_region
}

resource "aws_instance" "sandbox_server" {
  ami           = "ami-"
  instance_type = "t3.micro"

  ##block public
  associate_public_ip_address = false 

  tags = {
    Name        = "${var.project_name}-dev-api"
    Environment = "sandbox"
    Owner       = "team-alpha"
    Lifecycle   = "14-days-expiry"
    CostCenter  = "rd-department"
  }
}