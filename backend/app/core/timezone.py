from datetime import date,datetime,time,timedelta

from zoneinfo import ZoneInfo

def local_day_start(day: date,timezone_name: str)->datetime:
    return datetime.combine(day,time.min,tzinfo=ZoneInfo(timezone_name))


def local_day_end(day: date,timezone_name: str)->datetime:
    return local_day_start(day + timedelta(days=1), timezone_name)


def local_date(moment: datetime,timezone_name: str)->date:
    return moment.astimezone(ZoneInfo(timezone_name)).date()

