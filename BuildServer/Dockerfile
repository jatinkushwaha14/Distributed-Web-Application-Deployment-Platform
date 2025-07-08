FROM ubuntu:focal

RUN apt-get update 

RUN apt-get install -y \
    git \
    curl 

RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y nodejs

RUN apt-get upgrade -y

WORKDIR /home/app

COPY main.sh main.sh
COPY script.js script.js
COPY package.json package.json
COPY package-lock.json package-lock.json
RUN npm install
RUN chmod +x main.sh
RUN chmod +x script.js

ENTRYPOINT [ "/home/app/main.sh" ]