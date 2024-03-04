from locust import HttpUser, task, between, events
import json

class MyUser(HttpUser):
    wait_time = between(0.5, 2)

    @task
    def get_tickets(self):
        if self.environment.success_count < 60000:
            url = "http://localhost:80/users/1/ticket/"
            headers = {'Content-Type': 'application/json'}
            payload = json.dumps({"ticketId": 3004})
            response = self.client.post(url, headers=headers, data=payload)
            if response.status_code == 200:
                self.environment.success_count += 1
                self.environment.total_requests += 1
                print(f"Total requests: {self.environment.total_requests}, Success count: {self.environment.success_count}")

@events.init.add_listener
def on_locust_init(environment, **kwargs):
    environment.success_count = 0
    environment.total_requests = 0
