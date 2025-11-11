#!/bin/sh

echo "🚀 Aguardando DB..."
python manage.py wait_for_db

echo "📦 Rodando migrations..."
python manage.py migrate

echo "🟢 Iniciando Gunicorn..."
exec gunicorn rkp_platform.wsgi:application \
    --bind unix:/run/gunicorn/gunicorn.sock

exec gunicorn rkp_platform.wsgi:application \
    --bind unix:/run/gunicorn/gunicorn.sock \
    --workers 3 \
    --threads 2 \
    --timeout 120 \
    --graceful-timeout 30 \
    --keep-alive 5 \
    --worker-tmp-dir /dev/shm