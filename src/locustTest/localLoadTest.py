from locust import HttpUser, task, between, LoadTestShape, TaskSet
from locust.runners import MasterRunner

class MyTasks(TaskSet):
    @task
    def get_tickets(self):
        url = "http://localhost:80/ticket"
        self.client.get(url)

class MyUser(HttpUser):
    wait_time = between(0.5, 2)
    tasks = [MyTasks]

class MyCustomShape(LoadTestShape):
    stages = [
        {"duration": 60, "users": 60000, "spawn_rate": 1000},
        {"duration": 120, "users": 140000, "spawn_rate": 3200},
        {"duration": 180, "users": 240000, "spawn_rate": 6666},
        {"duration": 240, "users": 360000, "spawn_rate": 12000},
        {"duration": 300, "users": 500000, "spawn_rate": 28000},      
    ] 
    # 700000, 40000/s 
    stage_index = 1
    
    def tick(self):
        run_time = self.get_run_time()
        print("Current run time:", run_time)

        for stage in self.stages:
            if run_time < stage["duration"]:
                tick_data = (stage["users"], stage["spawn_rate"])
                return tick_data

        return None


if __name__ == "__main__":
    # 마스터 러너 설정
    master = MasterRunner([MyUser], MyCustomShape)

    # 마스터 시작
    master.main()