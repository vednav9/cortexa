"""
Web search functionality
"""
from duckduckgo_search import DDGS
import requests
from bs4 import BeautifulSoup
from typing import List, Dict
import time

class WebSearcher:
    def __init__(self):
        self.ddgs = DDGS()
    
    def search(self, query: str, max_results: int = 5) -> List[Dict]:
        """
        Search the web and return results
        
        Args:
            query: Search query
            max_results: Maximum number of results
            
        Returns:
            List of search results with title, snippet, link
        """
        try:
            results = []
            
            # Search using DuckDuckGo
            search_results = self.ddgs.text(query, max_results=max_results)
            
            for i, result in enumerate(search_results):
                results.append({
                    'title': result.get('title', 'No title'),
                    'snippet': result.get('body', 'No description'),
                    'url': result.get('href', ''),
                    'source_type': 'web',
                    'index': i
                })
            
            return results
        
        except Exception as e:
            print(f"Web search error: {e}")
            return []
    
    def get_page_content(self, url: str, max_chars: int = 1000) -> str:
        """
        Fetch and extract text content from a web page
        
        Args:
            url: URL to fetch
            max_chars: Maximum characters to extract
            
        Returns:
            Extracted text content
        """
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            
            response = requests.get(url, headers=headers, timeout=5)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Remove script and style elements
            for script in soup(["script", "style"]):
                script.decompose()
            
            # Get text
            text = soup.get_text()
            
            # Clean up text
            lines = (line.strip() for line in text.splitlines())
            chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
            text = ' '.join(chunk for chunk in chunks if chunk)
            
            return text[:max_chars]
        
        except Exception as e:
            print(f"Error fetching {url}: {e}")
            return ""

# Singleton
_web_searcher = None

def get_web_searcher() -> WebSearcher:
    """Get or create WebSearcher instance"""
    global _web_searcher
    if _web_searcher is None:
        _web_searcher = WebSearcher()
    return _web_searcher
