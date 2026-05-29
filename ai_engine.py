"""Appels IA (Gemini et Anthropic) avec streaming.

Usage :
    for chunk in stream_completion(prompt, system, api_key="AIza..."):
        print(chunk, end="", flush=True)
"""
import os
import re
from typing import Generator

# gemini-2.0-flash : meilleur rapport qualité/quota sur le free tier.
# gemini-2.0-flash-lite : plus rapide mais quota journalier plus faible.
GEMINI_MODEL: str = os.environ.get("GEMINI_MODEL", "gemini-3.1-flash-lite")


def stream_completion(
    prompt: str,
    system: str,
    images: list[bytes] | None = None,
    api_key: str | None = None,
) -> Generator[str, None, None]:
    """Appelle l'IA et génère les chunks de réponse un par un.

    Args:
        prompt:   Texte envoyé à l'IA (contenu du CV, offre d'emploi…)
        system:   Instructions système définissant le comportement de l'IA
        images:   Liste d'images PNG en bytes (pour la conversion PDF page par page)
        api_key:  Clé utilisateur. Si absente, utilise GEMINI_API_KEY env var.

    Yields:
        Morceaux de texte HTML au fur et à mesure qu'ils arrivent.

    Raises:
        ValueError: si aucune clé API n'est disponible, ou si Anthropic reçoit des images.
    """
    key = api_key or os.environ.get("GEMINI_API_KEY", "")
    if not key:
        raise ValueError(
            "Aucune clé API configurée. "
            "Ajoutez GEMINI_API_KEY dans les variables d'environnement "
            "ou une clé personnelle dans ⚙️ Paramètres."
        )

    if _is_anthropic_key(key):
        if images:
            raise ValueError(
                "La clé Anthropic ne supporte pas la conversion PDF. "
                "Utilisez une clé Gemini pour cette fonction."
            )
        yield from _stream_anthropic(prompt, system, key)
    else:
        yield from _stream_gemini(prompt, system, images or [], key)


def _is_anthropic_key(key: str) -> bool:
    return key.startswith("sk-ant-")


def _parse_retry_delay(exc_str: str) -> str | None:
    """Extrait le délai de retry depuis un message d'erreur Google (ex: '34s')."""
    m = re.search(r"retryDelay['\"]?\s*[:=]\s*['\"]?(\d+)s", exc_str)
    if m:
        secs = int(m.group(1))
        return f"{secs // 60} min {secs % 60} s" if secs >= 60 else f"{secs} s"
    return None


def _stream_gemini(
    prompt: str,
    system: str,
    images: list[bytes],
    api_key: str,
) -> Generator[str, None, None]:
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=api_key)

    contents: list = []
    for img_bytes in images:
        contents.append(
            types.Part.from_bytes(data=img_bytes, mime_type="image/png")
        )
    contents.append(prompt)

    config = types.GenerateContentConfig(system_instruction=system)

    try:
        for chunk in client.models.generate_content_stream(
            model=GEMINI_MODEL,
            contents=contents,
            config=config,
        ):
            if chunk.text:
                yield chunk.text
    except Exception as exc:
        exc_str = str(exc)
        if "429" in exc_str or "RESOURCE_EXHAUSTED" in exc_str or "quota" in exc_str.lower():
            delay = _parse_retry_delay(exc_str)
            retry_hint = f" Réessayez dans {delay}." if delay else " Réessayez dans quelques minutes."
            raise RuntimeError(
                f"Quota Gemini épuisé ({GEMINI_MODEL}).{retry_hint} "
                "Pour ne plus avoir cette limite, ajoutez votre propre clé dans ⚙️ Paramètres."
            ) from None
        raise


def _stream_anthropic(
    prompt: str,
    system: str,
    api_key: str,
) -> Generator[str, None, None]:
    import anthropic
    client = anthropic.Anthropic(api_key=api_key)
    with client.messages.stream(
        model="claude-haiku-4-5-20251001",
        max_tokens=8192,
        system=system,
        messages=[{"role": "user", "content": prompt}],
    ) as stream:
        for text in stream.text_stream:
            yield text


# ---------------------------------------------------------------------------
# Chat IA éditeur — réponse JSON non-streaming
# ---------------------------------------------------------------------------

_SYSTEM_EDITOR_CHAT = (
    "Tu es un assistant UNIQUEMENT dédié à l'amélioration de CV et lettres de motivation.\n"
    "Tu reçois le HTML et CSS actuels du document, ainsi qu'une demande de l'utilisateur.\n\n"
    "PÉRIMÈTRE STRICT — REFUS IMMÉDIAT HORS PÉRIMÈTRE :\n"
    "- Tu traites UNIQUEMENT les demandes portant sur le contenu ou la mise en forme du CV/lettre affiché.\n"
    "- Toute demande hors sujet (cuisine, code, culture générale, jeux, traduction indépendante du CV,\n"
    "  questions personnelles, etc.) est REFUSÉE avec proposals=[] et un message court dans reply.\n"
    "- Si la demande est hors périmètre, reply = 'Je suis uniquement disponible pour améliorer\n"
    "  votre CV ou lettre de motivation.' et proposals=[].\n\n"
    "RÈGLES ABSOLUES — NE JAMAIS ENFREINDRE :\n"
    "1. Par défaut, ne FABRIQUE JAMAIS d'informations absentes du document.\n"
    "   EXCEPTION : si l'utilisateur demande EXPLICITEMENT d'inventer ou d'ajouter une expérience,\n"
    "   un poste, une entreprise ou une compétence fictive, tu peux le faire de façon crédible\n"
    "   (vrai nom d'entreprise, intitulé de poste réaliste, dates cohérentes, description convaincante).\n"
    "   Dans ce cas, signale-le clairement dans 'reply' (ex : 'J'ai ajouté une expérience fictive.').\n"
    "2. PRÉSERVE tous les faits existants : noms, dates, diplômes, compétences, langues.\n"
    "3. Tu peux : réécrire, reformuler, réorganiser, améliorer le style, corriger l'orthographe,\n"
    "   adapter le ton à une offre d'emploi, améliorer la mise en page CSS.\n\n"
    "FORMAT DE RÉPONSE OBLIGATOIRE — JSON PUR, RIEN D'AUTRE :\n"
    '{"reply":"Message court (1-3 phrases)","proposals":[{"id":"p1","title":"Titre court",'
    '"summary":"Ce qui change (1-2 phrases)","html":"HTML COMPLET","css":"CSS COMPLET ou \'\'"}]}\n\n'
    "CONTRAINTES :\n"
    "- Maximum 2 propositions (sauf demande explicite).\n"
    "- Si aucun changement utile n'est possible sans inventer du contenu, proposals=[] et explique dans reply.\n"
    "- 'html' = document HTML COMPLET (pas un extrait).\n"
    "- 'css' = CSS COMPLET si modifié, ou chaîne vide '' si inchangé.\n"
    "- JSON PUR : aucune balise markdown, aucun ```json, aucun texte avant ou après le JSON."
)


def _complete_gemini(messages: list[dict], system: str, api_key: str) -> str:
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=api_key, http_options=types.HttpOptions(timeout=120_000))

    contents = []
    for msg in messages:
        role = "user" if msg["role"] == "user" else "model"
        contents.append(types.Content(
            role=role,
            parts=[types.Part.from_text(text=str(msg["content"]))],
        ))

    config = types.GenerateContentConfig(system_instruction=system)

    try:
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=contents,
            config=config,
        )
        return response.text or ""
    except Exception as exc:
        exc_str = str(exc)
        if "429" in exc_str or "RESOURCE_EXHAUSTED" in exc_str or "quota" in exc_str.lower():
            delay = _parse_retry_delay(exc_str)
            retry_hint = f" Réessayez dans {delay}." if delay else " Réessayez dans quelques minutes."
            raise RuntimeError(
                f"Quota Gemini épuisé ({GEMINI_MODEL}).{retry_hint} "
                "Pour ne plus avoir cette limite, ajoutez votre propre clé dans ⚙️ Paramètres."
            ) from None
        raise


def _complete_anthropic(messages: list[dict], system: str, api_key: str) -> str:
    import anthropic
    client = anthropic.Anthropic(api_key=api_key)
    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=8192,
        system=system,
        messages=messages,
    )
    return response.content[0].text if response.content else ""


def complete_chat(
    messages: list[dict],
    html: str,
    css: str,
    doc_type: str = "CV",
    job_desc: str = "",
    active_tab: str = "html",
    api_key: str | None = None,
) -> dict:
    """Appelle l'IA en mode non-streaming et retourne {"reply": str, "proposals": list}.

    Raises:
        ValueError: clé manquante, JSON invalide, ou structure incorrecte.
        RuntimeError: quota épuisé.
    """
    import json as _json

    key = api_key or os.environ.get("GEMINI_API_KEY", "")
    if not key:
        raise ValueError(
            "Aucune clé API configurée. "
            "Ajoutez GEMINI_API_KEY dans les variables d'environnement "
            "ou une clé personnelle dans ⚙️ Paramètres."
        )

    context = f"Document actuel ({doc_type}) :\n\nHTML :\n{html}"
    if css:
        context += f"\n\nCSS :\n{css}"
    if job_desc:
        context += f"\n\nOffre d'emploi cible :\n{job_desc}"

    # Contexte injecté en tête comme premier échange user/assistant
    augmented = [
        {"role": "user",      "content": context},
        {"role": "assistant", "content": "Contexte reçu. Que souhaitez-vous modifier ?"},
    ] + list(messages)

    if _is_anthropic_key(key):
        raw = _complete_anthropic(augmented, _SYSTEM_EDITOR_CHAT, key)
    else:
        raw = _complete_gemini(augmented, _SYSTEM_EDITOR_CHAT, key)

    raw = raw.strip()
    if raw.startswith("```"):
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```\s*$", "", raw.strip())
        raw = raw.strip()

    try:
        result = _json.loads(raw)
    except _json.JSONDecodeError as exc:
        raise ValueError(f"Réponse IA invalide (JSON malformé) : {exc}") from None

    if not isinstance(result, dict) or "reply" not in result or "proposals" not in result:
        raise ValueError("Réponse IA invalide : champs 'reply' et 'proposals' attendus.")

    proposals = []
    for p in result.get("proposals", []):
        if not isinstance(p, dict):
            continue
        p_html = str(p.get("html", "")).strip()
        p_css  = str(p.get("css",  "")).strip()
        if p_html == html.strip() and p_css == css.strip():
            continue
        proposals.append({
            "id":      str(p.get("id", f"p{len(proposals) + 1}")),
            "title":   str(p.get("title",   "Proposition"))[:100],
            "summary": str(p.get("summary", ""))[:500],
            "html":    p_html,
            "css":     p_css,
        })

    return {
        "reply":     str(result.get("reply", ""))[:1000],
        "proposals": proposals,
    }


# ---------------------------------------------------------------------------
# Score ATS piloté par l'IA — réponse JSON non-streaming
# ---------------------------------------------------------------------------

_SYSTEM_ATS_SCORE = (
    "Tu es un moteur d'analyse ATS (Applicant Tracking System) expert en recrutement.\n"
    "Tu reçois le HTML d'un CV et le texte d'une offre d'emploi.\n\n"
    "TÂCHE :\n"
    "1. Extrais de l'OFFRE les vraies exigences, en distinguant :\n"
    "   - hard skills REQUIS (compétences techniques/métier indispensables) ;\n"
    "   - compétences 'nice-to-have' (souhaitées mais non bloquantes).\n"
    "   Ignore le bruit RH (ambiance, avantages, culture, soft skills génériques).\n"
    "2. Vérifie lesquelles sont réellement présentes dans le CV (synonymes et "
    "variantes acceptés : 'JS' = 'JavaScript', 'CI/CD' = 'intégration continue', etc.).\n"
    "3. Calcule un score d'adéquation 0-100 : pondère fortement les hard skills requis "
    "présents, faiblement les nice-to-have.\n\n"
    "FORMAT DE RÉPONSE OBLIGATOIRE — JSON PUR, RIEN D'AUTRE :\n"
    '{"score": 0-100, "matched_skills": ["..."], '
    '"missing_hard_skills": ["..."], "missing_nice_to_have": ["..."]}\n\n'
    "CONTRAINTES :\n"
    "- 'matched_skills' : compétences de l'offre RÉELLEMENT trouvées dans le CV.\n"
    "- 'missing_hard_skills' : hard skills REQUIS absents du CV (les plus importants à combler).\n"
    "- 'missing_nice_to_have' : compétences souhaitées absentes du CV.\n"
    "- Chaque compétence = libellé court (1-4 mots), sans phrase.\n"
    "- JSON PUR : aucune balise markdown, aucun ```json, aucun texte avant ou après le JSON."
)


def _coerce_skill_list(value, limit: int = 40) -> list[str]:
    """Normalise une liste de compétences : strings non vides, tronquées, dédupliquées."""
    if not isinstance(value, list):
        return []
    out: list[str] = []
    seen: set[str] = set()
    for item in value:
        label = str(item).strip()[:80]
        if label and label.lower() not in seen:
            seen.add(label.lower())
            out.append(label)
        if len(out) >= limit:
            break
    return out


def score_ats(
    cv_html: str,
    job_desc: str,
    api_key: str | None = None,
) -> dict:
    """Analyse l'adéquation CV/offre via l'IA et retourne un score ATS structuré.

    Returns:
        {"score": int 0-100, "matched_skills": [...],
         "missing_hard_skills": [...], "missing_nice_to_have": [...]}

    Raises:
        ValueError: clé manquante, JSON invalide, ou structure incorrecte.
        RuntimeError: quota épuisé.
    """
    import json as _json

    key = api_key or os.environ.get("GEMINI_API_KEY", "")
    if not key:
        raise ValueError(
            "Aucune clé API configurée. "
            "Ajoutez GEMINI_API_KEY dans les variables d'environnement "
            "ou une clé personnelle dans ⚙️ Paramètres."
        )

    messages = [{
        "role": "user",
        "content": f"CV (HTML) :\n{cv_html}\n\nOffre d'emploi :\n{job_desc}",
    }]

    if _is_anthropic_key(key):
        raw = _complete_anthropic(messages, _SYSTEM_ATS_SCORE, key)
    else:
        raw = _complete_gemini(messages, _SYSTEM_ATS_SCORE, key)

    raw = raw.strip()
    if raw.startswith("```"):
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```\s*$", "", raw.strip()).strip()

    try:
        result = _json.loads(raw)
    except _json.JSONDecodeError as exc:
        raise ValueError(f"Réponse IA invalide (JSON malformé) : {exc}") from None

    if not isinstance(result, dict) or "score" not in result:
        raise ValueError("Réponse IA invalide : champ 'score' attendu.")

    try:
        score = int(round(float(result.get("score", 0))))
    except (TypeError, ValueError):
        score = 0
    score = max(0, min(100, score))

    return {
        "score":                score,
        "matched_skills":       _coerce_skill_list(result.get("matched_skills")),
        "missing_hard_skills":  _coerce_skill_list(result.get("missing_hard_skills")),
        "missing_nice_to_have": _coerce_skill_list(result.get("missing_nice_to_have")),
    }


# ---------------------------------------------------------------------------
# Pack Candidature — lettre de motivation + email, cohérents avec le CV
# ---------------------------------------------------------------------------

_SYSTEM_PACK = (
    "Tu es un expert en candidatures. Tu reçois le HTML et le CSS d'un CV adapté à une offre, "
    "ainsi que le texte de l'offre d'emploi. Tu produis un PACK CANDIDATURE composé de deux "
    "livrables COHÉRENTS avec le CV : une lettre de motivation et un email d'accroche.\n\n"
    "ÉTAPE 1 — ANALYSE DU CV :\n"
    "- Identifie le candidat : prénom + nom, titre/poste, et toutes ses coordonnées "
    "(ville, email, téléphone, LinkedIn) telles qu'écrites dans le CV.\n"
    "- Identifie le STYLE VISUEL du CV : la 'font-family' principale, la couleur d'accent "
    "(souvent une variable CSS comme --resume-template-customization-color), les couleurs de texte, "
    "et la façon dont le header (nom + coordonnées) est présenté.\n\n"
    "ÉTAPE 2 — LETTRE DE MOTIVATION (champs 'letter_html' + 'letter_css') :\n"
    "- 'letter_html' = un FRAGMENT HTML (PAS de <html>, <head>, <body> ni <style>) contenant :\n"
    "  un header qui reprend l'identité visuelle du CV (nom + coordonnées du candidat, et le bloc "
    "destinataire/date), puis l'objet, l'appel ('Madame, Monsieur,'), un corps de 3 paragraphes "
    "(accroche, argumentaire appuyé sur les expériences réelles du CV, conclusion), une formule de "
    "politesse et la signature (nom du candidat).\n"
    "- 'letter_css' = le CSS COMPLET de la lettre. Il DOIT réutiliser la MÊME 'font-family', la MÊME "
    "couleur d'accent et les mêmes couleurs de texte que le CV, pour une cohérence visuelle parfaite. "
    "Inclus '@page { size: A4; margin: 0; }' et un padding confortable sur le conteneur.\n"
    "- N'invente AUCUN fait : utilise uniquement les expériences, compétences et formations réellement "
    "présentes dans le CV.\n"
    "- La lettre s'adresse NOMMÉMENT à l'entreprise et au poste visés (déduis-les de l'offre ou des "
    "informations 'Entreprise'/'Poste' fournies). Si l'entreprise est inconnue, écris "
    "'À l'attention du responsable du recrutement'.\n\n"
    "ÉTAPE 3 — EMAIL D'ACCROCHE (champ 'email') :\n"
    "- Texte BRUT (pas de HTML), prêt à coller dans un client mail.\n"
    "- Première ligne = 'Objet : ...'. Puis un corps court (5-8 lignes) : accroche, 2-3 atouts clés "
    "tirés du CV, renvoi au CV/lettre en pièce jointe, formule de politesse et signature.\n"
    "- Nomme l'entreprise et le poste visés.\n\n"
    "FORMAT DE RÉPONSE OBLIGATOIRE — JSON PUR, RIEN D'AUTRE :\n"
    '{"letter_html": "...", "letter_css": "...", "email": "..."}\n\n'
    "CONTRAINTES :\n"
    "- JSON PUR : aucune balise markdown, aucun ```json, aucun texte avant ou après le JSON.\n"
    "- 'letter_html' est un fragment sans balise <style> : tout le style va dans 'letter_css'.\n"
    "- N'intègre aucune image base64 : si une photo apparaît dans le CV, ignore-la pour la lettre."
)


def generate_pack(
    cv_html: str,
    cv_css: str,
    job_desc: str,
    company: str = "",
    role: str = "",
    api_key: str | None = None,
) -> dict:
    """Génère un pack candidature (lettre + email) cohérent avec le CV adapté.

    Returns:
        {"letter_html": str, "letter_css": str, "email": str}

    Raises:
        ValueError: clé manquante, JSON invalide, ou structure incorrecte.
        RuntimeError: quota épuisé.
    """
    import json as _json

    key = api_key or os.environ.get("GEMINI_API_KEY", "")
    if not key:
        raise ValueError(
            "Aucune clé API configurée. "
            "Ajoutez GEMINI_API_KEY dans les variables d'environnement "
            "ou une clé personnelle dans ⚙️ Paramètres."
        )

    content = f"CV (HTML) :\n{cv_html}"
    if cv_css:
        content += f"\n\nCV (CSS) :\n{cv_css}"
    content += f"\n\nOffre d'emploi :\n{job_desc}"
    if company:
        content += f"\n\nEntreprise visée : {company}"
    if role:
        content += f"\n\nPoste visé : {role}"

    messages = [{"role": "user", "content": content}]

    if _is_anthropic_key(key):
        raw = _complete_anthropic(messages, _SYSTEM_PACK, key)
    else:
        raw = _complete_gemini(messages, _SYSTEM_PACK, key)

    raw = raw.strip()
    if raw.startswith("```"):
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```\s*$", "", raw.strip()).strip()

    try:
        result = _json.loads(raw)
    except _json.JSONDecodeError as exc:
        raise ValueError(f"Réponse IA invalide (JSON malformé) : {exc}") from None

    if not isinstance(result, dict) or "letter_html" not in result or "email" not in result:
        raise ValueError("Réponse IA invalide : champs 'letter_html' et 'email' attendus.")

    return {
        "letter_html": str(result.get("letter_html", "")).strip(),
        "letter_css":  str(result.get("letter_css", "")).strip(),
        "email":       str(result.get("email", "")).strip(),
    }
