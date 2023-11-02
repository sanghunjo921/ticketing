FROM node:20
WORKDIR /app
COPY . /app
RUN yarn
RUN yarn build
CMD yarn start