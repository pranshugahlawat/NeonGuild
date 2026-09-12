# Neon Guild — Build Notes

## What it is
A Life RPG web app:
- Quests (one-off) and Daily Habits
- Completing gives XP + Gold
- Non-linear leveling
- Server-side streak tracking
- Attributes (Strength/Intellect/Focus/Vitality)
- Shop + Inventory cosmetics

## Anti-cheat design
Client cannot update XP/Gold/Level/Streak directly.
All progression happens in Postgres RPC:
- complete_quest(quest_id)
- buy_item(item_id)

RLS blocks direct inserts into quest_completions and inventory, and blocks direct updates to profiles/attributes.

## Demo requirements (90–180s)
- signup/login
- create quest + daily habit
- complete both (show confetti + XP change)
- refresh to prove persistence