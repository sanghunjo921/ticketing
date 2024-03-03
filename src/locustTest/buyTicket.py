from locust import HttpUser, task, between
import json

class MyUser(HttpUser):
    wait_time = between(0.5, 2)
    load_balancer_dns = "ticketing-39181247.ap-northeast-2.elb.amazonaws.com"

    @task
    def get_tickets(self):
        url = f"http://{self.load_balancer_dns}/users/1/tickets/3004/purchase/"
        headers = {'Content-Type': 'application/json'}
        payload = json.dumps({"couponId": 1})
        self.client.post(url, headers=headers, data=payload)
