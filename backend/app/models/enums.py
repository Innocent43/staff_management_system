import enum



class Role(str, enum.Enum):
    owner = "owner"
    manager = "manager"
    employee = "employee"



class MembershipStatus(str, enum.Enum):
    invited = "invited"
    active = "active"
    deactivated = "deactivated"


class WageType(str, enum.Enum):
    hourly = "hourly"
    daily = "daily"
    fixed = "fixed"


class EventType(str,enum.Enum):
    clock_in = "clock_in"
    clock_out = "clock_out"


class EventSource(str, enum.Enum):
    qr="qr"
    manual="manual"


class CorrectionAction(str, enum.Enum):
    change_time="change_time"
    void="void"


class TaskStatus(str,enum.Enum):
    pending = "pending"
    in_progress = "in_progress"
    completed = "completed"


class TaskPriority(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"


class PayStatus(str, enum.Enum):
    draft = "draft"
    approved = "approved"
