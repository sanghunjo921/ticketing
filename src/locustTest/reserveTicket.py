from locust import HttpUser, task, between, TaskSet, LoadTestShape
import json

class MyTasks(TaskSet):
    @task
    def reserve_tickets(self):
        load_balancer_dns = "test-936966337.ap-northeast-2.elb.amazonaws.com"
        url = f"http://{load_balancer_dns}/users/1/ticket/"
        headers = {'Content-Type': 'application/json'}
        payload = json.dumps({"ticketId": 3004})
        self.client.post(url, headers=headers, data=payload)


class MyUser(HttpUser):
    wait_time = between(0.5, 2)
    tasks = [MyTasks]


class MyCustomShape(LoadTestShape):
    stages = [
        {"duration": 60, "users": 40000, "spawn_rate": 1000},
        {"duration": 120, "users": 80000, "spawn_rate": 3000},
        {"duration": 180, "users": 130000, "spawn_rate": 6000},
        {"duration": 240, "users": 200000, "spawn_rate": 15000},
        {"duration": 300, "users": 280000, "spawn_rate": 20000},  
        {"duration": 350, "users": 400000, "spawn_rate": 25000},
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


# if __name__ == "__main__":
#     # 마스터 러너 설정
#     master = MasterRunner([MyUser], MyCustomShape)

#     # 마스터 시작
#     master.main()  