FROM python:3.9.1-slim-buster as back-base

MAINTAINER Courtel Eliot <eliot.courtel@wanadoo.fr>
WORKDIR /home/api

FROM back-base as back-privatekey

COPY . /app
WORKDIR /app

RUN pip install --upgrade pip
RUN pip install -r requirements.txt

EXPOSE 8080

CMD ["python", "app.py"]
