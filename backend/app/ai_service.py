import json
import os
import re
import httpx

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")


def analyze_code_with_gemini(code_snippet: str) -> dict:
    prompt = (
        "You are an expert DevOps and Security Code Reviewer.\n"
        "Analyze the following code for security vulnerabilities, bugs, code smells, and missing validation.\n\n"
        "Return ONLY a JSON object with this schema:\n"
        "{\n"
        '  "risk_level": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",\n'
        '  "summary": "Brief summary",\n'
        '  "issues": ["list of issues"],\n'
        '  "recommendations": ["list of recommendations"]\n'
        "}\n\n"
        f"Code:\n{code_snippet}"
    )

    payload = {
        "contents": [{
            "parts": [{"text": prompt}]
        }],
        "generationConfig": {
            "temperature": 0.1,
            "response_mime_type": "application/json"
        }
    }

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key={GEMINI_API_KEY}"

    try:
        with httpx.Client(timeout=30.0) as client:
            response = client.post(url, json=payload)
            response.raise_for_status()
            result = response.json()
            
            candidate_text = result["candidates"][0]["content"]["parts"][0]["text"]
            clean_text = candidate_text.strip()
            if clean_text.startswith("```json"):
                clean_text = clean_text[7:]
            if clean_text.startswith("```"):
                clean_text = clean_text[3:]
            if clean_text.endswith("```"):
                clean_text = clean_text[:-3]

            parsed = json.loads(clean_text.strip())

            return {
                "provider": "Google Gemini (gemini-3.1-flash-lite)",
                "risk_level": parsed.get("risk_level", "LOW"),
                "summary": parsed.get("summary", "Analysis completed."),
                "issues": parsed.get("issues", []),
                "recommendations": parsed.get("recommendations", []),
            }
    except Exception as e:
        print(f"--> GEMINI API ERROR: {e}")
        fallback = analyze_code_with_rules(code_snippet)
        fallback["summary"] = f"{fallback['summary']} (API Note: {str(e)})"
        return fallback


def analyze_code_with_rules(code_snippet: str) -> dict:
    issues = []
    recommendations = []
    risk_level = "LOW"

    # 1. Command Injection / RCE
    if re.search(r'subprocess\.(check_output|call|Popen|run)\s*\(.*shell\s*=\s*True', code_snippet, re.IGNORECASE | re.DOTALL) or \
       re.search(r'os\.system\s*\(', code_snippet):
        issues.append("Critical Remote Code Execution / Command Injection via shell=True.")
        recommendations.append("Avoid shell=True. Pass command arguments as a list and sanitize inputs.")
        risk_level = "CRITICAL"

    # 2. SQL Injection
    has_select = re.search(r'(SELECT|UPDATE|DELETE|INSERT)\s+', code_snippet, re.IGNORECASE)
    has_sqli = (
        re.search(r'(SELECT|UPDATE|DELETE|INSERT).*f["\'].*\{.*\}', code_snippet, re.IGNORECASE | re.DOTALL)
        or ("SELECT" in code_snippet.upper() and ("f\"" in code_snippet or "f'" in code_snippet))
    )
    if has_sqli or (has_select and ("{" in code_snippet or "%s" in code_snippet)):
        issues.append("Potential SQL Injection vulnerability detected (unparameterized query).")
        recommendations.append("Use parameterized queries or ORM filters instead of string interpolation.")
        if risk_level != "CRITICAL":
            risk_level = "HIGH"

    # 3. Hardcoded Secrets
    has_secret_key = re.search(r'(api[_-]?key|password|secret|token|aws[_-]?secret)', code_snippet, re.IGNORECASE)
    has_secret_assignment = re.search(r'=\s*["\'][A-Za-z0-9_\-\.]{8,}["\']', code_snippet)
    if has_secret_key and has_secret_assignment:
        issues.append("Hardcoded secret/password or API token found.")
        recommendations.append("Move sensitive credentials to environment variables (.env).")
        risk_level = "CRITICAL"

    if not issues:
        summary = "Code passed automated security and quality checks with no critical issues found."
        recommendations.append("Ensure corresponding unit tests exist for this code block.")
    else:
        summary = f"Identified {len(issues)} code quality / security concern(s)."

    return {
        "provider": "Rule-based Engine (Fallback)",
        "risk_level": risk_level,
        "summary": summary,
        "issues": issues,
        "recommendations": recommendations,
    }


def perform_ai_review(code_snippet: str) -> dict:
    if not code_snippet or not code_snippet.strip():
        return {
            "provider": "none",
            "risk_level": "LOW",
            "summary": "No code provided to review.",
            "issues": [],
            "recommendations": [],
        }

    if GEMINI_API_KEY and GEMINI_API_KEY.strip():
        return analyze_code_with_gemini(code_snippet)

    return analyze_code_with_rules(code_snippet)