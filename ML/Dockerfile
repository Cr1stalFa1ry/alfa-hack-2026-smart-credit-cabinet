FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 \
    OLLAMA_URL=http://ollama:11434 OLLAMA_MODEL=qwen2.5:7b-instruct LLM_ENABLED=1
WORKDIR /srv
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app ./app
COPY cache ./cache
COPY data ./data
COPY eval ./eval

RUN useradd --create-home ml && chown -R ml /srv/cache
USER ml
EXPOSE 8000
HEALTHCHECK --interval=15s --timeout=3s CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health', timeout=2)"
CMD ["uvicorn", "app.api:app", "--host", "0.0.0.0", "--port", "8000"]
