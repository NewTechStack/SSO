FROM python:3.9.1-slim-buster as back_base

MAINTAINER Courtel Eliot <eliot.courtel@wanadoo.fr>
WORKDIR /home/api

FROM back_base as back

COPY ./requirements.txt ./
RUN python3 -m pip install --upgrade pip
RUN python3 -m pip install --upgrade -r requirements.txt

ENTRYPOINT python3 server.py;
