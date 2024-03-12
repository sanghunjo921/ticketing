from locust import HttpUser, task, between, TaskSet, LoadTestShape
import json

class MyTasks(TaskSet):
    @task
    def reserve_tickets(self):
        load_balancer_dns = "ticketing-lb-1001011148.ap-northeast-2.elb.amazonaws.com"
        url = f"http://{load_balancer_dns}/users/2/ticket/"
        headers = {'Content-Type': 'application/json'}
        payload = json.dumps({"ticketId": 3005})
        self.client.post(url, headers=headers, data=payload)


class MyUser(HttpUser):
    wait_time = between(0.5, 2)
    tasks = [MyTasks]


class MyCustomShape(LoadTestShape):
    stages = [
        {"duration": 30, "users": 1000, "spawn_rate": 500},
        {"duration": 60, "users": 5000, "spawn_rate": 1000},
        {"duration": 90, "users": 10000, "spawn_rate": 2000},
        {"duration": 120, "users": 20000, "spawn_rate": 3000},
        {"duration": 150, "users": 40000, "spawn_rate": 5000},  
        {"duration": 180, "users": 60000, "spawn_rate": 10000},
        # {"duration": 210, "users": 90000, "spawn_rate": 15000},
        # {"duration": 240, "users": 150000, "spawn_rate": 20000},
        # {"duration": 270, "users": 200000, "spawn_rate": 25000},
        # {"duration": 300, "users": 300000, "spawn_rate": 20000},
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