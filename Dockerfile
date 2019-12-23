FROM node:12
WORKDIR /usr/src/app
COPY . /usr/src/app
RUN npm install
EXPOSE 1582
CMD npm start
