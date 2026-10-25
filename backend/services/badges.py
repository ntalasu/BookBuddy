from datetime import date, datetime, timedelta, timezone

# Every badge a student can earn.
# "kind" is what the badge counts, "goal" is how much of it is needed.
BADGES = [
    {"id": "1", "name": "First Page", "criteria": "Read for 10 minutes", "kind": "minutes", "goal": 10, "emoji": "📖"},
    {"id": "2", "name": "Bookworm", "criteria": "Read for 60 minutes", "kind": "minutes", "goal": 60, "emoji": "🐛"},
    {"id": "3", "name": "Reading Star", "criteria": "Read for 180 minutes", "kind": "minutes", "goal": 180, "emoji": "⭐"},
    {"id": "4", "name": "Book Champion", "criteria": "Read for 300 minutes", "kind": "minutes", "goal": 300, "emoji": "🏆"},
    {"id": "5", "name": "On a Roll", "criteria": "Read 3 days in a row", "kind": "streak", "goal": 3, "emoji": "🔥"},
    {"id": "6", "name": "Week Warrior", "criteria": "Read 7 days in a row", "kind": "streak", "goal": 7, "emoji": "📅"},
    {"id": "7", "name": "Unstoppable", "criteria": "Read 14 days in a row", "kind": "streak", "goal": 14, "emoji": "🚀"},
    {"id": "8", "name": "Reading Legend", "criteria": "Read for 600 minutes", "kind": "minutes", "goal": 600, "emoji": "🦄"},
    {"id": "9", "name": "Library Hero", "criteria": "Read for 1,000 minutes", "kind": "minutes", "goal": 1000, "emoji": "📚"},
    {"id": "10", "name": "Marathon Reader", "criteria": "Read for 30 minutes at once", "kind": "longSession", "goal": 30, "emoji": "⏱️"},
    {"id": "11", "name": "Super Focus", "criteria": "Read for 60 minutes at once", "kind": "longSession", "goal": 60, "emoji": "🎯"},
    {"id": "12", "name": "Bedtime Reader", "criteria": "Read after 7pm", "kind": "bedtime", "goal": 1, "emoji": "🌙"},
    {"id": "13", "name": "Night Owl", "criteria": "Read after 7pm 5 times", "kind": "bedtime", "goal": 5, "emoji": "🦉"},
    {"id": "14", "name": "Early Bird", "criteria": "Read before 9am", "kind": "earlyBird", "goal": 1, "emoji": "🐦"},
    {"id": "15", "name": "Weekend Reader", "criteria": "Read on 4 weekend days", "kind": "weekend", "goal": 4, "emoji": "🛋️"},
    {"id": "16", "name": "Growing Reader", "criteria": "Read on 10 different days", "kind": "daysRead", "goal": 10, "emoji": "🌱"},
    {"id": "17", "name": "Mighty Oak", "criteria": "Read on 30 different days", "kind": "daysRead", "goal": 30, "emoji": "🌳"},
]


# Convert a UTC time to the student's own clock.
# utc_offset_minutes comes from JavaScript's getTimezoneOffset(),
# so it is positive west of UTC (e.g. 420 for California in summer).
def to_local_time(utc_time, utc_offset_minutes):
    return utc_time - timedelta(minutes=utc_offset_minutes)


def parse_utc(timestamp):
    parsed = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def get_streaks(days_read: set[date], today: date):
    read_today = today in days_read

    # The streak is still alive if they read yesterday but haven't read yet today
    current_streak = 0
    day = today if read_today else today - timedelta(days=1)
    while day in days_read:
        current_streak += 1
        day -= timedelta(days=1)

    # Longest run ever, so streak badges stay earned after a streak ends
    longest_streak = 0
    for start in days_read:
        if start - timedelta(days=1) in days_read:
            continue  # not the first day of a run
        length = 0
        while start + timedelta(days=length) in days_read:
            length += 1
        longest_streak = max(longest_streak, length)

    return current_streak, longest_streak, read_today


def get_progress(logs, utc_offset_minutes):
    local_times = [
        to_local_time(parse_utc(log["loggedAt"]), log["utcOffsetMinutes"])
        for log in logs
    ]
    days_read = {t.date() for t in local_times}

    today = to_local_time(datetime.now(timezone.utc), utc_offset_minutes).date()
    current_streak, longest_streak, read_today = get_streaks(days_read, today)

    stats = {
        "minutes": sum(log["minutesRead"] for log in logs),
        "streak": longest_streak,
        "longSession": max((log["minutesRead"] for log in logs), default=0),
        "bedtime": sum(1 for t in local_times if t.hour >= 19),
        "earlyBird": sum(1 for t in local_times if t.hour < 9),
        "weekend": len({d for d in days_read if d.weekday() >= 5}),
        "daysRead": len(days_read),
    }

    return {
        "totalMinutes": stats["minutes"],
        "currentStreak": current_streak,
        "longestStreak": longest_streak,
        "readToday": read_today,
        "badges": BADGES,
        "earnedBadgeIds": [b["id"] for b in BADGES if stats[b["kind"]] >= b["goal"]],
    }
