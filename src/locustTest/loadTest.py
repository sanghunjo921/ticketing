from locust import HttpUser, task, between

class MyUser(HttpUser):
    wait_time = between(0.5, 2)
    load_balancer_dns = "ticketing-39181247.ap-northeast-2.elb.amazonaws.com"

    @task
    def get_tickets(self):
        url = f"http://{self.load_balancer_dns}/tickets"
        self.client.get(url)
