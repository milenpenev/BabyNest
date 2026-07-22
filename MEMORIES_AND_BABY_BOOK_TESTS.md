# Memories & Baby Book verification

## Memories

1. Open `/memories` with a selected baby and create a manual memory with title, date, description and tags.
2. Add one photo on Free. Confirm a second photo is rejected with Premium copy. Switch to Premium and add multiple photos.
3. Refresh and confirm memories/photos remain available offline.
4. Edit an automatic memory, favorite it, then delete it. Refresh and confirm the deleted automatic source does not return.
5. Record the first bottle, breastfeeding, bath and diaper; confirm one automatic memory per first event.
6. Mark social smile and first steps observed; add custom tooth/crawl milestones; confirm automatic memories.
7. Add growth records and complete a vaccination; confirm linked memories.
8. Verify the first-birthday memory is generated only after that date.
9. Search by title, tag, month number, year, activity ID and milestone ID.
10. Verify Latest, Favorites, This month, This year and Milestones sections.
11. Test automatic Growth, Vacations, Milestones, Vaccinations and Birthdays albums plus a custom album.

## Integrations

12. Select a memory date in Daily History and confirm its special Timeline card.
13. Confirm Dashboard shows On this day when an older matching date exists, otherwise a favorite/recent memory.
14. Confirm the local deterministic story reflects today's memories, sleep and feeding without external requests.
15. Confirm recent memories can produce a low-priority explainable Coach suggestion.
16. Export a Doctor Report covering a family-visible memory and confirm its Memories section.
17. Switch family members; create/edit/delete memories and confirm author plus Family audit entries.

## Baby Book and presentation

18. Free: confirm Baby Book content is Premium-gated.
19. Premium: open `/memories/book`; inspect Birth, Growth, Sleep, Feeding, Milestones, Vaccinations, Memories, Photos, Funny moments and Family.
20. Use Print / Save PDF and verify a clean printable document.
21. Test BG/EN, light/dark/system and widths 375, 768, 1024 and desktop.
22. Run `npm run build`; inspect the console for duplicate automatic keys, store loops and missing translations.

## Cloud extension checks

- Implement `MemoryRepository` and `MemoryMediaStorage` adapters without changing page components.
- Keep stable memory/source/media IDs during upload and sync.
- Add media upload retries and conflict resolution before enabling real-time cloud writes.
