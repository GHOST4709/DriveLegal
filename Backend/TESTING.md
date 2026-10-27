# Running backend tests

Run these commands from the `Backend` directory after activating the backend's virtual environment:

```bash
python -m pip install pytest httpx
python -m pytest -v
```

The tests use a temporary in-memory SQLite database and fixed sample traffic-law records. They do not modify `bimstec_traffic.db`. The chatbot test covers request validation only; no live AI provider or web search is called.
