FROM nginx:1.23.3-alpine as front_base

MAINTAINER Courtel Eliot <eliot.courtel@wanadoo.fr>

FROM front_base as merge
COPY ./conf/default.conf /etc/nginx/conf.d/default.conf
