from locust import HttpUser, task, between, TaskSet, LoadTestShape, FastHttpUser
import json
import random

class MyTasks(TaskSet):
    @task
    def reserve_tickets(self):
        url = "http://localhost:80/user/5924ea09-7191-416b-8267-586b38241f2d/reserve"
        
        headers = {'Content-Type': 'application/json', 'isPublic': 'true'}
        ticket_id = random.randint(1,3116)
        payload = json.dumps({"ticketId": 3116})
        self.client.post(url, headers=headers, data=payload)


class MyUser(FastHttpUser):
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