import requests
from django.conf import settings


def trigger_frontend_rebuild():
    url = f"https://api.github.com/repos/{settings.GITHUB_REPO}/actions/workflows/{settings.WORKFLOW_FILE}/dispatches"
    headers = {
        "Accept": "application/vnd.github.v3+json",
        "Authorization": f"token {settings.GITHUB_REBUILD_LANDINGPAGE_TOKEN}",
        "Content-Type": "application/json"
    }
    data = {"ref": "main"}
    response = requests.post(url, headers=headers, json=data)
    return response
