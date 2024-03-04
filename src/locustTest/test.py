from locust import HttpUser, task, between

class MyUser(HttpUser):
    wait_time = between(0.5, 2)

    @task
    def get_tickets(self):
        url = "http://localhost:80/tickets"
        self.client.get(url)