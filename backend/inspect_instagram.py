import re
import requests

url = 'https://www.instagram.com/papirbenett/'
r = requests.get(url, headers={
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9'
})
print('status', r.status_code)
text = r.text
patterns = [
    r'window\\.__additionalDataLoaded\\([^,]+,(\\{.*?\\})\\);',
    r'window\\._sharedData\\s*=\\s*(\\{.*?\\});',
    r'"shortcode":"([^"]+)"',
    r'edge_owner_to_timeline_media',
]
for pat in patterns:
    m = re.search(pat, text, re.S)
    if m:
        print('PATTERN', pat)
        print((m.group(1) if m.lastindex else m.group(0))[:2000])
        print('---')
print('shortcodes', re.findall(r'\"shortcode\":\"([^\"]+)\"', text)[:10])
