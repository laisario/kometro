FROM python:3.10.5

WORKDIR /kometro

COPY ./app/ /kometro/

RUN apt-get update && \
    apt-get install -y \
    git gcc \
    libxml2-dev libxslt1-dev \
    zlib1g-dev \
    default-libmysqlclient-dev && \
    rm -rf /var/lib/apt/lists/*

RUN pip install --upgrade pip

COPY ./requirements.txt /kometro/requirements.txt

RUN pip install -r requirements.txt
RUN mkdir -p /run/gunicorn && chown -R www-data:www-data /run/gunicorn

COPY entrypoint.sh /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
