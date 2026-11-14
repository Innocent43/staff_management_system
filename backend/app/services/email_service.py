import logging
# import smtplib
import httpx
# from email.message import EmailMessage

from app.core.config import settings
from app.core.logging import setup_logging

setup_logging()
logger = logging.getLogger(__name__)





def send_invite_email(to_email: str,full_name: str,business_name: str,invite_link: str,)->None:
    body = (
        f"Hello {full_name},\n\n"
        f"{business_name} has invited you to join their team.\n"
        f"Set your password here: {invite_link}\n\n"
        "This link expires in 7 days."
    )

    _send_email(
        to_email,f"You're invited to join {business_name}",
        body,
    )



def _send_email(to_email: str,subject: str,body: str)->None:
    if not settings.brevo_api_key:
        logger.warning("Email not sent: Brevo API key is not configured. Recipient: %s", to_email,)
        return
    
    url = "https://api.brevo.com/v3/smtp/email"

    headers = {
        "accept": "application/json",
        "api-key": settings.brevo_api_key,
        "content-type": "application/json",
    }

    payload = {
        "sender": {
            "name": "Staff Attendance System",
            "email": settings.email_from,
        },
        "to":[
            {"email": to_email}
        ],
        "subject": subject,
        "textContent": body,
    }

    response = httpx.post(
        url,headers=headers,
        json=payload,
        timeout=20.0,
    )

    response.raise_for_status()

    logger.info("Email sent successfully to %s", to_email)






def send_task_assigned_email(to_email: str,ful_name: str,task_title: str,deadline_text: str,)->None:
    body = (
        f"Hello {ful_name},\n\n"
        f"You have been assigned a new task: {task_title}\n"
        f"Deadline: {deadline_text}\n\n"
        "Log in to see the details."
    )

    _send_email(to_email,f"New task: {task_title}",body)




# def send_invite_email(to_email: str,full_name: str,business_name: str, invite_link: str)->None:
#     if not settings.smtp_host:
#         logger.info("DEV MODE (no SMTP): invite for %s -> %s ", to_email,invite_link)
#         return 
    
#     message = EmailMessage()

#     message["Subject"] = f"You're invited to join {business_name}"
#     message["From"] = settings.email_from
#     message["To"] = to_email
#     message.set_content(
#         f"Hello {full_name},\n\n"
#         f"{business_name} has invited you to join their team.\n"
#         f"Set your password here: {invite_link}\n\n"
#         f"This link expires in 7 days."
#     )

#     with smtplib.SMTP(settings.smtp_host,settings.smtp_port) as server:
#         server.starttls()
#         if settings.smtp_user:
#             server.login(settings.smtp_user,settings.smtp_password)
#         server.send_message(message)

#     logger.info("Invite email sent to %s", to_email)



# def _send_email(to_email: str,subject: str, body: str)-> None:
#     message = EmailMessage()
#     message["Subject"] = subject
#     message["From"] = settings.email_from
#     message["To"] = to_email
#     message.set_content(body)

#     with smtplib.SMTP(settings.smtp_host,settings.smtp_port) as server:
#         server.starttls()
#         if settings.smtp_user:
#             server.login(settings.smtp_user,settings.smtp_password)
#         server.send_message(message)


# def send_task_assigned_email(to_email: str,ful_name: str,task_title: str,deadline_text: str)->None:
#     if not settings.smtp_host:
#         logger.info("DEV MODE (no SMTP): task '%s' assigned to %s, deadline: %s",task_title,to_email,deadline_text)
#         return
#     _send_email(
#         to_email,f"New task: {task_title}",
#         f"Hello {ful_name},\n\n"
#         f"You have been assigned a new task: {task_title}\n"
#         f"Deadline: {deadline_text}\n\n"
#         f"Log in to see the details.",
#     )
#     logger.info("Task email sent to %s", to_email)

    
        
