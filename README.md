

# 프로젝트 개요

이 프로젝트는 최대 60만명의 동시 접속자가 동시에 티켓을 조회하고 최대 6만명의 동시 접속자가 티켓을 예매하고 구매하는 백엔드 서비스의 프로토타입 구현을 목표로 합니다.
- Express
- Postgresql
- Redis
- Sequelize

## 개발 환경 구조
<p align="center">
  <img src="./structure.png" alt="프로젝트 구조">
</p>

## 주요 기능 및 구현 내용

### 티켓 조회 및 예약
- 티켓 조회 시 pagination 처리를 통해 응답 크기를 최적화하고, 티켓 정보를 Redis에 캐싱하여 속도를 향상시켰습니다.
- 도커 컴포즈를 사용하여 각각의 컨테이너를 띄우고 Nginx를 로드 밸런서로 사용하여 웹 컨테이너를 scale out 하였습니다.

### 예약 엔드포인트
- 예약에 필요한 정보를 Redis에 캐싱하여 데이터베이스 접근 횟수를 최소화했습니다.
- mget, mset & promise를 사용하여 redis 접근 횟수를 최소화 했습니다.

### 구매 엔드포인트
- 예약에서 캐싱한 정보를 기반으로 구매를 진행하며, 배치 서버를 통해 캐싱된 구매 정보가 일정 시간 이상 경과 시에만 데이터베이스에 반영되도록 처리하였습니다.
- RabbitMQ를 이용하여 구매 완료 이메일을 비동기적으로 전송하였습니다.
- mget과 mset을 사용하여 redis 접근 횟수를 최소화 했습니다.

### 구매내역 저장 배치처리
- 구매가 완료 된 시점에 redis에 구매내역과 관련 된 정보를 캐싱했습니다.
- batch 서버에서 1분마다 cron job이 돌면서 redis에 캐싱 된 구매내역 정보를 확인하고 10분이 경과 된 데이터는 DB에 저장합니다.
- batch processing의 최적화를 위해 sequelize의 bulkCreate()를 사용하여 한번에 DB에 주입했습니다.

### 인증 관리
- Access Token의 유효기간은 10분으로 설정되어 있고, Refresh Token의 유효기간은 30일입니다.
- Refresh Token은 데이터베이스에 저장되어 stateful하게 관리되며, Access Token은 stateless하게 관리됩니다.

### 예외 처리 및 에러 핸들링
- 프로젝트에서 발생할 수 있는 예외 상황과 에러에 대한 처리 방식을 명시하였습니다. 
- 컨트롤러에서 발생하는 예외는 중앙에서 관리되며, 클라이언트에게 적절한 HTTP 상태 코드와 함께 에러 메시지를 반환합니다.
- 예를 들어, 데이터베이스 쿼리 중에 에러가 발생한 경우, 500 Internal Server Error를 반환하고 로그에 해당 에러를 기록합니다.
- 또한, 클라이언트가 요청한 리소스가 존재하지 않는 경우 404 Not Found를 반환하고 적절한 에러 메시지를 제공합니다.

## 로드 테스트
- Locust의 Faster Client를 활용하여 로드 테스트를 수행하였습니다. 
## 배포 환경 구조
<p align="center">
  <img src="./ecs.png" alt="ecs 구조도">
</p>

### AWS ECS 배포 전략
- Github Actions으로 main branch에 push하면 ECR에 최신 이미지가 올라가도록 자동화 하였습니다.
- EC2 두대를 띄워서 각각 Redis와 DB 환경을 설정했습니다. 
- ECR에서 최신 이미지를 pull하도록 task definition을 작성하고 Redis와 DB와 연결 되도록 환경변수를 설정했습니다.
- Fargate 형식의 cluster를 만들고 서비스를 생성할때 application load balancer를 설정하여 로드가 분산되도록 하고 auto scaling 정책을 설정해서 CPU 사용량이 60%가 넘어가면 자동으로 수평 확장되도록 했습니다.
- Terraform으로 AWS ECS 자원을 만들어서 git으로 형상 관리합니다.
## 사용 기술 스택

- 프레임워크: Express
- 데이터베이스: PostgreSQL
- ORM: Sequelize
- 캐싱: Redis
- 컨테이너 관리: Docker, Docker Compose
- 로드 밸런싱: Nginx
- 비동기 메시징: RabbitMQ
- 로드 테스트: Locust, Artillery 
- CI/CD: Github Actions
- 배포: AWS ECS, ECR, EC2
- 프로비저닝 툴: Terraform

## Quickstart
### 개발 환경 설정

1. Docker 및 Docker Compose 설치
2. 소스코드 클론
3. 환경 변수 설정
4. docker-compose build로 컨테이너 빌드
5. docker-compose up으로 컨테이너 실행

### 로드 테스트 수행 방법
1. Locust 설치
2. 로드 테스트 스크립트가 저장된 디렉토리로 이동
3. locust -f ${script file명}로 원하는 테스트 스크립트 실행
4. 브라우저에서 localhost:8089 접속하여 테스트 진행 상황 및 결과 확인

## 기여 방법

1. 이슈 등록
2. Fork하여 작업
3. Pull Request 제출



