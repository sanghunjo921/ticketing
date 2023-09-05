FROM node:20
WORKDIR /app
COPY . /app
RUN yarn
CMD yarn dev