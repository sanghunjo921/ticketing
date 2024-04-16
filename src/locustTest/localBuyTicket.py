
from locust import HttpUser, task, between, TaskSet, LoadTestShape, FastHttpUser
import json

class MyTasks(TaskSet):
    @task
    def reserve_tickets(self):
        # url = "http://localhost:80/users/18/tickets/10006/purchase/"
        url = "http://localhost:80/user/5924ea09-7191-416b-8267-586b38241f2d/ticket/3116/purchase"
        headers = {'Content-Type': 'application/json'}
        payload = json.dumps({"couponId": 1})
        self.client.post(url, headers=headers, data=payload)


class MyUser(FastHttpUser):
    wait_time = between(0.5, 2)
    tasks = [MyTasks]

class MyCustomShape(LoadTestShape):
    stages = [
        {"duration": 30, "users": 1000, "spawn_rate": 500},
        {"duration": 60, "users": 2500, "spawn_rate": 1000},
        {"duration": 90, "users": 5000, "spawn_rate": 2000},
        {"duration": 120, "users": 10000, "spawn_rate": 3000},
        {"duration": 150, "users": 25000, "spawn_rate": 5000},  
        {"duration": 180, "users": 50000, "spawn_rate": 10000},
    ]  
    stage_index = 1
    
    def tick(self):
        run_time = self.get_run_time()
        print("Current run time:", run_time)

        for stage in self.stages:
            if run_time < stage["duration"]:
                tick_data = (stage["users"], stage["spawn_rate"])
                return tick_data

        return None
