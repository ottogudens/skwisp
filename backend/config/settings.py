import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv('SECRET_KEY', 'change-me')
DEBUG = os.getenv('DEBUG', 'False') == 'True'
DJANGO_ENV = os.getenv('DJANGO_ENV', 'development')  # 'production' en Railway
ALLOWED_HOSTS = ['*']
SITE_URL = os.getenv('SITE_URL', 'http://localhost:8000')

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
    'django_celery_beat',
    'django_filters',

    'apps.clients',
    'apps.radius_sync',
    'apps.billing',
    'apps.payments',
    'apps.tickets',
    'apps.inventory',
    'apps.dashboard',
    'apps.authentication',
    'apps.portal',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [{
    'BACKEND': 'django.template.backends.django.DjangoTemplates',
    'DIRS': [BASE_DIR / 'templates'],
    'APP_DIRS': True,
    'OPTIONS': {
        'context_processors': [
            'django.template.context_processors.debug',
            'django.template.context_processors.request',
            'django.contrib.auth.context_processors.auth',
            'django.contrib.messages.context_processors.messages',
        ],
    },
}]

WSGI_APPLICATION = 'config.wsgi.application'

# --- Bases de datos ---
# 'default': Django (clientes, facturación, tickets, inventario)
# 'radius':  FreeRADIUS — solo lectura/escritura vía services.py
import dj_database_url  # noqa: E402

_default_db_url = os.getenv('DATABASE_URL') or \
    f"postgresql://{os.getenv('DB_USER','skwisp')}:{os.getenv('DB_PASSWORD','skwisp')}" \
    f"@{os.getenv('DB_HOST','localhost')}:{os.getenv('DB_PORT','5432')}/{os.getenv('DB_NAME','skwisp')}"

_radius_db_url = os.getenv('RADIUS_DATABASE_URL') or \
    f"postgresql://{os.getenv('RADIUS_DB_USER','radius')}:{os.getenv('RADIUS_DB_PASSWORD','radius')}" \
    f"@{os.getenv('RADIUS_DB_HOST','localhost')}:{os.getenv('RADIUS_DB_PORT','5433')}/{os.getenv('RADIUS_DB_NAME','radius')}"

DATABASES = {
    'default': dj_database_url.parse(_default_db_url, conn_max_age=600),
    'radius': dj_database_url.parse(_radius_db_url, conn_max_age=600),
}

# Django nunca gestiona migraciones sobre la DB de radius (schema propio de FreeRADIUS)
class RadiusDBRouter:
    def db_for_read(self, model, **hints):
        return None

    def db_for_write(self, model, **hints):
        return None

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        if db == 'radius':
            return False
        return None

DATABASE_ROUTERS = ['config.settings.RadiusDBRouter']

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'es-cl'
TIME_ZONE = 'America/Santiago'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 50,
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
}

CORS_ORIGIN_ALLOW_ALL = True
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOWED_ORIGINS = os.getenv('CORS_ALLOWED_ORIGINS', '').split(',') if os.getenv('CORS_ALLOWED_ORIGINS') else []

# Celery & Cache
CELERY_BROKER_URL = os.getenv('CELERY_BROKER_URL', '')

# Usar Redis como caché solo si el broker está configurado y no apunta a localhost
_redis_available = CELERY_BROKER_URL and 'localhost' not in CELERY_BROKER_URL
if _redis_available:
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.redis.RedisCache',
            'LOCATION': CELERY_BROKER_URL,
        }
    }
else:
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        }
    }

# Fallback para Celery si no hay broker configurado
if not CELERY_BROKER_URL:
    CELERY_BROKER_URL = 'redis://localhost:6379/0'

CELERY_BEAT_SCHEDULER = 'django_celery_beat.schedulers:DatabaseScheduler'

from celery.schedules import crontab  # noqa: E402
CELERY_BEAT_SCHEDULE = {
    'generate-monthly-invoices': {
        'task': 'apps.billing.tasks.generate_monthly_invoices',
        'schedule': crontab(hour=6, minute=0),
    },
    'suspend-overdue-clients': {
        'task': 'apps.billing.tasks.suspend_overdue_clients',
        'schedule': crontab(hour=7, minute=0),
    },
    'send-invoice-reminders': {
        'task': 'apps.billing.tasks.send_invoice_reminders',
        'schedule': crontab(hour=8, minute=0),
    },
}

# Mercado Pago
MP_ACCESS_TOKEN = os.getenv('MP_ACCESS_TOKEN', '')
MP_WEBHOOK_SECRET = os.getenv('MP_WEBHOOK_SECRET', '')

# Advertencia en stderr si falta MP_WEBHOOK_SECRET en producción
import sys  # noqa: E402
if DJANGO_ENV == 'production' and not MP_WEBHOOK_SECRET:
    print(
        '\n⚠️  ADVERTENCIA CRÍTICA: MP_WEBHOOK_SECRET no está configurado.'
        ' El webhook de Mercado Pago rechazará todas las notificaciones.\n',
        file=sys.stderr,
    )
