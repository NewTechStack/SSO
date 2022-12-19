FROM python:3.9.1-buster as base

MAINTAINER Courtel Eliot <eliot.courtel@wanadoo.fr>
WORKDIR /home/api

FROM base as sso

COPY ./requirements.txt ./
RUN python3 -m pip install --upgrade pip
RUN python3 -m pip install --upgrade -r requirements.txt

ENTRYPOINT python3 server.py;
