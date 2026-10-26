"""Страницы документа → строки и слова с координатами в пунктах PDF (1/72 дюйма).

PDF с текстовым слоем читаем pdfplumber. Страницу без текста (скан) и картинку (JPG/PNG/TIFF)
распознаём Tesseract (язык rus: с rus+eng движок путает кириллицу с похожей латиницей).
У слов из OCR есть уверенность движка 0..1, у текстового слоя — None: выдуманную уверенность не ставим.
"""

import io
import os
import re
import shutil
import subprocess
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
from statistics import median

import pdfplumber
from PIL import Image, UnidentifiedImageError

from .parser import StatementError

OCR_LANG = os.getenv("OCR_LANG", "rus")
OCR_PSM = os.getenv("OCR_PSM", "6")             # 6 — единый блок текста: строки таблиц не рвутся
OCR_DPI = int(os.getenv("OCR_DPI", "300"))      # растр перед OCR приводим к этому разрешению
OCR_TIMEOUT_S = float(os.getenv("OCR_TIMEOUT_S", "60"))
OCR_WORKERS = int(os.getenv("OCR_WORKERS", "4"))
MAX_PAGES = int(os.getenv("DOC_MAX_PAGES", "30"))
LOW_DPI = 100           # ниже — критические значения не принимаем без сотрудника
MIN_TEXT_CHARS = 20     # меньше символов в текстовом слое — считаем страницу сканом
A4_LONG_SIDE_IN = 11.69  # длинная сторона листа A4
WINDOWS_TESSERACT = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
# Повторное чтение фрагмента (одна строка, другие масштабы), если значение не прошло проверку (ИНН).
REREAD = [(150, "7"), (200, "7"), (250, "8")]


@dataclass
class Word:
    text: str
    x0: float
    x1: float
    top: float
    bottom: float
    conf: float | None = None


@dataclass
class Line:
    page: int
    words: list[Word]
    image: Image.Image | None = field(default=None, repr=False)  # растр страницы OCR — для перечитывания

    @property
    def text(self) -> str:
        return " ".join(w.text for w in self.words)

    @property
    def x0(self) -> float:
        return self.words[0].x0

    @property
    def x1(self) -> float:
        return max(w.x1 for w in self.words)

    @property
    def top(self) -> float:
        return min(w.top for w in self.words)

    @property
    def bottom(self) -> float:
        return max(w.bottom for w in self.words)

    @property
    def height(self) -> float:
        return median(w.bottom - w.top for w in self.words)

    @property
    def conf(self) -> float | None:
        return self.conf_of("")

    def conf_of(self, raw: str) -> float | None:
        """Уверенность OCR по словам значения raw (по всей строке, если raw пуст): соседний мусор не портит дату."""
        key = lambda t: re.sub(r"\W", "", t.lower())  # noqa: E731
        words = [w for w in self.words if raw and key(w.text) and key(w.text) in key(raw)] or self.words
        confs = [w.conf for w in words if w.conf is not None]
        return round(min(confs), 3) if confs else None

    @property
    def bbox(self) -> list[float]:
        return [round(v, 1) for v in (self.x0, self.top, self.x1, self.bottom)]

    def segments(self) -> list["Line"]:
        """Куски строки, разделённые широким пробелом, — ячейки колонок («Поставщик … Покупатель»)."""
        parts = [[self.words[0]]]
        for prev, w in zip(self.words, self.words[1:]):
            if w.x0 - prev.x1 > 1.2 * self.height:
                parts.append([])
            parts[-1].append(w)
        return [Line(self.page, p, self.image) for p in parts]


@dataclass
class Page:
    number: int
    lines: list[Line]
    source: str               # text | ocr | ocr_unavailable
    dpi: float | None = None  # разрешение растра; для текстового слоя None


def group_lines(words: list[Word], page: int, image: Image.Image | None = None) -> list[Line]:
    """Слова → строки: слово попадает в строку, если его середина по высоте внутри строки."""
    rows: list[list[Word]] = []
    for w in sorted(words, key=lambda w: w.top):
        mid = (w.top + w.bottom) / 2
        if rows and min(x.top for x in rows[-1]) <= mid <= max(x.bottom for x in rows[-1]):
            rows[-1].append(w)
        else:
            rows.append([w])
    return [Line(page, sorted(r, key=lambda w: w.x0), image) for r in rows]


def tesseract_cmd() -> str | None:
    found = shutil.which(os.getenv("TESSERACT_CMD", "tesseract"))
    return found or (WINDOWS_TESSERACT if os.path.exists(WINDOWS_TESSERACT) else None)


def _ocr_words(img: Image.Image, psm: str | None = None, k: float | None = None, extra: tuple = ()) -> list[Word]:
    """Tesseract TSV → слова в пунктах (k — пунктов на пиксель; по умолчанию img в разрешении OCR_DPI).
    Сбой или таймаут OCR = пустая страница: она уйдёт сотруднику, а не уронит запрос."""
    buf = io.BytesIO()
    img.save(buf, "PNG")
    try:
        out = subprocess.run([tesseract_cmd(), "stdin", "stdout", "-l", OCR_LANG, "--psm", psm or OCR_PSM, *extra,
                              "tsv"], input=buf.getvalue(), capture_output=True, timeout=OCR_TIMEOUT_S,
                             env={**os.environ, "OMP_THREAD_LIMIT": "1"}).stdout.decode("utf-8", "replace")
    except (subprocess.SubprocessError, OSError):
        return []
    k = k or 72 / OCR_DPI
    words = []
    for row in out.splitlines()[1:]:
        c = row.split("\t")
        if len(c) == 12 and c[0] == "5" and c[11].strip():
            left, top, width, height = map(int, c[6:10])
            words.append(Word(c[11].strip(), left * k, (left + width) * k, top * k, (top + height) * k,
                              round(max(float(c[10]), 0) / 100, 3)))
    return words


def _ocr_pages(items: list[tuple[int, Image.Image, float | None]]) -> list[Page]:
    """items: (номер страницы, серая картинка в OCR_DPI, исходное разрешение). Страницы распознаются параллельно."""
    if not items:
        return []
    if tesseract_cmd() is None:
        return [Page(n, [], "ocr_unavailable", dpi) for n, _, dpi in items]
    with ThreadPoolExecutor(OCR_WORKERS) as pool:
        words = list(pool.map(lambda it: _ocr_words(it[1]), items))
    return [Page(n, group_lines(w, n, img), "ocr", dpi) for (n, img, dpi), w in zip(items, words)]


def reread(line: Line, chars: str):
    """Варианты текста фрагмента line, заново распознанного как одна строка в нескольких масштабах."""
    if line.image is None:
        return
    k, pad = OCR_DPI / 72, line.height / 2
    box = tuple(round(v * k) for v in (line.x0 - pad, line.top - pad, line.x1 + pad, line.bottom + pad))
    crop = line.image.crop(box)
    for dpi, psm in REREAD:
        size = (max(1, round(crop.width * dpi / OCR_DPI)), max(1, round(crop.height * dpi / OCR_DPI)))
        words = _ocr_words(crop.resize(size, Image.LANCZOS), psm, 72 / dpi, ("-c", f"tessedit_char_whitelist={chars}"))
        if words:
            yield Line(line.page, words)


def _raster_dpi(page) -> float | None:
    sizes = [im["srcsize"][0] / (float(im["width"]) / 72) for im in page.images if im.get("srcsize")]
    return round(max(sizes), 1) if sizes else None


def _pdf_pages(raw: bytes) -> list[Page]:
    try:
        with pdfplumber.open(io.BytesIO(raw)) as pdf:
            if len(pdf.pages) > MAX_PAGES:
                raise StatementError("TOO_MANY_PAGES", f"В документе {len(pdf.pages)} стр., максимум {MAX_PAGES}.")
            pages, raster = [], []
            for n, p in enumerate(pdf.pages, 1):
                words = p.extract_words()
                if sum(len(w["text"]) for w in words) >= MIN_TEXT_CHARS:
                    pages.append(Page(n, group_lines([Word(w["text"], w["x0"], w["x1"], w["top"], w["bottom"])
                                                      for w in words], n), "text"))
                else:
                    raster.append((n, p.to_image(resolution=OCR_DPI).original.convert("L"), _raster_dpi(p)))
    except StatementError:
        raise
    except Exception as e:  # pdfminer бросает что угодно на битом или зашифрованном файле
        raise StatementError("UNREADABLE", "Не удалось открыть PDF.") from e
    return sorted(pages + _ocr_pages(raster), key=lambda p: p.number)


def _image_pages(raw: bytes) -> list[Page]:
    try:
        img = Image.open(io.BytesIO(raw)).convert("RGB")  # серое — после масштабирования: так OCR точнее
    except (UnidentifiedImageError, OSError) as e:
        raise StatementError("UNSUPPORTED_FORMAT", "Поддерживаются PDF, JPG, PNG, TIFF, CSV и XLSX.") from e
    # DPI из метаданных берём, только если с ним лист похож на A4/A3 (телефон пишет 72 при 4000 px — это 55″);
    # иначе считаем, что в кадре лист A4.
    meta = float(img.info.get("dpi", (0,))[0] or 0)
    dpi = meta if meta and 8 <= max(img.size) / meta <= 17 else max(img.size) / A4_LONG_SIDE_IN
    k = OCR_DPI / dpi
    gray = img.resize((round(img.width * k), round(img.height * k)), Image.LANCZOS).convert("L")
    return _ocr_pages([(1, gray, round(dpi, 1))])


def is_document(raw: bytes) -> bool:
    """PDF или картинка (а не таблица CSV/XLSX)."""
    return raw[:5] == b"%PDF-" or raw[:3] == b"\xff\xd8\xff" or raw[:8] == b"\x89PNG\r\n\x1a\n" \
        or raw[:4] in (b"II*\x00", b"MM\x00*")


def load_pages(raw: bytes) -> list[Page]:
    return _pdf_pages(raw) if raw[:5] == b"%PDF-" else _image_pages(raw)
