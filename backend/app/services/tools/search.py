from duckduckgo_search import DDGS
from typing import List, Optional

def search_physics_concepts(query: str, max_results: int = 3) -> str:
    """
    Performs a deep web search for physics/engineering concepts using DuckDuckGo.
    Returns a formatted string of results.
    """
    try:
        results = []
        with DDGS() as ddgs:
            # 'text' search is the standard web search
            for r in ddgs.text(query, max_results=max_results):
                results.append(f"Title: {r['title']}\nSource: {r['href']}\nSnippet: {r['body']}")
        
        if not results:
            return "No external verification data found."
            
        return "\n\n".join(results)
    except Exception as e:
        return f"External verification failed: {str(e)}"
