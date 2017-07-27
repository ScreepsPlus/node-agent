FROM node:6-alpine
WORKDIR /app
RUN apk add --no-cache git
ENV AGENT_CONFIG_PATH /config/config.js
ENV DOCKER true
ADD package.json /app
#RUN npm install
ADD app.js .
CMD ["npm","start"]
