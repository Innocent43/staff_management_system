import logging
from fastapi import HTTPException,status,Request
from redis.exceptions import RedisError

from app.core.redis import redis_client

logger = logging.getLogger(__name__)

def check_rate_limit(key: str, limit: int, window_seconds: int )-> None:
    redis_key = f"rate:{key}"

    try:
        pipe = redis_client.pipeline()
        pipe.incr(redis_key)
        pipe.expire(redis_key,window_seconds, nx=True)
        pipe.ttl(redis_key)

        count,_,ttl = pipe.execute()
    except RedisError:
        logger.info("Rate limiter unavailable, allowing request", exc_info=True)
        return

    if count > limit:
        logger.warning("Rate limit hit: key%s", key)
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS,detail="Too many request, please try again later.", headers={"Retry-after": str(max(ttl,1))})


def rate_limit_by_ip(name: str,limit: int,window_seconds:int):
    def checker(request: Request)->None:
        ip = request.client.host if request.client else "unknown"
        check_rate_limit(f"{name}:{ip}", limit,window_seconds)

    return checker