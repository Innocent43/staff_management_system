import enum



class Role(str, enum.Enum):
    owner = "owner"
    manager = "manager"
    employee = "employee"



class MembershipStatus(str, enum.Enum):
    invited = "invited"
    active = "active"
    deactivated = "deactivated"