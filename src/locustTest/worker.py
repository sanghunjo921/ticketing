from locust import HttpUser, task, between
from locust.runners import WorkerRunner

class MyUser(HttpUser):
    wait_time = between(2, 5)

    @task
    def get_tickets(self):
        url = "http://localhost:80/tickets"
        self.client.get(url)

if __name__ == "__main__":
    worker = WorkerRunner([MyUser])
    worker.main()
