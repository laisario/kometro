import requests
import logging
import time
from django.conf import settings

logger = logging.getLogger(__name__)


def trigger_frontend_rebuild(post_id=None, categoria_id=None, action=None, max_retries=3, retry_delay=1):
    """
    Trigger GitHub Actions workflow to rebuild and redeploy the landing page.
    
    Args:
        post_id: ID of the Post that triggered the rebuild (for logging)
        categoria_id: ID of the Categoria that triggered the rebuild (for logging)
        action: Action type (created/updated/deleted) for logging
        max_retries: Maximum number of retry attempts on failure
        retry_delay: Delay in seconds between retries
    
    Returns:
        bool: True if successful, False otherwise
    """
    # Validate required settings
    if not hasattr(settings, "GITHUB_REBUILD_LANDINGPAGE_TOKEN") or not settings.GITHUB_REBUILD_LANDINGPAGE_TOKEN:
        logger.error("GITHUB_REBUILD_LANDINGPAGE_TOKEN is not configured")
        return False
    
    if not hasattr(settings, "GITHUB_REPO") or not settings.GITHUB_REPO:
        logger.error("GITHUB_REPO is not configured")
        return False
    
    if not hasattr(settings, "WORKFLOW_FILE") or not settings.WORKFLOW_FILE:
        logger.error("WORKFLOW_FILE is not configured")
        return False
    
    # Build log context
    context_parts = []
    if post_id:
        context_parts.append(f"post_id={post_id}")
    if categoria_id:
        context_parts.append(f"categoria_id={categoria_id}")
    if action:
        context_parts.append(f"action={action}")
    context = ", ".join(context_parts) if context_parts else "manual trigger"
    
    url = f"https://api.github.com/repos/{settings.GITHUB_REPO}/actions/workflows/{settings.WORKFLOW_FILE}/dispatches"
    headers = {
        "Accept": "application/vnd.github.v3+json",
        "Authorization": f"Bearer {settings.GITHUB_REBUILD_LANDINGPAGE_TOKEN}",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json"
    }
    data = {"ref": "main"}
    
    # Retry logic with exponential backoff
    for attempt in range(1, max_retries + 1):
        try:
            logger.info(f"Triggering GitHub Actions workflow (attempt {attempt}/{max_retries}) - {context}")
            response = requests.post(
                url,
                headers=headers,
                json=data,
                timeout=10  # 10 second timeout
            )
            
            # Check response status
            if response.status_code == 204:
                logger.info(f"Successfully triggered GitHub Actions workflow - {context}")
                return True
            elif response.status_code == 404:
                logger.error(
                    f"GitHub workflow not found (404). "
                    f"Repo: {settings.GITHUB_REPO}, Workflow: {settings.WORKFLOW_FILE} - {context}"
                )
                return False  # Don't retry on 404
            else:
                error_msg = f"GitHub API returned status {response.status_code}"
                try:
                    error_body = response.json()
                    if "message" in error_body:
                        error_msg += f": {error_body['message']}"
                except:
                    error_msg += f": {response.text[:200]}"
                
                logger.warning(f"{error_msg} - {context}")
                
                # Retry on 5xx errors or rate limiting (429)
                if response.status_code >= 500 or response.status_code == 429:
                    if attempt < max_retries:
                        wait_time = retry_delay * (2 ** (attempt - 1))  # Exponential backoff
                        logger.info(f"Retrying in {wait_time} seconds...")
                        time.sleep(wait_time)
                        continue
                else:
                    # Don't retry on client errors (4xx except 429)
                    return False
                    
        except requests.exceptions.Timeout:
            logger.warning(f"Request timeout (attempt {attempt}/{max_retries}) - {context}")
            if attempt < max_retries:
                wait_time = retry_delay * (2 ** (attempt - 1))
                logger.info(f"Retrying in {wait_time} seconds...")
                time.sleep(wait_time)
                continue
        except requests.exceptions.RequestException as e:
            logger.error(f"Request failed: {str(e)} (attempt {attempt}/{max_retries}) - {context}")
            if attempt < max_retries:
                wait_time = retry_delay * (2 ** (attempt - 1))
                logger.info(f"Retrying in {wait_time} seconds...")
                time.sleep(wait_time)
                continue
        except Exception as e:
            logger.exception(f"Unexpected error triggering GitHub workflow - {context}: {str(e)}")
            return False
    
    logger.error(f"Failed to trigger GitHub Actions workflow after {max_retries} attempts - {context}")
    return False
