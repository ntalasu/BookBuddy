"""Book recommendations for kids.

Open Library finds popular books on a topic (ranked by how many readers logged them),
then Google Books checks each one is really a kids' book and gives us its cover,
description, and the id the bookshelf uses.
"""
import math
import re
from functools import lru_cache

import requests

from services.google_books import get_book_details, search_books

OPEN_LIBRARY_URL = "https://openlibrary.org/search.json"

# Our topic words (from the chat) -> Open Library subjects
SUBJECTS = {
    "adventure": "adventure and adventurers",
    "mystery": "mystery and detective stories",
    "funny": "humorous stories",
    "fantasy": "fantasy",
    "magic": "magic",
    "fairy": "fairy tales",
    "ghost": "ghosts",
    "superhero": "superheroes",
    "comic": "comic books, strips",
    "poems": "children's poetry",
    "dragon": "dragons",
    "unicorn": "unicorns",
    "princess": "princesses",
    "knight": "knights and knighthood",
    "monster": "monsters",
    "pirate": "pirates",
    "dog": "dogs",
    "cat": "cats",
    "horse": "horses",
    "animal": "animals",
    "pet": "pets",
    "dinosaur": "dinosaurs",
    "bug": "insects",
    "ocean": "ocean",
    "space": "outer space",
    "robot": "robots",
    "science": "science",
    "history": "history",
    "biography": "biography",
    "camping": "camping",
    "nature": "nature",
    "soccer": "soccer",
    "baseball": "baseball",
    "basketball": "basketball",
    "sports": "sports",
    "truck": "trucks",
    "train": "railroads",
    "friend": "friendship",
    "family": "family life",
    "school": "schools",
    "holiday": "holidays",
    "birthday": "birthdays",
    "toy": "toys",
    "video game": "video games",
    "build": "building",
    "art": "art",
    "music": "music",
    "cooking": "cooking",
}

# Words that show a book is really about a topic (checked in its Google title and description).
# Topics not listed here just use the topic word itself, like "dinosaur" or "dragon".
TOPIC_WORDS = {
    # Whole words (plurals count too: "dragon" matches "dragons", but "art" doesn't match "Arthur").
    # A * means any ending: "myster*" matches mystery, mysteries, mysterious.
    "adventure": ("adventure", "quest", "journey", "explore*"),
    "mystery": ("myster*", "detective", "solve*", "clue", "case"),
    "funny": ("funny", "humor*", "humour*", "laugh*", "silly", "hilarious*", "joke", "giggle*"),
    "fantasy": ("magic*", "fantasy", "dragon", "wizard", "quest", "kingdom"),
    "magic": ("magic*", "wizard", "witch", "witches", "spell", "enchant*"),
    "fairy": ("fairy", "fairies", "princess", "princesses", "once upon"),
    "ghost": ("ghost", "haunt*", "spook*", "spirit"),
    "comic": ("comic", "graphic novel"),
    "poems": ("poem", "poetry", "rhym*", "verse"),
    "knight": ("knight", "castle"),
    "pet": ("pet", "dog", "cat", "puppy", "puppies", "kitten"),
    "animal": ("animal", "creature", "zoo", "farm", "forest"),
    "bug": ("bug", "insect", "butterfl*", "ant", "bee", "spider"),
    "ocean": ("ocean", "sea", "fish", "whale", "shark"),
    "space": ("space", "planet", "astronaut", "rocket", "star", "moon"),
    "science": ("scien*", "experiment", "invent*"),
    "history": ("histor*", "long ago", "ancient"),
    "biography": ("life", "born", "biograph*", "true story"),
    "nature": ("nature", "forest", "tree", "garden", "wild"),
    "truck": ("truck", "car"),
    "train": ("train", "railroad"),
    "friend": ("friend", "friendship"),
    "family": ("family", "families", "brother", "sister", "mom", "dad", "grand*"),
    "school": ("school", "classroom", "teacher"),
    "holiday": ("holiday", "christmas", "halloween", "thanksgiving", "hanukkah"),
    "video game": ("game", "video game"),
    "build": ("build", "builds", "building", "builder"),
    "cooking": ("cook*", "bak*", "kitchen", "food", "recipe"),
    "art": ("art", "artist", "paint*", "draw", "draws", "drawing", "drew", "museum", "crayon", "sculpt*"),
    "music": ("music*", "song", "sing*", "band", "piano", "guitar", "drum", "concert"),
}


def mentions(text, words):
    """Does the text have any of these words? Matches from the start of a word,
    so "war" doesn't match "awards" (but "myster" matches "mystery")."""
    return any(re.search(r"\b" + re.escape(word), text) for word in words)


# Sentences in descriptions about awards, editions, reviews, and pictures, not the story.
# ("Features new interior spot art" doesn't make a book about art.)
NOT_THE_STORY = re.compile(
    r"award|winner|medal|bestsell|best-sell|edition|new york times|#1|praise|acclaim|generation|classic|"
    r"author|readers|paperback|hardcover|repackag|illustrat|series|called|features|guardian|review|"
    r"netflix|movie|adapt|spot art|cover art|art by|art from|artwork|concept art|making of|full-color|full color|pictures by",
    re.IGNORECASE,
)


def story_text(book):
    """Just the sentences of the description that tell what happens in the book."""
    sentences = re.split(r'(?<=[.!?])["”’]?\s+', book.get("description", ""))
    return " ".join(s for s in sentences if not NOT_THE_STORY.search(s)).lower()


def word_pattern(word):
    """ "dragon" -> whole word or plural ("dragons"), but not "dragonfly".
    "myster*" -> any word starting with "myster" (mystery, mysterious)."""
    if word.endswith("*"):
        return r"\b" + re.escape(word[:-1])
    return r"\b" + re.escape(word) + r"(?:s|es)?\b"


def count_mentions(text, words):
    """How many times any of these words show up."""
    return sum(len(re.findall(word_pattern(word), text)) for word in words)


def topic_score(book, topic):
    """How much the book is really about a topic, from reading its title and story.
    0 means it isn't about the topic at all."""
    words = TOPIC_WORDS.get(topic, (topic,))
    in_title = count_mentions(book.get("title", "").lower(), words)
    in_story = count_mentions(story_text(book), words)
    return 2 * min(in_title, 1) + min(in_story, 4)


def interest_score(book, interests):
    """How many of the kid's other interests the story mentions (like a dog in a ghost story)."""
    story = story_text(book)
    stems = [i.lower().split(" &")[0].rstrip("s") for i in interests]
    return sum(1 for stem in stems if len(stem) >= 3 and re.search(r"\b" + re.escape(stem), story))


# Subjects that mean a book is for teens or grown-ups
NOT_FOR_KIDS = (
    "young adult", "romance", "love stories", "sexual", "rape", "drug", "erotic", "horror tales",
    "suicide", "abuse", "self-harm", "trauma", "high school",
)

# Words in a story that mean it's too violent for younger kids (8 and under)
VIOLENT_STORY = re.compile(
    r"\b(brutal\w*|savage\w*|murder\w*|blood\w*|slaughter\w*|kill\w*|vicious\w*|tortur\w*|wars?|warfare|died|dies|death)\b"
)

# Descriptions that point to teen or grown-up books, even when Google calls them kids' books
GROWN_UP_DESCRIPTION = re.compile(
    r"game of thrones|\bhbo\b|young adult|\bteens?\b|adult readers|for adults|mature readers"
)

# Exact subjects for older classics written for all ages (The Call of the Wild, Treasure Island).
# Harder words and rougher stories, so they wait until 9. (Books written for kids don't have these.)
OLDER_CLASSICS = {"classic literature", "american literature", "english literature", "fiction, classics"}

# Heavy subjects that are too much for younger kids (8 and under)
TOO_HEAVY_FOR_YOUNGER = ("death", "murder", "violence", "war", "racism", "police", "shooting", "grief", "slavery", "holocaust")


# Longest book (in pages) that usually fits a kid of this age
def max_pages(age):
    if age <= 5:
        return 64
    if age <= 6:
        return 120
    if age <= 7:
        return 200
    if age <= 8:
        return 320
    if age <= 9:
        return 400
    return 450


def min_pages(age):
    """Shortest book that still fits: no 32-page picture books for a 10-year-old."""
    if age >= 10:
        return 80
    if age >= 9:
        return 48
    return 0


NUMBER_WORDS = {
    "five": 5, "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10, "eleven": 11,
    "twelve": 12, "thirteen": 13, "fourteen": 14, "fifteen": 15, "sixteen": 16, "seventeen": 17,
}


def stated_age_range(description):
    """Ages the description says the book is for, like "Ages 4-8" or "Grades 3-5". None if it doesn't say."""
    text = description.lower()
    ages = re.search(r"\bages?\s*(\d{1,2})\s*(?:-|–|—|to)\s*(\d{1,2})", text)
    if ages:
        return int(ages.group(1)), int(ages.group(2))
    ages_up = re.search(r"\bages?\s*(\d{1,2})\s*(?:\+|and up)", text)
    if ages_up:
        return int(ages_up.group(1)), 99
    grades = re.search(r"\bgrades?\s*(k|\d)\s*(?:-|–|—|to)\s*(\d)", text)
    if grades:
        first = 0 if grades.group(1) == "k" else int(grades.group(1))
        return first + 5, int(grades.group(2)) + 6  # grade 3 is about 8 years old
    if "middle grade" in text or "middle-grade" in text:
        return 8, 12
    if re.search(r"picture book|board book|toddler|preschool", text):
        return 2, 7
    return None


def main_character_age(story):
    """The age of a "twelve-year-old" (or "12-year-old") in the story, or None."""
    match = re.search(r"\b(\d{1,2}|" + "|".join(NUMBER_WORDS) + r")[- ]year[- ]old\b", story)
    if not match:
        return None
    word = match.group(1)
    return int(word) if word.isdigit() else NUMBER_WORDS[word]


@lru_cache(maxsize=512)
def detailed_categories(book_id):
    """Google's detailed library categories for one book, like
    "Juvenile Fiction / Readers / Beginner" or "Juvenile Fiction / Horror". Often empty."""
    try:
        return tuple(c.lower() for c in get_book_details(book_id).get("categories") or [])
    except requests.RequestException:
        return ()


# Reading-stage labels (from Open Library subjects or Google categories) -> ages they usually fit
READING_STAGES = [
    (("board book",), (1, 4)),
    (("picture book", "nyt:picture-books"), (3, 7)),
    (("readers / beginner", "i can read", "readers (primary)", "beginner reader", "easy reader", "early reader"), (4, 7)),
    (("chapter book",), (6, 9)),
    (("readers (elementary)",), (6, 10)),
    (("middle grade",), (8, 12)),
]

# Typical Lexile measure where each grade starts (MetaMetrics' typical reader ranges, roughly)
LEXILE_GRADE_STARTS = [(1000, 7), (925, 6), (830, 5), (740, 4), (520, 3), (420, 2), (0, 1)]


def lexile_to_grade(lexile):
    return next(grade for start, grade in LEXILE_GRADE_STARTS if lexile >= start)


def reading_level_ages(doc, categories):
    """The reading ages a book fits, estimated from the best clue it has:
       1. an exact grade or Lexile (Open Library: "Reading Level-Grade 5", "Lexile 301-400")
       2. a reading stage ("I Can Read", "Beginner", "Chapter Books", "Picture Books")
    Returns (youngest, oldest, which clue) or None when there's no clue (then page count decides)."""
    subjects = [s.lower() for s in doc.get("subject", [])]

    grades = [int(m.group(1)) for s in subjects if (m := re.search(r"reading level-grade (\d+)", s))]
    if grades:
        return min(grades) + 5, max(grades) + 6, "grade"

    for s in subjects:
        lexile = re.search(r"lexile (\d+)", s)
        if lexile:
            grade = lexile_to_grade(int(lexile.group(1)))
            return grade + 4, grade + 7, "lexile"

    labels = " | ".join(subjects + list(categories))
    for words, ages in READING_STAGES:
        if any(word in labels for word in words):
            return ages[0], ages[1], "stage"
    return None


# Google categories that are too much for younger kids (8 and under)
HEAVY_CATEGORIES = (
    "prejudice & racism", "death & dying", "violence", "war & military", "drugs",
    "sexual abuse", "suicide", "self-harm", "physical & emotional abuse", "dystopian",
)


# New York Times bestseller lists (Open Library tags books with them, like "nyt:picture-books=2014-01-05")
NYT_GROWN_UP_LISTS = ("hardcover_fiction", "hardcover-fiction", "trade-fiction", "paperback_trade_fiction",
                      "mass-market", "e-book-fiction", "combined-print")
NYT_MIDDLE_GRADE_LISTS = ("middle-grade", "chapter_books", "chapter-books")


def nyt_lists(doc):
    return [s.lower() for s in doc.get("subject", []) if s.lower().startswith("nyt:")]


def fits_age(book, doc, age, reading_age):
    """Is the book right for this kid's age (what it's about) and reading level (how hard it is)?"""
    categories = tuple(c.lower() for c in book.get("categories", []))

    # which New York Times bestseller list it was on is a strong clue about who it's for
    lists = " ".join(nyt_lists(doc))
    if any(name in lists for name in NYT_GROWN_UP_LISTS):
        return False  # a grown-up bestseller
    if "young-adult" in lists and age < 12:
        return False  # a teen bestseller (like The Ice Dragon)
    if any(name in lists for name in NYT_MIDDLE_GRADE_LISTS) and age < 8:
        return False  # a middle-grade bestseller, for ages 8 to 12

    # content: what the description says the ages are, and how old the main character is
    stated = stated_age_range(book.get("description", ""))
    if stated and not (stated[0] - 1 <= age <= stated[1] + 1):
        return False
    character_age = main_character_age(story_text(book))
    # kids like reading about kids a bit older than them, but not much older
    if character_age and character_age > age + 3:
        return False
    if age <= 8 and any(heavy in c for c in categories for heavy in HEAVY_CATEGORIES):
        return False
    # kid-friendly scary books (like Goosebumps) are filed as "Horror", so only skip them for 7 and under
    if age <= 7 and any("horror" in c for c in categories):
        return False

    # reading level: an exact grade, Lexile, or reading stage if the book has one
    level = reading_level_ages(doc, categories)
    if level and not (level[0] - 1 <= reading_age <= level[1] + 1):
        return False

    # no level clues at all: book length is the last resort
    pages = book.get("pageCount") or 0
    if not level and pages and pages < min_pages(age):
        return False
    return True


def category_interest_score(book, interests):
    """How many of the kid's interests show up in Google's detailed categories
    (like "Humorous Stories" for a kid who picked Funny). A strong sign the book fits."""
    categories = " | ".join(
        c.lower() for c in book.get("categories", [])
    )
    stems = {"funny": "humor", "jokes & riddles": "humor", "spooky": "horror", "pets": "pet", "animals": "animal"}
    words = [stems.get(i.lower(), i.lower().split(" &")[0].rstrip("s")) for i in interests]
    return sum(1 for word in words if len(word) >= 3 and word in categories)


@lru_cache(maxsize=256)
def popular_books(subjects):
    """Popular kids' books with all of these Open Library subjects, most-read first."""
    query = " ".join(f'subject:"{subject}"' for subject in subjects)
    query += ' (subject:"juvenile fiction" OR subject:"juvenile literature")'

    response = requests.get(
        OPEN_LIBRARY_URL,
        params={
            "q": query,
            "sort": "readinglog",
            "limit": 50,
            "fields": "title,author_name,readinglog_count,number_of_pages_median,subject",
        },
        headers={"User-Agent": "BookBuddy (kids reading app)"},
        timeout=10,
    )
    response.raise_for_status()
    return tuple(response.json().get("docs", []))


def title_key(title):
    """ "The Dragonet Prophecy (Wings of Fire #1): Special Edition" -> "dragonetprophecy" """
    title = re.sub(r"\(.*?\)", "", title.lower().split(":")[0])
    title = re.sub(r"^\s*the\s+", "", title)
    return "".join(c for c in title if c.isalnum())


# Books that aren't stories to read
NOT_A_STORY = re.compile(r"how to draw|coloring|colouring|activity|sticker|workbook|puzzle|game of|guide to|encyclopedia", re.IGNORECASE)

# Self-publishing services: anyone can publish there, so there's no editor checking the book
SELF_PUBLISHERS = re.compile(
    r"independently published|createspace|lulu|xlibris|authorhouse|iuniverse|trafford|outskirts|page publishing|"
    r"dorrance|christian faith|archway|balboa|friesen|tellwell|bookbaby|draft2digital|smashwords|blurb|"
    r"kindle direct|austin macauley|self[- ]published|westbow|liferich|partridge|notion press|mascot books",
    re.IGNORECASE,
)

ENGLISH_WORDS = {"the", "and", "to", "a", "of", "is", "in", "his", "her", "with", "for", "when", "she", "he"}


def is_english(text):
    """Google sometimes says a book is in English when its description isn't (like a Danish edition)."""
    words = re.findall(r"[a-zA-Z']+", text.lower())[:60]
    return len(words) < 8 or sum(1 for word in words if word in ENGLISH_WORDS) >= 4


@lru_cache(maxsize=256)
def google_topic_books(topics):
    """Kids' story books on these topics straight from Google Books, to add to Open Library's
    popular books (for topics like art, where Open Library only has a few)."""
    words = " ".join(f'"{t}"' if " " in t else t for t in topics)
    books = search_books(f'{words} subject:"juvenile fiction"', "en")
    return tuple(
        book for book in books
        if "juvenile" in " ".join(book.get("categories", [])).lower()
        and "young adult" not in " ".join(book.get("categories", [])).lower()
    )


def google_kids_book(title, author):
    """The Google Books version of a book, only if Google says it's a kids' book.
    If Google has a hiccup, this one book is skipped (and tried again next time)."""
    try:
        return _google_kids_book(title, author)
    except requests.RequestException as error:
        print("Google Books error:", repr(error))
        return None


@lru_cache(maxsize=512)
def _google_kids_book(title, author):
    query = f'intitle:"{title}"' + (f' inauthor:"{author}"' if author else "")
    wanted = title_key(title)
    for book in search_books(query, "en"):
        # the same book, not just a similar title ("Explores the Senses" is not "In the Time of the Dinosaurs")
        if title_key(book["title"]) != wanted:
            continue
        categories = " ".join(book.get("categories", [])).lower()
        if "juvenile" in categories and "young adult" not in categories:
            return book
    return None


def recommend_books(topics, interests, age, exclude, limit=3, reading_age=None, interest_topics=()):
    """Up to `limit` good books for the topics (like ["ghost", "dinosaur"]).

    Ranked by how much each book's story (read from its description) is about the topics
    and the kid's interests, and by how popular it is.
    Books in `exclude` (titles already suggested or on the bookshelf) are skipped.
    reading_age is how well the kid reads (from their reading level), used for book length.
    interest_topics are the kid's profile picks as topics (like ["dog", "funny"]): we also look for
    books that mix the asked-for topic with them, like a ghost story with a dog.
    """
    reading_age = reading_age or age
    subjects = tuple(SUBJECTS[t] for t in topics if t in SUBJECTS)
    if not subjects:
        return []

    asked = [t for t in topics if t in SUBJECTS]
    extra = [t for t in interest_topics if t in SUBJECTS and t not in asked][:3]

    # Each search: Open Library subjects, the topics the story must be about, which asked-for
    # topics a book from it matches, and how many of the asked-for topics that is.
    #   1. what was asked + one of the kid's profile interests (a ghost story with a dog)
    #   2. just what was asked (ghost + dinosaur together)
    #   3. if two things were asked and nothing has both, each one on its own
    searches = [
        {"subjects": (*subjects, SUBJECTS[t]), "check": [*asked, t], "matched": asked, "interest": True}
        for t in extra
    ]
    searches.append({"subjects": subjects, "check": asked, "matched": asked, "interest": False})
    if len(asked) > 1:
        searches += [{"subjects": (SUBJECTS[t],), "check": [t], "matched": [t], "interest": False} for t in asked]

    interest_words = [i.lower() for i in interests]
    excluded = {title_key(t) for t in exclude}

    candidates = []
    seen = set()

    for search_number, search_info in enumerate(searches):
        search = search_info["subjects"]
        try:
            docs = popular_books(search)
        except requests.RequestException as error:
            print("Open Library error:", repr(error))  # skip this search, try the others
            continue
        for doc in docs:
            key = title_key(doc.get("title", ""))
            if not key or key in seen or key in excluded:
                continue
            seen.add(key)

            subjects_text = " ".join(doc.get("subject", [])).lower()
            pages = doc.get("number_of_pages_median")
            if mentions(subjects_text, NOT_FOR_KIDS):
                continue
            if age <= 8 and mentions(subjects_text, TOO_HEAVY_FOR_YOUNGER):
                continue
            if age <= 8 and OLDER_CLASSICS & {subject.lower() for subject in doc.get("subject", [])}:
                continue
            if pages and not (min_pages(age) <= pages <= max_pages(reading_age)):
                continue

            # how popular it is (0 to about 4.5), plus a little for subjects that match the kid's interests
            matches = sum(1 for word in interest_words if word.rstrip("s") in subjects_text)
            popularity = math.log10((doc.get("readinglog_count") or 0) + 1) + 0.5 * matches
            candidates.append((search_number, popularity, doc, None))

    # More books straight from Google Books, for topics where Open Library has only a few.
    # They go through all the same checks below. Google rarely has ratings, so they rank a bit
    # below Open Library's well-loved books and mostly fill the gaps.
    for search_number, search_info in enumerate(searches):
        try:
            google_books = google_topic_books(tuple(search_info["check"]))
        except requests.RequestException as error:
            print("Google Books error:", repr(error))
            continue
        for book in google_books:
            key = title_key(book["title"])
            if not key or key in seen or key in excluded:
                continue
            seen.add(key)
            publisher = (book.get("publisher") or "").lower()
            self_published = (
                    not publisher
                    or SELF_PUBLISHERS.search(publisher)
                    or any(name.lower() in publisher for name in book.get("authors", []))  # the author published it
            )
            if self_published or not is_english(book.get("description", "")):
                continue  # no editor checked it, or not in English
            pages = book.get("pageCount") or 0
            if pages and not (min_pages(age) <= pages <= max_pages(reading_age)):
                continue
            popularity = 0.5 * math.log10((book.get("ratingsCount") or 0) + 1)
            doc = {"title": book["title"], "author_name": book.get("authors", []), "subject": []}
            candidates.append((search_number, popularity, doc, book))

    # Read the descriptions of the most popular books from each search (Google Books),
    # and score each one on how much its story is really about the topics and the kid's interests
    candidates.sort(key=lambda c: (c[0], -c[1]))
    scored = []
    checked = {}  # how many books we've read per search, from each source
    for search_number, popularity, doc, found_on_google in candidates:
        # the most popular few per search and source, to save Google searches
        budget = (search_number, found_on_google is not None)
        limit_here = 4 if searches[search_number]["interest"] or found_on_google else 10
        if checked.get(budget, 0) >= limit_here:
            continue
        checked[budget] = checked.get(budget, 0) + 1
        authors = doc.get("author_name") or []
        author = authors[0] if authors else ""
        book = found_on_google or google_kids_book(doc["title"], author)
        if not book or title_key(book["title"]) in excluded:
            continue

        description = book.get("description", "").lower()
        if NOT_A_STORY.search(book["title"]):
            continue  # an activity, coloring, or drawing book
        if GROWN_UP_DESCRIPTION.search(description):
            continue  # a teen or grown-up book
        if age <= 8 and VIOLENT_STORY.search(description):
            continue  # too violent for younger kids
        if not fits_age(book, doc, age, reading_age):
            continue  # for older (or younger) kids, or too hard (or too easy) to read
        topic_scores = [topic_score(book, t) for t in searches[search_number]["check"]]
        if min(topic_scores) == 0:
            continue  # the story isn't about one of the topics
        # the kid's profile interests count a lot: a ghost story with a dog, for a kid who loves dogs
        score = (
                popularity
                + sum(topic_scores)
                + 2 * interest_score(book, interests)
                + 2 * category_interest_score(book, interests)
        )
        scored.append((search_number, score, author, book))

    # books that match more of what was asked first (ghost + dinosaur over just ghost),
    # then the best scores, which include how much the story fits the kid's interests
    scored.sort(key=lambda c: (-len(searches[c[0]]["matched"]), -c[1]))

    books = []
    used_authors = set()
    for search_number, _, author, book in scored:
        if author and author in used_authors:
            continue  # one book per author, so kids see some variety
        if title_key(book["title"]) in excluded:
            continue
        # which of the asked-for topics this book really matches, so the chat can be honest
        # ("I couldn't find a magic book about art, but here's a magic one")
        books.append({**book, "matchedTopics": searches[search_number]["matched"]})
        excluded.add(title_key(book["title"]))
        used_authors.add(author)
        if len(books) == limit:
            break
    return books


@lru_cache(maxsize=512)
def well_known_kids_book(title):
    """A well-known kids' book with exactly this title, or None.
    For things kids type like "cat in the hat" or "dog man": it only counts as a book if lots of
    readers know it (Open Library), so "playing outside" isn't mistaken for a book."""
    try:
        response = requests.get(
            OPEN_LIBRARY_URL,
            params={"title": title, "limit": 5, "fields": "title,author_name,readinglog_count"},
            headers={"User-Agent": "BookBuddy (kids reading app)"},
            timeout=10,
        )
        response.raise_for_status()
    except requests.RequestException as error:
        print("Open Library error:", repr(error))
        return None

    for doc in response.json().get("docs", []):
        if title_key(doc.get("title", "")) != title_key(title):
            continue
        if (doc.get("readinglog_count") or 0) < 25:
            continue  # not well known
        authors = doc.get("author_name") or []
        book = google_kids_book(doc["title"], authors[0] if authors else "")
        if book:
            return book
    return None


# Find books similar to a specific book, not just books about the same topic.

SIMILARITY_STOP_WORDS = {
    "about", "after", "again", "also", "another", "because",
    "before", "book", "books", "could", "every", "first",
    "from", "have", "into", "just", "more", "most", "other",
    "over", "read", "reader", "readers", "really", "some",
    "story", "stories", "their", "there", "these", "they",
    "this", "those", "through", "very", "when", "where",
    "which", "while", "with", "would", "young", "children",
    "child", "author", "edition", "series", "novel",
}


def similarity_words(text):
    """Important words from a book's title or description."""
    return {
        word
        for word in re.findall(r"[a-z]{4,}", text.lower())
        if word not in SIMILARITY_STOP_WORDS
    }


def similarity_score(original, candidate):
    """Compare two books using their actual information."""

    original_title = similarity_words(original.get("title", ""))
    candidate_title = similarity_words(candidate.get("title", ""))

    original_story = similarity_words(story_text(original))
    candidate_story = similarity_words(story_text(candidate))

    original_categories = {
        category.lower()
        for category in original.get("categories", [])
    }

    candidate_categories = {
        category.lower()
        for category in candidate.get("categories", [])
    }

    title_overlap = len(original_title & candidate_title)
    story_overlap = len(original_story & candidate_story)
    category_overlap = len(original_categories & candidate_categories)

    # Categories and themes matter more than sharing a random word.
    score = (
            3 * title_overlap
            + min(story_overlap, 10)
            + 5 * category_overlap
    )

    return score


# Important characteristics of popular children's books.
# These help Buddy understand what makes two books similar.
KNOWN_BOOK_STYLES = {
    "matilda": {
        "topics": ["magic", "school", "funny"],
        "format": "chapter",
        "titles": [
            "The Worst Witch",
            "The Witches",
            "The Magic Finger",
            "The BFG",
        ],
    },
    "dogman": {
        "topics": ["comic", "funny", "adventure"],
        "format": "graphic",
        "titles": [
            "Cat Kid Comic Club",
            "The Bad Guys",
            "InvestiGators",
            "Captain Underpants",
        ],
    },
    "charlottesweb": {
        "topics": ["animal", "friend"],
        "format": "chapter",
        "titles": [
            "The One and Only Ivan",
            "The Tale of Despereaux",
            "Because of Winn-Dixie",
            "The Trumpet of the Swan",
        ],
    },
    "diaryofawimpykid": {
        "topics": ["funny", "school", "friend"],
        "format": "chapter",
        "titles": [
            "Dork Diaries",
            "Big Nate",
            "The Last Kids on Earth",
            "Middle School: The Worst Years of My Life",
        ],
    },
}


def book_format(book):
    """Estimate whether a book is a graphic novel, picture book, or chapter book."""
    categories = " ".join(book.get("categories", [])).lower()
    description = book.get("description", "").lower()

    text = categories + " " + description

    if any(word in text for word in [
        "graphic novel",
        "comic book",
        "comics & graphic novels",
    ]):
        return "graphic"

    if any(word in text for word in [
        "picture book",
        "board book",
    ]):
        return "picture"

    return "chapter"


def recommend_similar_books(
        original,
        age,
        reading_age=None,
        exclude=None,
        limit=3,
):
    """Find books similar in genre, format, and story themes."""

    reading_age = reading_age or age

    # Don't recommend the original book or books already suggested.
    excluded = {title_key(t) for t in (exclude or [])}
    excluded.add(title_key(original.get("title", "")))

    original_key = title_key(original.get("title", ""))
    known = KNOWN_BOOK_STYLES.get(original_key)

    # Use known themes for popular children's books.
    if known:
        topics = known["topics"]
        wanted_format = known["format"]

    # For unfamiliar books, figure out the themes from the description.
    else:
        topics = sorted(
            SUBJECTS,
            key=lambda t: topic_score(original, t),
            reverse=True,
        )

        topics = [
            t for t in topics
            if topic_score(original, t) > 0
        ][:3]

        wanted_format = book_format(original)

    candidates = []
    seen = set(excluded)

    # First look for books known to be similar.
    if known:
        for title in known["titles"]:
            book = google_kids_book(title, "")

            if not book:
                continue

            key = title_key(book["title"])

            if key in seen:
                continue

            # Apply the same basic age and reading-level safeguards.
            description = book.get("description", "").lower()
            pages = book.get("pageCount") or 0

            # Skip activity books, coloring books, etc.
            if NOT_A_STORY.search(book["title"]):
                continue

            # Skip teen or grown-up books.
            if GROWN_UP_DESCRIPTION.search(description):
                continue

            # Skip violent stories for younger kids.
            if age <= 8 and VIOLENT_STORY.search(description):
                continue

            # Check book length against reading ability.
            if pages and not (
                    min_pages(age) <= pages <= max_pages(reading_age)
            ):
                continue

            # Use existing age and reading-level checks.
            doc = {
                "title": book["title"],
                "subject": [],
            }

            if not fits_age(book, doc, age, reading_age):
                continue

            # Prefer the same format as the original book.
            candidate_format = book_format(book)

            if wanted_format == "graphic" and candidate_format != "graphic":
                continue

            if wanted_format == "chapter" and candidate_format == "picture":
                continue

            seen.add(key)

            # Known similar books get priority.
            candidates.append((100, book))

    # Then search for books with matching topics.
    searches = [
        topics[:2],
        topics[1:3],
        topics[:1],
    ]

    for search_topics in searches:
        if not search_topics:
            continue

        try:
            results = recommend_books(
                topics=search_topics,
                interests=[],
                age=age,
                exclude=list(seen),
                limit=10,
                reading_age=reading_age,
            )

        except requests.RequestException as error:
            print("Similar book search error:", repr(error))
            continue

        for book in results:
            key = title_key(book["title"])

            if key in seen:
                continue

            seen.add(key)

            # Compare the candidate with the original book.
            score = similarity_score(original, book)

            candidate_format = book_format(book)

            # Strongly prefer books with the same format.
            if candidate_format == wanted_format:
                score += 20

            elif wanted_format == "graphic":
                score -= 20

            else:
                score -= 8

            # Reward matching story themes.
            score += sum(
                4 * topic_score(book, topic)
                for topic in topics
            )

            candidates.append((score, book))

    # Best matches first.
    candidates.sort(
        key=lambda item: item[0],
        reverse=True,
    )

    return [
        book
        for _, book in candidates[:limit]
    ]