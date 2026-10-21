# ML-сервис: анализ выписки и объяснение решения

Сервис читает выписку по счёту ИП (CSV/XLSX), считает реальные доходы бизнеса и превращает коды причин решения в понятный клиенту текст. Нейросеть здесь необязательна: без неё всё работает, с ней точнее.

## Запуск

```bash
# Docker, без нейросети (правила + шаблоны)
docker compose up --build ml                 # http://localhost:8000/docs

# Docker + Ollama с Qwen2.5 7B (первый запуск скачает модель ~4.7 ГБ)
docker compose --profile llm up --build

# Локально
python3.13 -m venv .venv && .venv/bin/pip install -r requirements-dev.txt
.venv/bin/uvicorn app.api:app --port 8000
.venv/bin/python -m pytest -q                # тесты
.venv/bin/python -m eval.evaluate [--llm]    # качество на демо-файлах → eval/report.json
.venv/bin/python -m app.precompute data/demo/*.csv --as-of 2026-10-21   # прогрев кэша для демо
```

На Mac Ollama лучше ставить нативно (`brew install ollama && ollama pull qwen2.5:7b-instruct`): в Docker она работает без GPU и медленно. Тогда задайте `OLLAMA_URL=http://host.docker.internal:11434`.

## API

| Метод | Что делает |
|---|---|
| `POST /v1/statement/analyze` (multipart `file`; `as_of`, `use_llm`, `include_transactions`) | показатели выписки или `manual_input_required` с причиной |
| `POST /v1/explain` `{reason_codes, decision, context}` | текст для клиента: `source` = `llm` / `template` / `generic` |
| `GET /health`, `GET /v1/categories` | состояние сервиса и нейросети, список категорий |

Полная схема лежит в `docs/openapi.json`, Swagger — на `/docs`.

## Какую модель и как используем

- **Модель:** [Qwen2.5-7B-Instruct](https://huggingface.co/Qwen/Qwen2.5-7B-Instruct) (открытые веса, лицензия Apache 2.0), запускается через [Ollama](https://ollama.com) (MIT), тег `qwen2.5:7b-instruct`. Модель не дообучаем, платные API не используем.
- **Где используется:**
  1. **Классификация операций.** Модель видит только строки, которые не поняли правила. Ей передаются список категорий, примеры и строки пачками до 15 штук. Ответ приходит строго в JSON по схеме с `enum` категорий (structured outputs Ollama), `temperature=0`. Если модель не уверена, она отвечает `unclear`. Категория, которой нет в списке или которая не подходит по знаку суммы (например, «налог» для прихода), отбрасывается.
  2. **Объяснение решения.** Модель только переписывает готовый шаблон своими словами (`temperature=0.3`, `seed=42`). Ответ проходит проверки: нет новых чисел, нет «одобрено» без одобрения, нет обещаний, нет канцелярита, сохранён следующий шаг («в кабинете»), не больше трёх предложений. Если хоть одна проверка не пройдена, показываем исходный шаблон.
- **Отказоустойчивость:** проверка доступности занимает 1,5 с, запрос к модели ограничен `LLM_TIMEOUT_S`, на всю классификацию отводится не больше 25 с. Если модель недоступна, недоступные строки остаются «неясно», а клиенту показывается шаблон.
- **Кэш:** ответы модели хранятся в `cache/llm_cache.json`, готовые результаты по sha256 файла — в `cache/results/`. Демо-файлы, прогретые через `app.precompute`, отдаются мгновенно, даже когда Ollama выключена.

## Переменные окружения

| Переменная | По умолчанию | Смысл |
|---|---|---|
| `LLM_ENABLED` | `1` | `0` отключает нейросеть полностью |
| `OLLAMA_URL` | `http://localhost:11434` | адрес Ollama |
| `OLLAMA_MODEL` | `qwen2.5:7b-instruct` | модель |
| `LLM_TIMEOUT_S` | `20` | таймаут одного запроса |
| `RESULT_CACHE_DIR` | `cache/results` | кэш результатов анализа |
| `LLM_CACHE_PATH` | `cache/llm_cache.json` | кэш ответов модели |

## Сторонние компоненты (для THIRD_PARTY_NOTICES)

- Qwen2.5-7B-Instruct (Apache 2.0)
- Ollama (MIT)
- FastAPI, Pydantic, openpyxl (MIT)
- Starlette, Uvicorn, pandas, NumPy (BSD-3)
- python-multipart (Apache 2.0)

Данные в `data/` синтетические. Внешних интеграций нет.
