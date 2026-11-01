from redis import Redis
from rq import Queue

from app.core.config import settings

queue_connection = Redis.from_url(settings.redis_url)

email_queue = Queue("emails",connection=queue_connection)